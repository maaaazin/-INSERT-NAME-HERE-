#!/usr/bin/env node

import http from 'http';
import https from 'https';
import { performance } from 'perf_hooks';

// Configuration
const config = {
  baseUrl: process.env.API_URL || 'http://localhost',
  totalRequests: parseInt(process.env.TOTAL_REQUESTS || '1000'),
  concurrent: parseInt(process.env.CONCURRENT || '50'),
  duration: parseInt(process.env.DURATION || '60'), // seconds
  endpoints: [
    { path: '/health', method: 'GET', weight: 30 },
    { path: '/api/queue/stats', method: 'GET', weight: 10 },
    { path: '/api/assignments', method: 'GET', weight: 20 },
    { path: '/api/submissions/execute', method: 'POST', weight: 40, needsAuth: true },
  ],
  token: process.env.TEST_TOKEN || '', // JWT token for authenticated requests
};

// Statistics
const stats = {
  total: 0,
  success: 0,
  errors: 0,
  rateLimited: 0,
  responseTimes: [],
  statusCodes: {},
  errorsByType: {},
  startTime: null,
  endTime: null,
};

// Request queue
let activeRequests = 0;
let completedRequests = 0;
let isRunning = false;

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Make HTTP request
function makeRequest(endpoint) {
  return new Promise((resolve) => {
    const startTime = performance.now();
    const url = new URL(endpoint.path, config.baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (endpoint.needsAuth && config.token) {
      options.headers['Authorization'] = `Bearer ${config.token}`;
    }

    if (endpoint.method === 'POST') {
      options.headers['Content-Length'] = JSON.stringify({
        assignment_id: 5,
        code: 'print("test")',
        language: 'python',
        student_id: 2,
        runOnly: false,
      }).length;
    }

    const protocol = url.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        stats.total++;
        stats.responseTimes.push(responseTime);
        
        // Track status codes
        const statusCode = res.statusCode;
        stats.statusCodes[statusCode] = (stats.statusCodes[statusCode] || 0) + 1;

        if (statusCode >= 200 && statusCode < 300) {
          stats.success++;
        } else if (statusCode === 429) {
          stats.rateLimited++;
          stats.errors++;
          stats.errorsByType['Rate Limited'] = (stats.errorsByType['Rate Limited'] || 0) + 1;
        } else {
          stats.errors++;
          const errorType = `HTTP ${statusCode}`;
          stats.errorsByType[errorType] = (stats.errorsByType[errorType] || 0) + 1;
        }

        activeRequests--;
        completedRequests++;
        resolve();
      });
    });

    req.on('error', (error) => {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      stats.total++;
      stats.responseTimes.push(responseTime);
      stats.errors++;
      stats.errorsByType[error.code || 'Connection Error'] = 
        (stats.errorsByType[error.code || 'Connection Error'] || 0) + 1;
      
      activeRequests--;
      completedRequests++;
      resolve();
    });

    req.setTimeout(30000, () => {
      req.destroy();
      stats.errors++;
      stats.errorsByType['Timeout'] = (stats.errorsByType['Timeout'] || 0) + 1;
      activeRequests--;
      completedRequests++;
      resolve();
    });

    if (endpoint.method === 'POST') {
      req.write(JSON.stringify({
        assignment_id: 5,
        code: 'print("test")',
        language: 'python',
        student_id: 2,
        runOnly: false,
      }));
    }

    req.end();
  });
}

// Select endpoint based on weights
function selectEndpoint() {
  const totalWeight = config.endpoints.reduce((sum, e) => sum + e.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const endpoint of config.endpoints) {
    random -= endpoint.weight;
    if (random <= 0) {
      return endpoint;
    }
  }
  return config.endpoints[0];
}

// Send requests
async function sendRequests() {
  while (isRunning || activeRequests > 0) {
    while (activeRequests < config.concurrent && isRunning) {
      activeRequests++;
      const endpoint = selectEndpoint();
      makeRequest(endpoint);
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

// Display metrics
function displayMetrics() {
  const elapsed = (performance.now() - stats.startTime) / 1000;
  const rps = stats.total / elapsed;
  const avgResponseTime = stats.responseTimes.length > 0
    ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
    : 0;
  const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)] || 0;
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  const min = sortedTimes[0] || 0;
  const max = sortedTimes[sortedTimes.length - 1] || 0;

  const successRate = stats.total > 0 ? (stats.success / stats.total * 100).toFixed(2) : 0;
  const errorRate = stats.total > 0 ? (stats.errors / stats.total * 100).toFixed(2) : 0;

  console.clear();
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              BACKEND LOAD TEST METRICS                      ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  log(`📊 Total Requests:     ${stats.total.toLocaleString()}`, 'blue');
  log(`✅ Successful:         ${stats.success.toLocaleString()} (${successRate}%)`, 'green');
  log(`❌ Errors:             ${stats.errors.toLocaleString()} (${errorRate}%)`, 'red');
  log(`⏱️  Rate Limited:       ${stats.rateLimited.toLocaleString()}`, 'yellow');
  log(`🔄 Active Requests:    ${activeRequests}`, 'magenta');
  log('');
  log('📈 Performance Metrics:', 'cyan');
  log(`   Requests/sec:       ${rps.toFixed(2)}`, 'blue');
  log(`   Avg Response Time:  ${avgResponseTime.toFixed(2)}ms`, 'blue');
  log(`   Min:                ${min.toFixed(2)}ms`, 'blue');
  log(`   Max:                ${max.toFixed(2)}ms`, 'blue');
  log(`   P50 (Median):       ${p50.toFixed(2)}ms`, 'blue');
  log(`   P95:                ${p95.toFixed(2)}ms`, 'blue');
  log(`   P99:                ${p99.toFixed(2)}ms`, 'blue');
  log('');
  log('📋 Status Code Distribution:', 'cyan');
  Object.entries(stats.statusCodes)
    .sort((a, b) => b[1] - a[1])
    .forEach(([code, count]) => {
      const color = code.startsWith('2') ? 'green' : code.startsWith('4') ? 'yellow' : 'red';
      log(`   ${code}: ${count.toLocaleString()}`, color);
    });
  log('');
  if (Object.keys(stats.errorsByType).length > 0) {
    log('⚠️  Error Breakdown:', 'yellow');
    Object.entries(stats.errorsByType)
      .sort((a, b) => b[1] - a[1])
      .forEach(([type, count]) => {
        log(`   ${type}: ${count.toLocaleString()}`, 'red');
      });
    log('');
  }
  log(`⏱️  Elapsed Time:      ${elapsed.toFixed(2)}s`, 'magenta');
  log('');
}

// Main function
async function main() {
  log('🚀 Starting Load Test...', 'green');
  log(`   Target: ${config.baseUrl}`, 'blue');
  log(`   Concurrent: ${config.concurrent}`, 'blue');
  log(`   Duration: ${config.duration}s`, 'blue');
  log(`   Total Requests: ${config.totalRequests}`, 'blue');
  log('');

  stats.startTime = performance.now();
  isRunning = true;

  // Start sending requests
  const requestPromise = sendRequests();

  // Display metrics every second
  const metricsInterval = setInterval(() => {
    displayMetrics();
    if (!isRunning && activeRequests === 0) {
      clearInterval(metricsInterval);
    }
  }, 1000);

  // Stop after duration
  setTimeout(() => {
    isRunning = false;
    log('\n⏹️  Stopping load test...', 'yellow');
  }, config.duration * 1000);

  // Wait for all requests to complete
  await requestPromise;
  stats.endTime = performance.now();

  clearInterval(metricsInterval);
  displayMetrics();

  // Display observations and system health
  displayObservationsAndHealth();

  log('');
  log('✅ Load test completed!', 'green');
  log('');
  log('💡 Tips:', 'cyan');
  log('   - Check queue stats: curl http://localhost/api/queue/stats', 'blue');
  log('   - View Docker logs: docker-compose logs -f backend', 'blue');
  log('   - Monitor resources: docker stats', 'blue');
}

// Display observations and system health analysis
function displayObservationsAndHealth() {
  const elapsed = (stats.endTime - stats.startTime) / 1000;
  const rps = stats.total / elapsed;
  const avgResponseTime = stats.responseTimes.length > 0
    ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
    : 0;
  const sortedTimes = [...stats.responseTimes].sort((a, b) => a - b);
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)] || 0;
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)] || 0;
  
  const successRate = stats.total > 0 ? (stats.success / stats.total * 100) : 0;
  const errorRate = stats.total > 0 ? (stats.errors / stats.total * 100) : 0;
  
  // Calculate status code percentages
  const status404 = stats.statusCodes[404] || 0;
  const status502 = stats.statusCodes[502] || 0;
  const status200 = stats.statusCodes[200] || 0;
  const status401 = stats.statusCodes[401] || 0;
  
  const pct404 = stats.total > 0 ? (status404 / stats.total * 100).toFixed(2) : 0;
  const pct502 = stats.total > 0 ? (status502 / stats.total * 100).toFixed(2) : 0;
  
  log('');
  log('╔══════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              OBSERVATIONS & SYSTEM HEALTH                   ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════════╝', 'cyan');
  log('');
  
  // Observations
  log('📊 Observations:', 'cyan');
  log('');
  
  // Throughput analysis
  if (rps >= 3000) {
    log(`   ✅ Excellent Throughput: ${rps.toFixed(0)} RPS`, 'green');
    log('      System is handling high load efficiently', 'blue');
  } else if (rps >= 1000) {
    log(`   ✅ Good Throughput: ${rps.toFixed(0)} RPS`, 'green');
    log('      System is performing well under load', 'blue');
  } else if (rps >= 500) {
    log(`   ⚠️  Moderate Throughput: ${rps.toFixed(0)} RPS`, 'yellow');
    log('      Consider scaling if load increases', 'blue');
  } else {
    log(`   ⚠️  Low Throughput: ${rps.toFixed(0)} RPS`, 'yellow');
    log('      System may need optimization or scaling', 'blue');
  }
  log('');
  
  // Latency analysis
  if (p99 < 50) {
    log(`   ✅ Excellent Latency: P99 at ${p99.toFixed(2)}ms`, 'green');
    log('      Response times are consistently fast', 'blue');
  } else if (p99 < 200) {
    log(`   ✅ Good Latency: P99 at ${p99.toFixed(2)}ms`, 'green');
    log('      Response times are acceptable', 'blue');
  } else if (p99 < 500) {
    log(`   ⚠️  Moderate Latency: P99 at ${p99.toFixed(2)}ms`, 'yellow');
    log('      Some requests experiencing delays', 'blue');
  } else {
    log(`   ❌ High Latency: P99 at ${p99.toFixed(2)}ms`, 'red');
    log('      System may be overloaded', 'blue');
  }
  log('');
  
  // Error rate analysis
  if (errorRate < 10) {
    log(`   ✅ Low Error Rate: ${errorRate.toFixed(2)}%`, 'green');
    log('      System is stable and reliable', 'blue');
  } else if (errorRate < 30) {
    log(`   ⚠️  Moderate Error Rate: ${errorRate.toFixed(2)}%`, 'yellow');
    log('      Some errors detected, investigate if persistent', 'blue');
  } else {
    log(`   ❌ High Error Rate: ${errorRate.toFixed(2)}%`, 'red');
    log('      Significant issues detected, requires investigation', 'blue');
  }
  log('');
  
  // Rate limiting analysis
  if (stats.rateLimited === 0) {
    log('   ✅ No Rate Limiting Triggered', 'green');
    log('      Rate limiters are active but not being hit', 'blue');
  } else {
    log(`   ⚠️  Rate Limiting Active: ${stats.rateLimited} requests limited`, 'yellow');
    log('      System is protecting against abuse', 'blue');
  }
  log('');
  
  // System Health
  log('🏥 System Health:', 'cyan');
  log('');
  
  // Nginx Load Balancer
  if (status502 === 0) {
    log('   ✅ Nginx Load Balancer: Healthy', 'green');
    log('      All requests routed successfully', 'blue');
  } else if (status502 < stats.total * 0.1) {
    log(`   ⚠️  Nginx Load Balancer: Minor Issues (${pct502}% 502 errors)`, 'yellow');
    log('      Some backend instances may have been overwhelmed', 'blue');
  } else {
    log(`   ❌ Nginx Load Balancer: Issues Detected (${pct502}% 502 errors)`, 'red');
    log('      Backend instances may be overloaded or unhealthy', 'blue');
  }
  log('');
  
  // Backend Instances
  if (status200 > 0 && status502 === 0) {
    log('   ✅ Backend Instances: All Healthy', 'green');
    log('      All instances responding correctly', 'blue');
  } else if (status200 > 0 && status502 < stats.total * 0.1) {
    log('   ⚠️  Backend Instances: Mostly Healthy', 'yellow');
    log('      Some instances experienced temporary overload', 'blue');
  } else if (status200 > 0) {
    log('   ⚠️  Backend Instances: Under Stress', 'yellow');
    log('      Consider scaling up backend instances', 'blue');
  } else {
    log('   ❌ Backend Instances: Critical Issues', 'red');
    log('      No successful responses, check backend health', 'blue');
  }
  log('');
  
  // Expected vs Unexpected Errors
  log('   📋 Error Analysis:', 'cyan');
  if (status404 > 0) {
    log(`      • 404 Errors: ${status404.toLocaleString()} (${pct404}%)`, 'yellow');
    log('        Expected for unauthenticated/protected endpoints', 'blue');
  }
  if (status401 > 0) {
    log(`      • 401 Errors: ${status401.toLocaleString()}`, 'yellow');
    log('        Authentication required for these endpoints', 'blue');
  }
  if (status502 > 0) {
    log(`      • 502 Errors: ${status502.toLocaleString()} (${pct502}%)`, status502 < stats.total * 0.1 ? 'yellow' : 'red');
    log('        Backend instances temporarily unavailable', 'blue');
  }
  log('');
  
  // Overall Assessment
  log('   📊 Overall Assessment:', 'cyan');
  const healthScore = calculateHealthScore(rps, p99, errorRate, status502, stats.total);
  if (healthScore >= 80) {
    log('      ✅ System is performing excellently', 'green');
    log('      Ready for production load', 'blue');
  } else if (healthScore >= 60) {
    log('      ✅ System is performing well', 'green');
    log('      Minor optimizations may improve performance', 'blue');
  } else if (healthScore >= 40) {
    log('      ⚠️  System is functional but needs attention', 'yellow');
    log('      Consider scaling or optimization', 'blue');
  } else {
    log('      ❌ System is experiencing issues', 'red');
    log('      Requires immediate investigation and scaling', 'blue');
  }
  log('');
}

// Calculate overall health score (0-100)
function calculateHealthScore(rps, p99, errorRate, status502, total) {
  let score = 100;
  
  // Throughput score (max 30 points)
  if (rps >= 3000) score += 0;
  else if (rps >= 1000) score -= 5;
  else if (rps >= 500) score -= 15;
  else score -= 25;
  
  // Latency score (max 30 points)
  if (p99 < 50) score += 0;
  else if (p99 < 200) score -= 5;
  else if (p99 < 500) score -= 15;
  else score -= 25;
  
  // Error rate score (max 25 points)
  if (errorRate < 10) score += 0;
  else if (errorRate < 30) score -= 10;
  else score -= 20;
  
  // 502 errors score (max 15 points)
  const pct502 = total > 0 ? (status502 / total * 100) : 0;
  if (pct502 === 0) score += 0;
  else if (pct502 < 5) score -= 5;
  else if (pct502 < 10) score -= 10;
  else score -= 15;
  
  return Math.max(0, Math.min(100, score));
}

// Handle Ctrl+C
process.on('SIGINT', () => {
  log('\n\n⏹️  Stopping load test...', 'yellow');
  isRunning = false;
  setTimeout(() => {
    stats.endTime = performance.now();
    displayMetrics();
    displayObservationsAndHealth();
    log('\n✅ Load test stopped.', 'green');
    process.exit(0);
  }, 2000);
});

main().catch(console.error);


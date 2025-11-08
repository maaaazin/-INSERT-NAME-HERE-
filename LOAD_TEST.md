# Load Testing Guide

Two load testing scripts to stress test your backend and display metrics.

## Scripts Available

### 1. Advanced Load Test (Node.js) - `load-test.js`
Full-featured load testing with real-time metrics display.

### 2. Simple Load Test (Bash) - `load-test-simple.sh`
Lightweight script using curl, no dependencies.

## Quick Start

### Option 1: Advanced Load Test (Recommended)

```bash
# Basic usage
node load-test.js

# With custom settings
API_URL=http://localhost \
TOTAL_REQUESTS=2000 \
CONCURRENT=100 \
DURATION=120 \
node load-test.js

# With authentication token
TEST_TOKEN=your_jwt_token \
node load-test.js
```

### Option 2: Simple Load Test

```bash
# Basic usage (50 concurrent, 1000 total)
./load-test-simple.sh

# Custom: 100 concurrent, 5000 total requests
./load-test-simple.sh 100 5000

# Custom API URL
API_URL=http://localhost:3000 ./load-test-simple.sh
```

## Environment Variables

### Advanced Load Test (`load-test.js`)

- `API_URL` - Base URL (default: `http://localhost`)
- `TOTAL_REQUESTS` - Total requests to send (default: `1000`)
- `CONCURRENT` - Concurrent requests (default: `50`)
- `DURATION` - Test duration in seconds (default: `60`)
- `TEST_TOKEN` - JWT token for authenticated requests

### Simple Load Test (`load-test-simple.sh`)

- `API_URL` - Base URL (default: `http://localhost`)
- Arguments: `[concurrent] [total]`

## What Gets Tested

The load test targets multiple endpoints with different weights:

- **Health Check** (`/health`) - 30% of requests
- **Queue Stats** (`/api/queue/stats`) - 10% of requests
- **Assignments** (`/api/assignments`) - 20% of requests
- **Submissions** (`/api/submissions/execute`) - 40% of requests (POST)

## Metrics Displayed

### Real-time Metrics (Advanced Script)

- ✅ Total requests sent
- ✅ Success rate
- ❌ Error rate
- ⏱️ Rate limited requests
- 📈 Requests per second (RPS)
- ⏱️ Response time statistics:
  - Average
  - Min/Max
  - P50 (Median)
  - P95
  - P99
- 📋 Status code distribution
- ⚠️ Error breakdown by type

### Final Summary (Both Scripts)

- Total requests
- Success/Error counts and percentages
- Rate limited count
- Performance metrics (RPS, response times)
- Status code distribution

## Example Output

```
╔══════════════════════════════════════════════════════════════╗
║              BACKEND LOAD TEST METRICS                      ║
╚══════════════════════════════════════════════════════════════╝

📊 Total Requests:     1,000
✅ Successful:         950 (95.00%)
❌ Errors:             50 (5.00%)
⏱️  Rate Limited:       25
🔄 Active Requests:    0

📈 Performance Metrics:
   Requests/sec:       83.33
   Avg Response Time:  45.23ms
   Min:                12.34ms
   Max:                234.56ms
   P50 (Median):       38.90ms
   P95:                120.45ms
   P99:                198.76ms

📋 Status Code Distribution:
   200: 925
   429: 25
   500: 25
   404: 0
```

## Monitoring During Load Test

### View Backend Logs
```bash
docker-compose logs -f backend
```

### View Worker Logs
```bash
docker-compose logs -f worker
```

### Check Queue Stats
```bash
curl http://localhost/api/queue/stats
```

### Monitor Docker Resources
```bash
docker stats
```

### Check Nginx Logs
```bash
docker-compose logs -f nginx
```

## Testing Different Scenarios

### 1. Light Load Test
```bash
CONCURRENT=10 TOTAL_REQUESTS=100 node load-test.js
```

### 2. Medium Load Test
```bash
CONCURRENT=50 TOTAL_REQUESTS=1000 node load-test.js
```

### 3. Heavy Load Test
```bash
CONCURRENT=200 TOTAL_REQUESTS=10000 DURATION=120 node load-test.js
```

### 4. Stress Test (Find Breaking Point)
```bash
CONCURRENT=500 TOTAL_REQUESTS=50000 DURATION=300 node load-test.js
```

### 5. Test Rate Limiting
```bash
# Send requests faster than rate limit
CONCURRENT=1000 TOTAL_REQUESTS=10000 node load-test.js
```

## Interpreting Results

### Good Performance Indicators
- ✅ Success rate > 95%
- ✅ Average response time < 100ms
- ✅ P95 response time < 500ms
- ✅ Low error rate (< 5%)
- ✅ Consistent RPS

### Warning Signs
- ⚠️ Success rate < 90%
- ⚠️ High error rate (> 10%)
- ⚠️ Many 429 (Rate Limited) responses
- ⚠️ P95 response time > 1000ms
- ⚠️ Increasing response times over time

### Performance Issues
- ❌ Many 500/502/503 errors
- ❌ Response times increasing dramatically
- ❌ Queue backing up (check queue stats)
- ❌ High CPU/Memory usage (check docker stats)

## Tips

1. **Start Small**: Begin with low concurrency and gradually increase
2. **Monitor Resources**: Watch `docker stats` during testing
3. **Check Logs**: Monitor backend and worker logs for errors
4. **Test Queue**: If using queue mode, check queue stats
5. **Scale Gradually**: Increase workers/backends if needed
6. **Rate Limits**: Be aware of rate limiting (429 responses are expected)

## Troubleshooting

### Script Won't Run
```bash
# Make sure Node.js is installed
node --version

# Make scripts executable
chmod +x load-test.js load-test-simple.sh
```

### Connection Refused
```bash
# Check if backend is running
curl http://localhost/health

# Check Docker containers
docker-compose ps
```

### High Error Rate
- Check backend logs: `docker-compose logs backend`
- Verify environment variables in `.env`
- Check if Redis is running: `docker-compose logs redis`
- Verify Nginx is routing correctly: `docker-compose logs nginx`

### Rate Limiting Kicking In
- This is expected behavior
- Adjust rate limits in `nginx/conf.d/default.conf` if needed
- Or reduce concurrent requests in test script

## Advanced Usage

### Custom Endpoints
Edit `load-test.js` to add/modify endpoints in the `config.endpoints` array.

### Continuous Testing
```bash
# Run test for 10 minutes
DURATION=600 node load-test.js
```

### Test Specific Endpoint
Modify the script to only test one endpoint by setting its weight to 100.

## Integration with Monitoring

You can pipe results to files for analysis:
```bash
node load-test.js > load-test-results.txt 2>&1
```

Or use with monitoring tools:
```bash
# Run test and monitor Docker stats
docker stats & node load-test.js
```


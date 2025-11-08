#!/bin/bash

# Simple load test using curl and basic metrics
# Usage: ./load-test-simple.sh [concurrent] [total]

CONCURRENT=${1:-50}
TOTAL=${2:-1000}
API_URL=${API_URL:-"http://localhost"}

echo "🚀 Starting Simple Load Test"
echo "   Target: $API_URL"
echo "   Concurrent: $CONCURRENT"
echo "   Total Requests: $TOTAL"
echo ""

# Create temp file for results
RESULTS_FILE=$(mktemp)
START_TIME=$(date +%s)

# Function to make request
make_request() {
    local start=$(date +%s%N)
    local response=$(curl -s -w "\n%{http_code}\n%{time_total}" \
        -H "Content-Type: application/json" \
        "$API_URL/health" 2>/dev/null)
    local end=$(date +%s%N)
    local http_code=$(echo "$response" | tail -n 2 | head -n 1)
    local time_total=$(echo "$response" | tail -n 1)
    
    echo "$http_code,$time_total" >> "$RESULTS_FILE"
}

# Export function for parallel execution
export -f make_request
export API_URL
export RESULTS_FILE

# Run requests in parallel
seq 1 $TOTAL | xargs -n 1 -P $CONCURRENT -I {} bash -c 'make_request'

END_TIME=$(date +%s)
ELAPSED=$((END_TIME - START_TIME))

# Calculate statistics
TOTAL_REQUESTS=$(wc -l < "$RESULTS_FILE")
SUCCESS=$(grep -c "^2" "$RESULTS_FILE" || echo "0")
ERRORS=$(grep -c "^[45]" "$RESULTS_FILE" || echo "0")
RATE_LIMITED=$(grep -c "^429" "$RESULTS_FILE" || echo "0")

# Calculate response time stats
TIMES=$(cut -d',' -f2 "$RESULTS_FILE" | sort -n)
AVG_TIME=$(echo "$TIMES" | awk '{sum+=$1; count++} END {if(count>0) print sum/count; else print 0}')
MIN_TIME=$(echo "$TIMES" | head -n 1)
MAX_TIME=$(echo "$TIMES" | tail -n 1)
P50=$(echo "$TIMES" | awk 'NR==int(0.5*NR+0.5)' || echo "0")
P95=$(echo "$TIMES" | awk 'NR==int(0.95*NR+0.5)' || echo "0")
P99=$(echo "$TIMES" | awk 'NR==int(0.99*NR+0.5)' || echo "0")

RPS=$(awk "BEGIN {printf \"%.2f\", $TOTAL_REQUESTS/$ELAPSED}")

# Display results
echo ""
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║              LOAD TEST RESULTS                               ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Total Requests:     $TOTAL_REQUESTS"
echo "✅ Successful:         $SUCCESS ($(awk "BEGIN {printf \"%.2f\", $SUCCESS/$TOTAL_REQUESTS*100}")%)"
echo "❌ Errors:             $ERRORS ($(awk "BEGIN {printf \"%.2f\", $ERRORS/$TOTAL_REQUESTS*100}")%)"
echo "⏱️  Rate Limited:       $RATE_LIMITED"
echo ""
echo "📈 Performance:"
echo "   Requests/sec:       $RPS"
echo "   Avg Response Time:  $(awk "BEGIN {printf \"%.2f\", $AVG_TIME*1000}")ms"
echo "   Min:                $(awk "BEGIN {printf \"%.2f\", $MIN_TIME*1000}")ms"
echo "   Max:                $(awk "BEGIN {printf \"%.2f\", $MAX_TIME*1000}")ms"
echo "   P50 (Median):       $(awk "BEGIN {printf \"%.2f\", $P50*1000}")ms"
echo "   P95:                $(awk "BEGIN {printf \"%.2f\", $P95*1000}")ms"
echo "   P99:                $(awk "BEGIN {printf \"%.2f\", $P99*1000}")ms"
echo ""
echo "⏱️  Elapsed Time:      ${ELAPSED}s"
echo ""

# Cleanup
rm "$RESULTS_FILE"


#!/usr/bin/env bash
set -euo pipefail

HOSTS=("im1ac.local" "10.0.0.207")  # adjust IP if needed
TOOL_PAYLOAD='{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"use_memory_agent","arguments":{"question":"Reply \"ACK\" only. No memory ops."}}}'
TIMEOUT=45        # seconds per attempt (increase if first-token latency is high)
RETRIES=3         # number of attempts
BACKOFF=(3 6 10)  # seconds between attempts

for H in "${HOSTS[@]}"; do
  echo "== $H =="

  # 1) Banner
  banner=$(curl -sS --max-time 5 "http://$H:8081/mcp" || true)
  if command -v jq >/dev/null 2>&1; then
    echo "$banner" | jq -r '.protocol + " " + .version' || echo "$banner"
  else
    echo "$banner"
  fi

  # 2) tools/list
  list=$(curl -sS --max-time 8 -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' \
    "http://$H:8081/mcp" || true)
  if command -v jq >/dev/null 2>&1; then
    echo "$list" | jq -r '.result.tools[].name' || echo "$list"
  else
    echo "$list"
  fi

  # 3) tools/call → ACK with retries + timing
  for ((i=1; i<=RETRIES; i++)); do
    echo "attempt $i:"
    start=$(date +%s)

    http_code=$(curl -sS -o /tmp/ftest_body.$$ -w '%{http_code}' \
      --max-time "$TIMEOUT" -H 'Content-Type: application/json' \
      --data-binary "$TOOL_PAYLOAD" "http://$H:8081/mcp" || echo "000")

    end=$(date +%s)
    duration=$((end - start))
    echo "⏱️  took ${duration}s"

    if [[ "$http_code" == "200" ]]; then
      if command -v jq >/dev/null 2>&1; then
        jq -r '.result.content[0].text' /tmp/ftest_body.$$ || cat /tmp/ftest_body.$$
      else
        cat /tmp/ftest_body.$$
      fi
      rm -f /tmp/ftest_body.$$ 2>/dev/null || true
      break
    else
      echo "HTTP $http_code"
      cat /tmp/ftest_body.$$ 2>/dev/null || true
      rm -f /tmp/ftest_body.$$ 2>/dev/null || true
      if (( i < RETRIES )); then
        sleep "${BACKOFF[$((i-1))]}"
      fi
    fi
  done
  echo
done

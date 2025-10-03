for H in im1ac.local 10.0.0.207; do
  echo "== $H =="
  curl -sS --max-time 5 "http://$H:8081/mcp" | jq -r '.protocol+" "+.version'
  curl -sS --max-time 8 -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' "http://$H:8081/mcp" \
    | jq -r '.result.tools[].name'
  # ACK (try twice; first call may still be warming)
  for i in 1 2; do
    echo "attempt $i:"
    curl -sS --max-time 15 -H 'Content-Type: application/json' \
      -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"use_memory_agent","arguments":{"question":"Reply \"ACK\" only. No memory ops."}}}' \
      "http://$H:8081/mcp"
    echo
  done
done

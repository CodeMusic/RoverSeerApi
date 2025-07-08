#!/bin/bash

HOST=$(echo "$1" | cut -d: -f1)
PORT=$(echo "$1" | cut -d: -f2)
shift

echo "⏳ Waiting for $HOST:$PORT..."

while ! (echo > /dev/tcp/$HOST/$PORT) 2>/dev/null; do
  echo "⏱️  Still waiting..."
  sleep 2
done

echo "✅ $HOST:$PORT is available. Starting Redmine..."
exec "$@"

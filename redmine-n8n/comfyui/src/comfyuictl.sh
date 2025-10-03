#!/bin/zsh
set -euo pipefail

PLIST="$HOME/Library/LaunchAgents/com.codemusic.comfyui.plist"
APP_ROOT="$HOME/redmine-n8n/comfyui/src"
RUN="$APP_ROOT/run_comfy.sh"
LOG="$APP_ROOT/comfyui.log"
LABEL="com.codemusic.comfyui"

cmd="${1:-}"

case "$cmd" in
  install)
    [[ -x "$RUN" ]] || chmod +x "$RUN"
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    ;;
  start)
    launchctl kickstart -k "gui/$(id -u)/$LABEL"
    ;;
  stop)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    ;;
  restart)
    launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
    launchctl bootstrap "gui/$(id -u)" "$PLIST"
    launchctl kickstart -k "gui/$(id -u)/$LABEL"
    ;;
  status)
    launchctl list | grep "$LABEL" || true
    ;;
  logs)
    touch "$LOG"
    exec tail -f "$LOG"
    ;;
  fg)
    [[ -x "$RUN" ]] || chmod +x "$RUN"
    exec "$RUN"
    ;;
  *)
    echo "usage: $0 {install|start|stop|restart|status|logs|fg}"
    exit 2
    ;;
esac

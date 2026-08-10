#!/bin/sh

set -eu

if [ "${TAILSCALE_ENABLED:-false}" != "true" ]; then
  exec deno task start
fi

: "${TAILSCALE_AUTHKEY:?TAILSCALE_AUTHKEY must be set when TAILSCALE_ENABLED=true}"

tailscale_state_dir="${TAILSCALE_STATE_DIR:-/app/data/tailscale}"
tailscale_socket="/var/run/tailscale/tailscaled.sock"
tailscale_hostname="${TAILSCALE_HOSTNAME:-${FLY_APP_NAME:-mortybot}}"

mkdir -p "$tailscale_state_dir" /var/run/tailscale

tailscaled \
  --socket="$tailscale_socket" \
  --statedir="$tailscale_state_dir" &

tailscale --socket="$tailscale_socket" up \
  --accept-dns=true \
  --accept-routes=true \
  --auth-key="$TAILSCALE_AUTHKEY" \
  --hostname="$tailscale_hostname" \
  --shields-up=true \
  --timeout=30s

exec deno task start

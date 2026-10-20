#!/bin/sh
# Dedicated worker VM only. Leave OCI DNS (UDP/TCP 53) and other firewall rules intact.
# Refuse startup if Docker's iptables chain is unavailable; do not disable the firewall.
set -eu
command -v iptables >/dev/null
iptables -nL DOCKER-USER >/dev/null
if ! iptables -C DOCKER-USER -d 169.254.169.254/32 -p tcp --dport 80 -j REJECT 2>/dev/null; then
  iptables -I DOCKER-USER 1 -d 169.254.169.254/32 -p tcp --dport 80 -j REJECT
fi

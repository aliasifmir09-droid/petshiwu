#!/usr/bin/env bash
# Per-boot startup: bring the local MongoDB instance up (idempotently) so the
# backend can connect. Application dev servers run via the configured terminals.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# shellcheck source=/dev/null
source "$SCRIPT_DIR/mongo.sh"

mongo_start "$MONGO_LOG_DIR/mongod.log"

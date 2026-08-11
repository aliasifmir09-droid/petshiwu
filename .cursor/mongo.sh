#!/usr/bin/env bash
# Shared helpers for managing the local MongoDB instance used in development.
set -euo pipefail

MONGO_DATA_DIR="${MONGO_DATA_DIR:-/home/ubuntu/data/mongodb}"
MONGO_LOG_DIR="${MONGO_LOG_DIR:-/home/ubuntu/log}"

mongo_is_up() {
  mongosh --quiet --host 127.0.0.1 --eval 'db.adminCommand("ping")' >/dev/null 2>&1
}

mongo_wait_ready() {
  local attempts="${1:-60}"
  local i
  for ((i = 1; i <= attempts; i++)); do
    if mongo_is_up; then
      return 0
    fi
    sleep 1
  done
  return 1
}

# Idempotently start mongod (forked) on 127.0.0.1:27017 if it is not already
# responding. Safe to call repeatedly.
mongo_start() {
  local logfile="${1:-$MONGO_LOG_DIR/mongod.log}"
  mkdir -p "$MONGO_DATA_DIR" "$MONGO_LOG_DIR"

  if mongo_is_up; then
    echo "MongoDB is already running."
    return 0
  fi

  # Clear a stale lock left behind by an unclean shutdown so mongod can restart.
  if [ -f "$MONGO_DATA_DIR/mongod.lock" ]; then
    rm -f "$MONGO_DATA_DIR/mongod.lock" || true
  fi

  echo "Starting MongoDB (dbpath=$MONGO_DATA_DIR)..."
  mongod \
    --dbpath "$MONGO_DATA_DIR" \
    --bind_ip 127.0.0.1 \
    --port 27017 \
    --logpath "$logfile" \
    --fork >/dev/null

  if mongo_wait_ready 60; then
    echo "MongoDB is ready on 127.0.0.1:27017."
  else
    echo "ERROR: MongoDB did not become ready in time. Recent log:" >&2
    tail -n 40 "$logfile" >&2 || true
    return 1
  fi
}

mongo_stop() {
  if mongo_is_up; then
    echo "Shutting down MongoDB..."
    mongod --dbpath "$MONGO_DATA_DIR" --shutdown || true
  fi
}

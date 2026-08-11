FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

# Base system packages required to build native npm modules and fetch tooling.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        gnupg \
        git \
        build-essential \
        python3 \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 (matches the toolchain the project is developed against).
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# MongoDB 8.0 Community Server + shell/tools (the app's primary database).
RUN curl -fsSL https://pgp.mongodb.com/server-8.0.asc \
        | gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor \
    && echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" \
        > /etc/apt/sources.list.d/mongodb-org-8.0.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends mongodb-org \
    && rm -rf /var/lib/apt/lists/*

# Persistent data/log directories for the local MongoDB instance.
RUN mkdir -p /home/ubuntu/data/mongodb /home/ubuntu/log \
    && chown -R ubuntu:ubuntu /home/ubuntu/data /home/ubuntu/log

USER ubuntu

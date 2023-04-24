FROM gcc:latest

# Set the working directory
WORKDIR /app

# Install additional dependencies (if required)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

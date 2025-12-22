FROM oven/bun:1.2-debian

WORKDIR /app

# Install OpenSSL 3
RUN apt-get update && apt-get install -y openssl libssl3 ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install

# Generate Prisma client
RUN bunx prisma generate

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Start the server
CMD ["bun", "run", "start"]

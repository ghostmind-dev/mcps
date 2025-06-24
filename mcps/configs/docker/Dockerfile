# Production Dockerfile for Deno MCP Stream Server
FROM denoland/deno:2.1.4

# Set working directory
WORKDIR /app

# Copy deno configuration files first for better caching
COPY deno.json deno.lock ./

# Copy the application code
COPY server.ts ./
COPY tools/ ./tools/


# Cache the main server file and its dependencies
RUN deno cache server.ts

# Set ownership and switch to non-root user for security
RUN chown -R deno:deno /app
USER deno

# Expose the port
EXPOSE 3000

# Set environment variables
ENV DENO_ENV=production

# Run the server
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "server.ts"]

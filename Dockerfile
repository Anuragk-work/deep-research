FROM node:22-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies inside container (gets correct platform binaries)
RUN npm install && \
    # Force reinstall esbuild to get correct platform binary
    npm rebuild esbuild

# Copy source files
COPY src ./src
COPY tsconfig.json ./
COPY .env.local ./.env.local

CMD ["npm", "run", "api"]

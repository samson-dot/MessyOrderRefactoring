# 1. Base image: Node 22 on Debian (slim). Debian, NOT alpine, so better-sqlite3 works.
FROM node:22-slim

# 2. Where the app lives inside the container
WORKDIR /app

# 3. Copy dependency manifests FIRST (for caching — see note below)
COPY package*.json ./

# 4. Install only production dependencies (no jest, etc.)
RUN npm ci --omit=dev

# 5. Now copy the rest of your code
COPY . .

# 6. Document the port your app listens on
EXPOSE 4000

# 7. The command to start the app
CMD ["node", "route/http.js"]
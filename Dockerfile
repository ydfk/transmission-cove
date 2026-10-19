FROM --platform=$BUILDPLATFORM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

FROM node:22-alpine
ENV NODE_ENV=production PORT=8080 SERVERS_FILE=/config/servers.json
ENV DEFAULT_TRANSMISSION_RPC_URL=http://host.docker.internal:9091/transmission/rpc
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY server/index.mjs server/remote-rpc.mjs ./server/
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD node -e "fetch('http://127.0.0.1:8080/').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server/index.mjs"]

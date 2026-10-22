FROM node:22-alpine
WORKDIR /app
COPY package.json mcp.json server.json index.js ./
ENTRYPOINT ["node", "index.js"]

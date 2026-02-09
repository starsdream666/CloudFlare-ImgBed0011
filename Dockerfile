FROM node:22-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

EXPOSE 8080
CMD ["npx", "wrangler", "dev", "--ip", "0.0.0.0", "--port", "8080", "--persist-to", "./data"]

# CityChat's service, with the published data it answers from.
#
#   docker build -f server/citychat/deploy/Dockerfile -t citychat .
#
# Built from the repository root: the service imports the viewer's own data
# code (src/data/, scripts/lib/), so the chat and the map compute every figure
# the same way. public/data/ is copied in, so an image is a snapshot of what
# was published when it was built; mount a newer tree over /app/public/data
# to answer from that instead, without a rebuild.

FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

# Runtime dependencies only. h3-js is the one the service uses; the rest come
# with the lockfile and cost disk, not correctness.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

COPY scripts/lib ./scripts/lib
COPY src ./src
COPY server ./server
COPY public/data ./public/data

# Listen on every interface inside the container; publish the port to
# localhost only (compose.yaml) and let the web server proxy to it.
ENV CITYCHAT_HOST=0.0.0.0 \
    CITYCHAT_PORT=3100
EXPOSE 3100

USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD node -e "fetch('http://127.0.0.1:3100/api/citychat/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "server/citychat/server.mjs"]

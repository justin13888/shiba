# syntax=docker/dockerfile:1

# Shiba sync server image. The repo is a Bun-workspaces monorepo, but the server
# itself runs on Node — `tsx` executes the TypeScript entry directly (there is no
# separate build/bundle step). So we install dependencies with Bun, then hand the
# resolved tree to a Node runtime.
#
# Bun uses an isolated, pnpm-style node_modules (a root `node_modules/.bun` store
# plus per-workspace symlink farms with *relative* links). We therefore install
# in-image and copy the whole /app tree to the runtime stage unchanged: the
# relative symlinks keep resolving because the working directory stays /app.
#
# Both stages share ONE base image so the glibc that native modules
# (better-sqlite3, esbuild) compile against is identical to the runtime's —
# mixing distros (e.g. a trixie Bun image + a bookworm Node image) makes the
# better_sqlite3.node fail to load with a GLIBC version error.

# ---- deps: resolve the workspace with Bun (matches CI: --frozen-lockfile) ----
FROM node:22-bookworm-slim AS build
WORKDIR /app

# Build toolchain for native modules, plus Bun installed via npm so the build and
# runtime stages stay on the same Debian release (identical glibc).
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && npm install -g bun@1.3.13 \
    && rm -rf /var/lib/apt/lists/*

# Copy the whole workspace: Bun resolves every `workspace:*` dependency from its
# member's package.json, and the server imports @shiba/core + @shiba/sync-protocol
# from source at runtime. Host node_modules/.output are excluded via .dockerignore,
# so this is source only and dependencies are installed fresh for the image's arch.
COPY . .
RUN bun install --frozen-lockfile

# ---- runtime: same base, so the compiled native modules load cleanly ----
FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    DB_PATH=/data/shiba.sqlite

WORKDIR /app
# Bring over the fully-resolved workspace (source + node_modules with intact
# relative symlinks). Identical /app path → symlinks stay valid.
COPY --from=build /app /app

# SQLite persists to a mounted volume so state survives container restarts.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

USER node
EXPOSE 3000

# `/healthz` returns {ok:true}; Node 22 has global fetch.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Run the server exactly as `tsx src/index.ts` would (its own start script),
# but invoked through Node so no Bun is needed in the runtime image.
WORKDIR /app/apps/server
CMD ["node", "node_modules/.bin/tsx", "src/index.ts"]

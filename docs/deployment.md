# Deployment

Running the Shiba **sync server** in production as a container. The server is
optional — Shiba is local-first — but a sync server lets a passphrase-holder share
end-to-end-encrypted state across devices. For the API and data model see
[`sync-server.md`](sync-server.md); to cut a release see [`releasing.md`](releasing.md).

## Image

Every version tag publishes a multi-arch (`linux/amd64` + `linux/arm64`) image to
GHCR via [`.github/workflows/publish-container.yml`](../.github/workflows/publish-container.yml):

```
ghcr.io/justin13888/shiba-server:<version>   # e.g. 1.2.0
ghcr.io/justin13888/shiba-server:<major.minor>
ghcr.io/justin13888/shiba-server:latest
```

Pin a specific `<version>` in production; `latest` tracks the newest release.

## Quick start (Docker)

```bash
docker run -d --name shiba-server \
  -p 3000:3000 \
  -e SHIBA_SERVER_SECRET="$(openssl rand -hex 32)" \
  -v shiba-data:/data \
  ghcr.io/justin13888/shiba-server:latest
```

`GET /healthz` returns `{"ok":true}` once it is up (the image also ships a Docker
`HEALTHCHECK`, so `docker ps` shows health). Keep the generated
`SHIBA_SERVER_SECRET` — you need it to pair devices.

## Docker Compose

The repo root ships a [`compose.yaml`](../compose.yaml):

```bash
SHIBA_SERVER_SECRET=$(openssl rand -hex 32) docker compose up -d
```

It maps port 3000 and mounts a named `shiba-data` volume at `/data`. Put the
secret in a root `.env` (`SHIBA_SERVER_SECRET=…`) to avoid passing it inline.

## Configuration

Set via environment variables (parsed in [`apps/server/src/env.ts`](../apps/server/src/env.ts)):

| Env var | Default (image) | Purpose |
|---|---|---|
| `SHIBA_SERVER_SECRET` | — | **Required in production.** Bootstrap secret that authorizes `POST /devices`. Without it every enrollment is rejected `401`. |
| `PORT` | `3000` | HTTP + WebSocket port. |
| `DB_PATH` | `/data/shiba.sqlite` | SQLite file path. Keep it on the mounted volume. |
| `NODE_ENV` | `production` | `development` \| `production` \| `test`; controls pretty vs JSON logs. |
| `LOG_LEVEL` | `info` | pino level: `trace`…`fatal`, `silent`. |

## State & backups

All state is the single SQLite file at `DB_PATH` (WAL mode → `-wal`/`-shm`
sidecars). It stores only device tokens and **end-to-end-encrypted** blobs — the
server never sees plaintext or the passphrase. Persist `/data` on a volume; back
up by copying the SQLite file (or snapshotting the volume) while the server is
quiescent.

## TLS & reverse proxy

The container serves plain HTTP. Terminate TLS at a reverse proxy (Caddy, nginx,
Traefik) and forward to port 3000. Sync uses a **WebSocket** at `/sync`, so the
proxy must allow connection upgrades (nginx: `proxy_set_header Upgrade`/`Connection`;
Caddy handles it automatically).

## Pairing a device

`POST /devices` with `Authorization: Bearer $SHIBA_SERVER_SECRET` mints a one-time
device token the extension stores for the `/sync` socket. Details in
[`sync-server.md`](sync-server.md).

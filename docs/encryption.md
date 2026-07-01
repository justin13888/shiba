# End-to-end encryption

The self-hosted server stores **only ciphertext**. Tab content (URLs, titles,
notes) is encrypted on-device; the server operator cannot read it.

## Threat model

- **Adversary:** server operator / disk / network MITM.
- **Learns nothing about** tab content. **Can see** metadata: update count/size/
  timestamps, device ids, account existence.
- **Trusted:** the user's devices + the passphrase. **Out of scope:** a compromised
  client.

## Keys (envelope: KEK wraps DEK)

- `KEK = Argon2id(passphrase, salt, params)` (`hash-wasm`, OWASP-aligned params).
- `DEK` = random 256-bit, generated on the first device, encrypts all data.
- `wrappedDEK = AES-256-GCM(KEK, DEK)`; the server stores `{ salt, params,
  wrappedDek }`.
- New device: passphrase → KEK → unwrap DEK. Passphrase change re-wraps the DEK.
- A written-down **recovery key** is the DEK itself, hex-encoded.

## Data encryption

Each Yjs update → `AES-256-GCM(DEK, bytes, nonce)` with the **`docId` as AAD**, so
a ciphertext is bound to its document and can't be replayed under another. GCM
gives confidentiality **and** integrity; a tampered blob fails to open.

## Runtime

WebCrypto (AES-GCM, RNG) natively everywhere; Argon2id via `hash-wasm` only at
unlock. The unwrapped DEK lives in memory + `storage.session` (memory-only), never
on disk.

## Roadmap / notes

- **Position-binding to `seq`.** An earlier design bound `docId|seq` as AAD, but the
  server assigns `seq` *after* a push, so the client can't include it at seal time.
  Only `docId` is bound today; binding an ordering value would require a
  client-chosen sequence number.
- **`recoveryWrap`.** The server accepts and stores a `recoveryWrap` column, but the
  current recovery model (the raw DEK as hex) doesn't use it — it's reserved and
  unused.

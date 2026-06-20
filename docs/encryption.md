# End-to-end encryption

> Status: outline — expanded in Phase 5.

The self-hosted server stores **only ciphertext**. Tab content (URLs, titles,
notes) is encrypted on-device; the server operator cannot read it.

## Threat model
- **Adversary:** server operator / disk / network MITM.
- **Learns nothing about** tab content. **Can see** metadata: update count/size/
  timestamps, device ids, account existence.
- **Trusted:** user devices + the passphrase. **Out of scope:** compromised client.

## Keys (envelope: KEK wraps DEK)
- `KEK = Argon2id(passphrase, salt, params)`.
- `DEK` = random 256-bit, generated on the first device, encrypts all data.
- `wrappedDEK = AES-256-GCM(KEK, DEK)`; server stores `{ salt, params, wrappedDEK }`.
- New device: passphrase → KEK → unwrap DEK. Passphrase change re-wraps the DEK.
- A written-down **recovery key** (the DEK) is generated at setup.

## Data encryption
Each Yjs update/snapshot → `AES-256-GCM(DEK, bytes, nonce)` with `docId|seq` as
AAD (binds ciphertext to position). GCM gives confidentiality **and** integrity.

## Runtime
WebCrypto (AES-GCM, RNG) native everywhere; Argon2id via `hash-wasm` only at
unlock. The unwrapped DEK lives in memory + `storage.session` (memory-only),
never on disk.

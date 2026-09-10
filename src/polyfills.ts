import { Buffer } from 'buffer'

// @solana/web3.js expects Node's Buffer. This must run before any module that
// touches it at import time — ES imports are hoisted, so assigning the global
// inside main.tsx happened too late and left the marker derivation to throw on
// a blank page. Keeping it in its own module, imported first, fixes the order.
if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer
}

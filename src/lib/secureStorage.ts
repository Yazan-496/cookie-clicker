/**
 * Tamper-evident localStorage.
 *
 * Keys are hashed so nothing in DevTools is human-readable, and values are
 * encrypted with AES-GCM. Because AES-GCM is *authenticated*, any edit to a
 * stored value fails decryption and is rejected rather than silently trusted.
 *
 * This is obfuscation, not security. The derivation secret ships in the
 * bundle, so a determined user can extract it and forge a value. It defeats
 * casual tampering; it does not defeat a motivated attacker. The real defence
 * is that the authoritative score lives on Cookie Chain — see the README.
 */

const APP_SECRET = 'cookie-clicker/v1'
const PBKDF2_ITERATIONS = 100_000
const IV_BYTES = 12

let cachedKey: Promise<CryptoKey> | null = null

function available(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.crypto?.subtle !== 'undefined'
  )
}

function deriveKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = (async () => {
      const encoder = new TextEncoder()
      const material = await crypto.subtle.importKey(
        'raw',
        encoder.encode(APP_SECRET + window.location.origin),
        'PBKDF2',
        false,
        ['deriveKey'],
      )
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('cookie-clicker/salt/v1'),
          iterations: PBKDF2_ITERATIONS,
          hash: 'SHA-256',
        },
        material,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt'],
      )
    })()
  }
  return cachedKey
}

/** Hashes a logical name so the storage key reveals nothing. */
async function storageKeyFor(name: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${APP_SECRET}:${name}`),
  )
  const hex = Array.from(new Uint8Array(digest).slice(0, 10))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `cc_${hex}`
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export async function secureSet(name: string, value: unknown): Promise<void> {
  if (!available()) return
  try {
    const key = await deriveKey()
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES))
    const plaintext = new TextEncoder().encode(JSON.stringify(value))

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      plaintext,
    )

    const payload = new Uint8Array(IV_BYTES + ciphertext.byteLength)
    payload.set(iv, 0)
    payload.set(new Uint8Array(ciphertext), IV_BYTES)

    window.localStorage.setItem(await storageKeyFor(name), toBase64(payload))
  } catch {
    /* storage blocked or full — progress simply won't persist */
  }
}

export async function secureGet<T>(name: string): Promise<T | null> {
  if (!available()) return null
  try {
    const raw = window.localStorage.getItem(await storageKeyFor(name))
    if (!raw) return null

    const payload = fromBase64(raw)
    if (payload.length <= IV_BYTES) return null

    const key = await deriveKey()
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: payload.slice(0, IV_BYTES) },
      key,
      payload.slice(IV_BYTES),
    )

    return JSON.parse(new TextDecoder().decode(plaintext)) as T
  } catch {
    // Wrong key, corrupt data, or the value was edited — AES-GCM's auth tag
    // fails and we treat it as absent rather than trusting it.
    return null
  }
}

export async function secureRemove(name: string): Promise<void> {
  if (!available()) return
  try {
    window.localStorage.removeItem(await storageKeyFor(name))
  } catch {
    /* ignore */
  }
}

/** Clears plaintext keys left over from before storage was encrypted. */
export function purgeLegacyKeys(names: string[]): void {
  if (typeof window === 'undefined') return
  for (const name of names) {
    try {
      window.localStorage.removeItem(name)
    } catch {
      /* ignore */
    }
  }
}

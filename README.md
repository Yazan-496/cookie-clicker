# 🍪 Cookie Clicker

A mobile-first, on-chain idle game built on [Cookie Chain](https://www.cookiechain.wtf).

Tap the cookie to bake. When you're ready, commit your score to Cookie Chain —
it's written on-chain as a memo, so every bake is permanent and publicly
verifiable on [Cookiescan](https://cookiescan.io).

Built for the **Create an App on Cookie Chain** bounty on Superteam Earn.

---

## Why mobile-first

Cookie Chain apps are overwhelmingly desktop dashboards. Cookie Clicker is built
for a thumb: single column, large tap targets, safe-area insets, and no layout
that breaks under 400px. It works on desktop too, but it's designed for a phone.

---

## Features

| Requirement | Where it lives |
| --- | --- |
| Wallet connection (Nightly) | `src/hooks/useNightly.ts` |
| Display connected wallet address | `src/components/ConnectButton.tsx` |
| Transaction execution | `src/hooks/useBake.ts` |
| Transaction confirmation handling | `src/hooks/useBake.ts` |
| Error handling & user feedback | `src/lib/chain.ts` → `describeError()`, `src/components/TxStatus.tsx` |

Every transaction moves through a visible lifecycle — **signing → sending →
confirming → confirmed** — and failures are translated into plain language
rather than raw RPC errors. Cancelling in the wallet, running out of COOK, an
expired blockhash and an unreachable RPC each produce their own message.

---

## Tech stack

- **React 18** + **TypeScript** + **Vite 6**
- **@solana/web3.js** — Cookie Chain is SVM-compatible, so Solana tooling works directly
- **Nightly** wallet (required — MetaMask cannot add a custom SVM RPC)
- No backend, no custom program deployment

---

## Requirements

- Node.js 18 or newer
- The [Nightly](https://nightly.app) browser extension
- A small amount of **COOK** for transaction fees

---

## Running locally

```bash
git clone <your-repo-url>
cd cookie-clicker
npm install
npm run dev
```

Then open the printed URL (default `http://localhost:5173`).

To test on a phone on the same network:

```bash
npm run dev -- --host
```

Then open the Network URL shown in the terminal from your phone's browser.

### Production build

```bash
npm run build     # outputs to dist/
npm run preview   # serve the built output locally
```

---

## Configuration

All chain configuration lives in `src/lib/chain.ts`:

| Constant | Value |
| --- | --- |
| `COOKIE_CHAIN_RPC` | `https://rpc.cookiescan.io` |
| `EXPLORER_URL` | `https://cookiescan.io` |
| `MEMO_PROGRAM_ID` | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |
| `USE_MEMO` | `true` |

**Note on `USE_MEMO`:** scores are recorded using the standard SPL Memo program.
If the Memo program is not deployed on Cookie Chain, set `USE_MEMO` to `false`
and the app falls back to a zero-value self-transfer, which still produces a
real, confirmable on-chain transaction.

---

## How a bake works

1. Tapping the cookie increments the local score. No transaction, no gas.
2. Pressing **Bake on Cookie Chain** builds a transaction containing a memo
   instruction: `cookie-clicker|score:<score>|ts:<timestamp>`.
3. A fresh blockhash is fetched and the transaction is signed by Nightly.
4. The signed transaction is sent to the Cookie Chain RPC.
5. Confirmation is awaited against the blockhash and last valid block height.
6. On success, the signature is added to the on-chain bake history with a link
   to Cookiescan. On failure, a human-readable error is shown.

Keeping taps off-chain and batching them into one explicit transaction means the
game stays instant and only spends gas when the player chooses to.

---

## Trust model

Anything stored in the browser can be edited by the person holding the browser.
Opening DevTools and setting the saved score to a trillion takes five seconds,
so the app is built on the assumption that it will happen.

**The local tap counter is a buffer, never a source of truth.** Two things
follow from that:

1. **The chain is authoritative.** The score shown as *"verified on Cookie
   Chain"* is derived from memos actually written on-chain and read back via
   `getSignaturesForAddress`. Writing one costs gas and is publicly auditable
   on Cookiescan. The local number carries no authority and is labelled as such.

2. **The local buffer is bounded by physics.** Progress is stored as
   `{ score, since }`. On load — and again whenever the tab regains focus — the
   score is clamped to `elapsed_seconds × 25`, the fastest any human could tap.
   A hand-edited trillion collapses back to a plausible number, and the clamp is
   logged to the console.

3. **Storage is tamper-evident.** Keys are SHA-256 hashed so nothing in
   DevTools is human-readable, and values are encrypted with AES-GCM via
   Web Crypto. Because AES-GCM is authenticated, editing a stored value makes
   decryption fail and the value is discarded rather than trusted.

   This is deliberately described as *obfuscation*, not security. The
   derivation secret ships in the bundle, so a determined user can extract it
   and forge a value. It raises the cost of casual tampering; it does not
   eliminate it.

This does not make the client tamper-proof; nothing client-side can be. It
makes tampering *pointless*, because the only number that counts is the one on
Cookie Chain.

## Project structure

```
src/
├── App.tsx                    game screen and state
├── main.tsx                   entry point, Buffer polyfill
├── styles.css                 mobile-first styles
├── lib/
│   ├── chain.ts               RPC, transactions, on-chain history, errors
│   ├── format.ts              compact score formatting
│   └── nightly.ts             Nightly provider detection and types
├── hooks/
│   ├── useNightly.ts          connect / disconnect / eager reconnect
│   ├── useScore.ts            tamper-clamped local tap buffer
│   └── useBake.ts             transaction lifecycle + on-chain history
└── components/
    ├── ConnectButton.tsx      connect state and address display
    ├── Cookie.tsx             tap target and crumb animation
    ├── TxStatus.tsx           live transaction feedback
    └── BakeHistory.tsx        confirmed bakes with explorer links
```

---

## Licence

MIT

# Cookie Clicker

A mobile-first idle game on [Cookie Chain](https://www.cookiechain.wtf). Tap the
cookie to bake, then commit your score to the chain as a memo. Every bake is
permanent and publicly verifiable on [Cookiescan](https://cookiescan.io), and
the global leaderboard is read straight back off-chain — there is no database
anywhere in this project.

Built for the *Create an App on Cookie Chain* bounty on Superteam Earn.

**Live:** https://bake-on-cookie-chain.vercel.app

## Required features

| Requirement | Where |
| --- | --- |
| Wallet connection (Nightly) | `src/hooks/useNightly.ts` |
| Display connected address | `src/components/ConnectButton.tsx`, `src/pages/ProfilePage.tsx` |
| Transaction execution | `src/hooks/useBake.ts` |
| Transaction confirmation handling | `src/hooks/useBake.ts` |
| Error handling and user feedback | `describeError()` in `src/lib/chain.ts`, `src/components/TxStatus.tsx` |

Transactions move through a visible lifecycle — signing, sending, confirming,
confirmed — and failures are translated into plain language instead of raw RPC
output. Cancelling in the wallet, missing COOK, an expired blockhash and an
unreachable RPC each get their own message.

The app also checks your COOK balance before building a transaction, so a wallet
with no gas gets an explanation and a link to the bridge rather than a failed
signature request.

## The game

Tapping is free — no transaction, no gas. Cookies accumulate locally, and one
explicit **Bake** writes the total to the chain.

- **Five note rings.** The cookie is divided into five concentric zones playing
  do, re, mi, fa, sol from the centre out. Each ring has its own reaction, and
  the cookie dips toward wherever you press.
- **Upgrades.** Four items with compounding prices — a rolling pin raises cookies
  per tap, ovens, mixers and farms produce passively.
- **Levels and cookie tiers.** Six cookies unlock with level, changing shape
  rather than colour: a plain disc, then softer edges, hand-shaped irregularity,
  scalloped rims, and finally a craggy cracked bake.
- **Passive income pauses after 30 seconds idle.** Upgrades still pay, but only
  while you are playing — otherwise the leaderboard would rank whoever left a tab
  open longest.

## The leaderboard has no database

No backend, no hosted state. Every bake references a fixed app marker:

```
Hy735uzbqzvS23XDn7ANu8mKrSQcjjj9Ccm8KZKgEpaY
```

One call to `getSignaturesForAddress` on that address returns every bake by every
player. The marker is a program-derived address, so nobody holds a key for it —
it is referenced, never signed for.

**Why a marker rather than the Memo program directly:** the Memo program is
shared. At the time of writing `keno`, `cookiejar`, `cookie-sheet` and
`Cookiebox` all write to it, and a busy day would push this app's bakes out of
the recent history. The marker gives the game its own namespace.

The Memo program requires every account passed to it to be a signer, so the
marker cannot ride on the memo instruction. It goes in a second zero-value
transfer in the same transaction — same signature count, same fee.

**Rankings credit the transaction signer read from the chain, not the memo
text.** A memo can claim any score, but only one wallet signed and paid for it.

## Trust model

Anything stored in a browser can be edited by the person holding it, so the app
assumes that will happen. The local counter is a buffer, never a source of truth.

1. **The chain is authoritative.** The figure shown as *verified on Cookie Chain*
   comes from memos actually written on-chain. The local number is labelled as
   unverified.
2. **The buffer is bounded.** A loaded save is clamped to what the elapsed time
   could physically have produced — flat-out tapping plus whatever the owned
   upgrades generate. A hand-edited trillion collapses back to a plausible
   number and the clamp is logged.
3. **Storage is tamper-evident.** Keys are SHA-256 hashed and values encrypted
   with AES-GCM. Because GCM is authenticated, an edited value fails to decrypt
   and is discarded.

Point 3 is obfuscation, not security — the derivation secret ships in the bundle,
so a determined user can extract it. It raises the cost of casual tampering
without eliminating it. The point isn't to make the client tamper-proof, which is
impossible; it's to make tampering pointless, because only the on-chain number
counts.

## Verifying a transaction without spending anything

```bash
npm run simulate                 # simulate a bake against Cookie Chain
npm run simulate <address>       # simulate as a specific wallet
```

Simulation needs no gas and no signature, and returns the real program logs. The
fee payer has to be an account that already exists on-chain — an unfunded wallet
returns `AccountNotFound`.

## Running locally

```bash
npm install
npm run dev              # http://localhost:5173
npm run dev -- --host    # also reachable from a phone on the same network
npm run build            # outputs to dist/
```

Requires Node 18+, the [Nightly](https://nightly.app) extension, and a small
amount of COOK to bake. Everything except baking works without a wallet,
including the leaderboard.

### Testing against devnet

Cookie Chain is SVM-compatible, so the whole transaction path can be exercised
against Solana devnet where SOL is free:

```bash
npm run dev:devnet
```

An orange banner marks any non–Cookie Chain build. A plain `npm run build` always
targets Cookie Chain; devnet needs the explicit flag.

## Configuration

Chain settings live in `src/lib/chain.ts`:

| Constant | Value |
| --- | --- |
| `COOKIE_CHAIN_RPC` | `https://rpc.cookiescan.io` |
| `EXPLORER_URL` | `https://cookiescan.io` |
| `MEMO_PROGRAM_ID` | `MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr` |
| `APP_MARKER` | derived from the Memo program |
| `USE_MEMO` | `true` — set false to fall back to a zero-value self transfer |

## Tech stack

React 18, TypeScript, Vite 6, `@solana/web3.js`. Nightly wallet is required —
MetaMask cannot add a custom SVM RPC. No backend and no custom program
deployment. Sounds are synthesised with the Web Audio API, so there are no audio
assets to host.

## Structure

```
src/
├── App.tsx                  shell, shared state, tab routing
├── main.tsx
├── polyfills.ts             Buffer, before anything else loads
├── styles.css
├── lib/
│   ├── chain.ts             RPC, transactions, history, leaderboard, errors
│   ├── game.ts              upgrades, costs, levels
│   ├── cookieTiers.ts       tier definitions and generated cookie outlines
│   ├── secureStorage.ts     hashed keys, AES-GCM values
│   ├── format.ts
│   └── nightly.ts
├── hooks/
│   ├── useGame.ts           score, upgrades, passive income, idle timeout
│   ├── useBake.ts           transaction lifecycle, on-chain history
│   ├── useLeaderboard.ts
│   ├── useNightly.ts        connect, disconnect, remembered reconnect
│   ├── useGasBalance.ts
│   ├── useSound.ts          Web Audio synthesis
│   └── useTheme.ts
├── pages/
│   ├── BakePage.tsx
│   ├── ShopPage.tsx
│   ├── BoardPage.tsx
│   └── ProfilePage.tsx
└── components/
    ├── Cookie.tsx           rings, hit detection, particles
    ├── Leaderboard.tsx
    ├── Shop.tsx
    ├── LevelBar.tsx
    ├── TierUp.tsx
    ├── TxStatus.tsx
    ├── BakeHistory.tsx
    ├── ConnectButton.tsx
    ├── Controls.tsx         theme and sound
    ├── TabBar.tsx
    ├── Skeleton.tsx
    └── icons.tsx
```

## Licence

MIT

// Simulates a bake against Cookie Chain. No gas, no signature — validates the
// instruction set before any COOK is spent.
//
//   node scripts/simulate-bake.mjs [playerAddress]
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

const RPC = 'https://rpc.cookiescan.io'
const MEMO_PROGRAM_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',
)
const APP_MARKER = PublicKey.findProgramAddressSync(
  [Buffer.from('cookie-clicker')],
  MEMO_PROGRAM_ID,
)[0]

const player = new PublicKey(
  process.argv[2] ?? 'BuhxxibVA9MkEgvNM5BgjxxK3cUpFVh8csXPkg8Aey2X',
)

const connection = new Connection(RPC, 'confirmed')

console.log('RPC        ', RPC)
console.log('player     ', player.toBase58())
console.log('app marker ', APP_MARKER.toBase58())
console.log()

const tx = new Transaction()
tx.add(
  new TransactionInstruction({
    keys: [{ pubkey: player, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(`cookie-clicker|score:4312|ts:${Date.now()}`, 'utf8'),
  }),
)
tx.add(
  SystemProgram.transfer({
    fromPubkey: player,
    toPubkey: APP_MARKER,
    lamports: 0,
  }),
)

tx.feePayer = player
tx.recentBlockhash = (await connection.getLatestBlockhash('confirmed')).blockhash

const result = await connection.simulateTransaction(tx, undefined, [APP_MARKER])

console.log('err   ', result.value.err)
console.log('units ', result.value.unitsConsumed)
console.log('logs:')
for (const line of result.value.logs ?? []) console.log('   ', line)

if (result.value.err) {
  console.log('\n❌ SIMULATION FAILED — do not ship this transaction shape.')
  process.exit(1)
}
console.log('\n✅ SIMULATION PASSED — both instructions are valid on Cookie Chain.')

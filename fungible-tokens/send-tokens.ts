/**
 * send-tokens.ts
 *
 * PURPOSE: Transfers SPL tokens from the user's wallet to a recipient wallet.
 *
 * CONCEPT — How SPL Token Transfers Work:
 *   You cannot send tokens directly from wallet to wallet the way you send SOL.
 *   Instead, you must transfer between Associated Token Accounts (ATAs):
 *     Sender's ATA  ──(transfer)──▶  Recipient's ATA
 *   Both ATAs must exist on-chain before the transfer instruction runs.
 *   getOrCreateAssociatedTokenAccount handles this automatically — if the
 *   recipient's ATA doesn't exist yet, this call creates it (paid for by the sender).
 *
 * CONCEPT — Why ATAs?:
 *   ATAs separate token balances by type, keeping each wallet's SOL account clean.
 *   Every wallet has one ATA per token it owns, derived deterministically, so anyone
 *   can compute a wallet's ATA address without needing an on-chain lookup first.
 *
 * PRE-REQUISITES:
 *   1. Run create-token-mint.ts  → put mint address in tokenMintAccount
 *   2. Run mint-tokens.ts        → so the sender has tokens to send
 *
 * RUN: npx esrun send-tokens.ts
 */

import "dotenv/config";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";

const connection = new Connection(clusterApiUrl("devnet"));

// The sender keypair — loaded from the SECRET_KEY env variable.
// This keypair pays transaction fees and signs the transfer authorisation.
const sender = getKeypairFromEnvironment("SECRET_KEY");

console.log(
  `🔑 Loaded our keypair securely, using an env file! Our public key is: ${sender.publicKey.toBase58()}`
);

// ⚠️  Replace with the recipient's wallet public key (a base58 string)
const recipient = new PublicKey("YOUR_RECIPIENT_HERE");

// ⚠️  Replace with the mint address from create-token-mint.ts
const tokenMintAccount = new PublicKey("YOUR_TOKEN_MINT_ADDRESS_HERE");

// Token amounts on-chain are integers. 2 decimals means 1 display token = 100 raw units.
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

console.log(`💸 Attempting to send 1 token to ${recipient.toBase58()}...`);

// Retrieve (or create) the sender's ATA for this token.
// This is the source account tokens will be deducted from.
const sourceTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  sender,          // Fee payer (creates ATA if missing)
  tokenMintAccount,
  sender.publicKey // Owner of this token account
);

// Retrieve (or create) the recipient's ATA for this token.
// If the recipient has never held this token before, their ATA is created here,
// and the sender pays the rent-exempt deposit (~0.002 SOL).
const destinationTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  sender,    // Fee payer — the sender covers ATA creation cost
  tokenMintAccount,
  recipient  // The wallet that will own the destination ATA
);

// transfer() moves tokens between two ATAs in a single instruction.
// Arguments:
//   connection                       — RPC connection
//   sender                           — fee payer and transfer authority (must sign)
//   sourceTokenAccount.address       — ATA to debit (sender's)
//   destinationTokenAccount.address  — ATA to credit (recipient's)
//   sender                           — account owner authorising the debit
//   1 * MINOR_UNITS_PER_MAJOR_UNITS  — amount in raw units = 1.00 token
const signature = await transfer(
  connection,
  sender,
  sourceTokenAccount.address,
  destinationTokenAccount.address,
  sender,
  1 * MINOR_UNITS_PER_MAJOR_UNITS
);

const explorerLink = getExplorerLink("transaction", signature, "devnet");

console.log(`✅ Transaction confirmed, explorer link is: ${explorerLink}!`);
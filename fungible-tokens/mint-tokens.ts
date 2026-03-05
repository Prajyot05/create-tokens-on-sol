/**
 * mint-tokens.ts
 *
 * PURPOSE: Mints (creates) new SPL tokens and deposits them into a token account.
 *
 * CONCEPT — Associated Token Account (ATA):
 *   Each wallet cannot hold SPL tokens directly in its main account. Instead, every
 *   wallet has a separate "Associated Token Account" (ATA) for each token type it owns.
 *   ATAs are PDAs derived from [walletAddress, tokenProgramId, mintAddress], meaning
 *   the address is deterministic — you can always recalculate it. getOrCreateAssociatedTokenAccount
 *   will create the ATA on-chain if it doesn't exist, or return the existing one.
 *
 * CONCEPT — Minting:
 *   Minting is the act of creating new tokens out of thin air. Only the address set as
 *   the mintAuthority when the Mint was created can call mintTo(). The total supply
 *   increases with each mint operation.
 *
 * PRE-REQUISITE: Run create-token-mint.ts first and paste the mint address below.
 *
 * RUN: npx esrun mint-tokens.ts
 */

import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import "dotenv/config";
import {
  getExplorerLink,
  getKeypairFromEnvironment,
} from "@solana-developers/helpers";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

// Note: we pass "confirmed" as the commitment level here.
// mintTo() doesn't default to a commitment level (unlike sendAndConfirmTransaction),
// so the connection must be created with an explicit default commitment.
// "confirmed" means we wait until a supermajority of validators confirm the slot.
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// CONCEPT — Decimal conversion:
//   On-chain, token amounts are always stored as integers (no floating point).
//   A token with 2 decimals stores "10.00" as 1000 (= 10 * 10^2).
//   MINOR_UNITS_PER_MAJOR_UNITS is the conversion factor between display units and raw units.
const MINOR_UNITS_PER_MAJOR_UNITS = Math.pow(10, 2);

// The mint authority — must be the same keypair set as mintAuthority in create-token-mint.ts
const user = getKeypairFromEnvironment("SECRET_KEY");

// ⚠️  Replace with the mint address printed by create-token-mint.ts
const tokenMintAccount = new PublicKey("YOUR_TOKEN_MINT_HERE");

// Get or create the ATA for our own wallet.
// Arguments: connection, fee-payer, mint, owner
// If the ATA doesn't exist yet, this creates it on-chain (costs a small rent fee).
const recipientAssociatedTokenAccount = await getOrCreateAssociatedTokenAccount(
  connection,
  user,           // Fee payer for creating the ATA if needed
  tokenMintAccount,
  user.publicKey  // The wallet that will own this token account
);

// mintTo() sends a transaction that increases the token supply and credits the
// recipient's ATA with the newly minted tokens.
// Arguments:
//   connection                          — RPC connection
//   user                                — fee payer
//   tokenMintAccount                    — the mint whose supply we're increasing
//   recipientAssociatedTokenAccount     — ATA to deposit the minted tokens into
//   user                                — the mint authority (must sign)
//   10 * MINOR_UNITS_PER_MAJOR_UNITS    — amount in raw (minor) units = 10.00 tokens
const transactionSignature = await mintTo(
  connection,
  user,
  tokenMintAccount,
  recipientAssociatedTokenAccount.address,
  user,
  10 * MINOR_UNITS_PER_MAJOR_UNITS
);

const link = getExplorerLink("transaction", transactionSignature, "devnet");

console.log(`✅ Success! Mint Token Transaction: ${link}`);
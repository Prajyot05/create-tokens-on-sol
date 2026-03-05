/**
 * create-token-mint.ts
 *
 * PURPOSE: Creates a new SPL Token Mint account on Solana devnet.
 *
 * CONCEPT — Token Mint:
 *   In Solana's SPL Token program, a "Mint" is a special on-chain account that
 *   defines a token — its supply, decimal precision, and who can mint/freeze it.
 *   Think of it like the "central bank" for your token. The Mint itself holds no
 *   token balance; individual wallets hold balances in separate Associated Token
 *   Accounts (ATAs) linked to this mint.
 *
 * FLOW:
 *   1. Load the user's keypair (payer + authority)
 *   2. Call createMint() — this sends a transaction that:
 *        a. Creates a new account owned by the Token Program (SystemProgram.createAccount)
 *        b. Initialises it as a Mint with the given parameters (createInitializeMintInstruction)
 *   3. Print the explorer link to the newly created mint address
 *
 * RUN: npx esrun create-token-mint.ts
 */

import { createMint } from "@solana/spl-token";
import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import { Connection, clusterApiUrl } from "@solana/web3.js";

// Connect to Solana devnet — a free test network that mirrors mainnet behaviour.
// For production, swap "devnet" for "mainnet-beta".
const connection = new Connection(clusterApiUrl("devnet"));

// Load the keypair from the SECRET_KEY environment variable (set in .env).
// This keypair acts as the transaction fee payer AND the mint/freeze authority.
const user = getKeypairFromEnvironment("SECRET_KEY");

console.log(
  `🔑 Loaded our keypair securely, using an env file! Our public key is: ${user.publicKey.toBase58()}`
);

// createMint() is a helper from @solana/spl-token that bundles two instructions
// into one transaction:
//   1. SystemProgram.createAccount  — allocates space & lamports for the new account
//   2. createInitializeMintInstruction — marks the account as a Token Mint
//
// Arguments:
//   connection       — the RPC connection to use
//   user             — the fee payer (signs and pays for the transaction)
//   user.publicKey   — the MINT AUTHORITY: the only address allowed to mint new tokens
//   null             — the FREEZE AUTHORITY: set to null to make freezing impossible
//                      (pass a PublicKey here if you want the ability to freeze accounts)
//   2                — DECIMALS: tokens are stored as integers on-chain; 2 decimals
//                      means 100 on-chain units = 1.00 display token (like cents)
const tokenMint = await createMint(connection, user, user.publicKey, null, 2);

// getExplorerLink generates a URL to Solana Explorer so you can inspect the
// mint account in a browser — useful for verifying the mint was created correctly.
const link = getExplorerLink("address", tokenMint.toString(), "devnet");

console.log(`✅ Success! Created token mint: ${link}`);
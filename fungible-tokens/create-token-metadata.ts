/**
 * create-token-metadata.ts
 *
 * PURPOSE: Attaches on-chain metadata (name, symbol, URI) to an existing SPL Token Mint
 *          using the Metaplex Token Metadata program (v2 / DataV2 format).
 *
 * CONCEPT — Token Metadata:
 *   The SPL Token program itself only tracks supply and authorities — it has no concept
 *   of a human-readable name or logo. The Metaplex Token Metadata program adds a linked
 *   "Metadata" account to any Mint that stores: name, symbol, and a URI pointing to a
 *   JSON file (hosted off-chain) with richer info (image, description, attributes, etc.).
 *   Wallets and explorers read this account to display your token nicely.
 *
 * PRE-REQUISITE: Run create-token-mint.ts first and paste the resulting mint address
 *                into the tokenMintAccount variable below.
 *
 * RUN: npx esrun create-token-metadata.ts
 */

// This uses "@metaplex-foundation/mpl-token-metadata@2" to create tokens
import "dotenv/config";
import {
  getKeypairFromEnvironment,
  getExplorerLink,
} from "@solana-developers/helpers";
import {
  Connection,
  clusterApiUrl,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  DataV2,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";

const user = getKeypairFromEnvironment("SECRET_KEY");

const connection = new Connection(clusterApiUrl("devnet"));

console.log(
  `🔑 We've loaded our keypair securely, using an env file! Our public key is: ${user.publicKey.toBase58()}`
);

// The Metaplex Token Metadata program is a well-known, audited program deployed
// at a fixed address on all Solana clusters. It manages all NFT & token metadata.
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// ⚠️  Replace this with the mint address printed by create-token-mint.ts
const tokenMintAccount = new PublicKey("YOUR_TOKEN_MINT_ADDRESS_HERE");

// DataV2 is the metadata schema used by Metaplex's v2 instruction.
// All fields are stored on-chain inside the Metadata PDA account.
const metadataData: DataV2 = {
  name: "Solana Training Token",   // Display name shown in wallets/explorers
  symbol: "TRAINING",              // Ticker symbol (e.g. SOL, USDC)
  // URI points to a JSON file following the Metaplex off-chain metadata standard.
  // In production, host this JSON on immutable storage (Arweave, IPFS, Pinata)
  // so token metadata cannot be changed without on-chain authority.
  uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-token-metadata.json",
  sellerFeeBasisPoints: 0,  // Royalty in basis points (100 = 1%). 0 = no royalty.
  creators: null,           // Optional list of creator addresses + their revenue shares
  collection: null,         // Collection this token belongs to (NFT feature; null for fungible)
  uses: null,               // Optional "uses" feature (e.g. consumable items); null = unused
};

// CONCEPT — Program Derived Address (PDA):
//   A PDA is a deterministic address derived from a program ID + seeds, with no private key.
//   The Metadata program stores each token's metadata at a PDA derived from:
//     ["metadata", TOKEN_METADATA_PROGRAM_ID, mintAddress]
//   This guarantees a 1-to-1 relationship: one Mint → one canonical Metadata account.
//
// findProgramAddressSync searches for a valid PDA (off the Ed25519 curve) and also
// returns a "bump" seed (a nonce used to push the point off the curve).
const metadataPDAAndBump = PublicKey.findProgramAddressSync(
  [
    Buffer.from("metadata"),
    TOKEN_METADATA_PROGRAM_ID.toBuffer(),
    tokenMintAccount.toBuffer(),
  ],
  TOKEN_METADATA_PROGRAM_ID
);

// We only need the PDA address itself (index 0), not the bump seed.
const metadataPDA = metadataPDAAndBump[0];

// Build a new transaction and add the create-metadata instruction to it.
// Using a manual Transaction object gives us fine-grained control over what
// instructions are bundled together (vs. helper functions that build + send automatically).
const transaction = new Transaction();

// createCreateMetadataAccountV3Instruction constructs the raw instruction
// that tells the Token Metadata program to initialise the Metadata PDA.
//
// Account arguments ("accounts" map):
//   metadata        — the PDA where metadata will be stored
//   mint            — the token mint this metadata is attached to
//   mintAuthority   — must sign, proving we own the mint
//   payer           — pays the rent for the new Metadata account
//   updateAuthority — the address that can update metadata in the future
//
// Data arguments ("args" map):
//   isMutable       — if true, the updateAuthority can change metadata later;
//                     set to false to make metadata permanently immutable
const createMetadataAccountInstruction =
  createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPDA,
      mint: tokenMintAccount,
      mintAuthority: user.publicKey,
      payer: user.publicKey,
      updateAuthority: user.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        collectionDetails: null, // null = fungible token (not an NFT collection parent)
        data: metadataData,
        isMutable: true,
      },
    }
  );

transaction.add(createMetadataAccountInstruction);

// sendAndConfirmTransaction sends the transaction and waits until it reaches
// "confirmed" commitment, meaning a supermajority of validators have validated it.
// The signers array [user] provides the private key signatures required.
const transactionSignature = await sendAndConfirmTransaction(
  connection,
  transaction,
  [user]
);

const transactionLink = getExplorerLink(
  "transaction",
  transactionSignature,
  "devnet"
);

console.log(`✅ Transaction confirmed, explorer link is: ${transactionLink}!`);

// Print a direct link to the mint account — you should now see the token name
// and symbol displayed on Solana Explorer under the mint address.
const tokenMintLink = getExplorerLink(
  "address",
  tokenMintAccount.toString(),
  "devnet"
);

console.log(`✅ Look at the token mint again: ${tokenMintLink}!`);
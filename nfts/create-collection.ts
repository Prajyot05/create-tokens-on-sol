/**
 * create-collection.ts
 *
 * PURPOSE: Creates an NFT Collection — a parent NFT that groups individual NFTs together.
 *
 * CONCEPT — NFT Collections on Solana:
 *   On Solana, a "collection" is itself an NFT (with isCollection: true). Individual NFTs
 *   then reference this collection NFT's mint address, creating a parent-child relationship.
 *   Wallets and marketplaces use this link to group and display NFTs together.
 *
 *   Verified vs Unverified:
 *     When an NFT is minted, its collection field is initially UNVERIFIED (verified: false).
 *     The collection authority must explicitly verify each member NFT (see verify-nft.ts).
 *     Only verified members appear under the collection in wallets/marketplaces.
 *
 * CONCEPT — Umi vs. web3.js:
 *   The NFT scripts use the Metaplex "Umi" framework instead of raw @solana/web3.js.
 *   Umi is a higher-level SDK that wraps RPC calls, transaction building, and serialisation
 *   behind a cleaner interface specifically designed for Metaplex programs.
 *
 * CONCEPT — mplTokenMetadata plugin:
 *   umi.use(mplTokenMetadata()) registers the Token Metadata program's instruction
 *   builders and resolvers into the Umi instance so you can call helpers like createNft().
 *
 * RUN: npx esrun create-collection.ts
 */

import {
  createNft,
  fetchDigitalAsset,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";

// createUmi bootstraps a Umi context connected to the given RPC endpoint.
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import {
  generateSigner,     // Creates a new random keypair (signer) within the Umi context
  keypairIdentity,    // Plugin that sets the Umi identity/payer to a given keypair
  percentAmount,      // Helper to express percentages as basis points (e.g. 0% royalty)
} from "@metaplex-foundation/umi";

// Standard web3.js connection — used here only for the airdrop check.
const connection = new Connection(clusterApiUrl("devnet"));

// getKeypairFromFile loads a keypair from ~/.config/solana/id.json by default.
// This is the Solana CLI's default keypair location.
const user = await getKeypairFromFile();

// airdropIfRequired requests a devnet airdrop ONLY if the wallet balance is below
// the threshold (0.5 SOL). This avoids unnecessary airdrop requests.
// Arguments: connection, publicKey, airdropAmount, minimumBalance
await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,   // Amount to airdrop if needed
  0.5 * LAMPORTS_PER_SOL  // Only airdrop if balance is below this
);

console.log("Loaded user", user.publicKey.toBase58());

// Create a Umi instance connected to devnet.
// connection.rpcEndpoint extracts the URL string from the web3.js Connection object.
const umi = createUmi(connection.rpcEndpoint);

// Register the mpl-token-metadata program so Umi knows how to build its instructions.
umi.use(mplTokenMetadata());

// Umi uses its own keypair type; convert the web3.js keypair's raw secret key bytes.
const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);

// keypairIdentity sets this keypair as both the transaction fee payer and the
// default signer for all Umi operations in this session.
umi.use(keypairIdentity(umiUser));

console.log("Set up Umi instance for user");

// generateSigner creates a fresh random keypair for the collection's mint account.
// The public key of this signer becomes the collection NFT's mint address.
const collectionMint = generateSigner(umi);

// createNft() builds and returns a Umi transaction that:
//   1. Creates a new Mint account (the NFT's token type)
//   2. Creates a Token account with exactly 1 token (NFTs have supply of 1)
//   3. Creates a Metadata account (name, symbol, URI via Token Metadata program)
//   4. Creates a MasterEdition account (marks this as an NFT, prevents future minting)
//
// isCollection: true — flags this NFT as a Collection parent in the Metadata account.
// sellerFeeBasisPoints: percentAmount(0) — 0% royalty on secondary sales.
const transaction = await createNft(umi, {
  mint: collectionMint,
  name: "My Collection",
  symbol: "MC",
  // JSON file describing the collection (image, description, etc.) following the
  // Metaplex off-chain metadata standard. Host on Arweave/IPFS in production.
  uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-collection-offchain-data.json",
  sellerFeeBasisPoints: percentAmount(0),
  isCollection: true,  // This is what makes it a Collection NFT, not a regular NFT
});

// Send the transaction and wait for confirmation before proceeding.
await transaction.sendAndConfirm(umi);

// fetchDigitalAsset retrieves the on-chain data (Mint + Metadata + MasterEdition)
// for the newly created collection NFT so we can inspect its mint address.
const createdCollectionNft = await fetchDigitalAsset(
  umi,
  collectionMint.publicKey
);

// 📦 Save this collection mint address! You'll need it in create-nft.ts.
console.log(
  `Created Collection 📦! Address is ${getExplorerLink(
    "address",
    createdCollectionNft.mint.publicKey,
    "devnet"
  )}`
);
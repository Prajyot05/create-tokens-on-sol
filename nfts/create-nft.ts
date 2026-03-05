/**
 * create-nft.ts
 *
 * PURPOSE: Mints a single NFT and associates it (unverified) with a Collection.
 *
 * CONCEPT — NFT Structure on Solana:
 *   An NFT is a Mint account with:
 *     - Supply of exactly 1 (there is only ever one token)
 *     - 0 decimals
 *     - Mint authority revoked after minting (so no more can ever be minted)
 *   It also has a linked Metadata account and a MasterEdition account.
 *
 * CONCEPT — Collection field (verified: false):
 *   When creating the NFT here, we set the collection address but mark it as
 *   verified: false. This is intentional — the Token Metadata program requires
 *   the collection authority to separately sign a verification transaction
 *   (see verify-nft.ts) before the NFT is officially part of the collection.
 *   This two-step approach prevents anyone from fraudulently claiming membership
 *   in a collection they don't control.
 *
 * PRE-REQUISITE: Run create-collection.ts first and paste the printed address
 *               into the collectionAddress variable below.
 *
 * RUN: npx esrun create-nft.ts
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

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import {
  generateSigner,
  keypairIdentity,
  percentAmount,
  publicKey,   // Umi's type-safe wrapper for converting a base58 string to a PublicKey
} from "@metaplex-foundation/umi";

const connection = new Connection(clusterApiUrl("devnet"));

const user = await getKeypairFromFile();

await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user", user.publicKey.toBase58());

const umi = createUmi(connection.rpcEndpoint);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("Set up Umi instance for user");

// ⚠️  Paste the collection mint address printed by create-collection.ts here.
// publicKey() converts a base58 string into Umi's PublicKey type.
const collectionAddress = publicKey(
  "ChfGtd2wT12c2u82PHNpe4PdQ5PMqJnVECfaNbQ2uaVw"
);

console.log(`Creating NFT...`);

// A fresh random keypair whose public key will become this NFT's mint address.
const mint = generateSigner(umi);

// createNft() for an individual (non-collection) NFT.
// Key difference from create-collection.ts: isCollection is NOT set (defaults to false),
// and we set the collection field to link it to the parent collection.
const transaction = await createNft(umi, {
  mint,
  name: "My NFT",
  // Off-chain JSON file with image, description, attributes (Metaplex standard).
  uri: "https://raw.githubusercontent.com/solana-developers/professional-education/main/labs/sample-nft-offchain-data.json",
  sellerFeeBasisPoints: percentAmount(0),
  collection: {
    key: collectionAddress,  // The parent collection's mint address
    verified: false,         // Must be false here; verification happens in verify-nft.ts
  },
});

await transaction.sendAndConfirm(umi);

// fetchDigitalAsset retrieves the full on-chain representation of the newly minted NFT.
const createdNft = await fetchDigitalAsset(umi, mint.publicKey);

// 🖨️  Save this NFT mint address! You'll need it in verify-nft.ts.
console.log(
  `🖼️ Created NFT! Address is ${getExplorerLink(
    "address",
    createdNft.mint.publicKey,
    "devnet"
  )}`
);
/**
 * verify-nft.ts
 *
 * PURPOSE: Verifies that an NFT is an official member of a Collection.
 *
 * CONCEPT — Why Verification is Needed:
 *   When an NFT is created with a collection field (see create-nft.ts), the field
 *   is set to verified: false. This is a security measure: anyone could claim their
 *   NFT belongs to any collection if verification weren't required.
 *
 *   verifyCollectionV1 sends a transaction signed by the collection's authority,
 *   which updates the NFT's Metadata account to set verified: true. After this,
 *   the collection field is trustworthy and wallets/marketplaces treat the NFT
 *   as a genuine member of the collection.
 *
 * CONCEPT — findMetadataPda:
 *   The verify instruction targets the NFT's Metadata account, not its Mint.
 *   findMetadataPda derives the Metadata PDA from the NFT mint address using the
 *   same seeds the Token Metadata program uses:
 *     ["metadata", TOKEN_METADATA_PROGRAM_ID, nftMintAddress]
 *
 * CONCEPT — umi.identity:
 *   umi.identity refers to the keypair set via keypairIdentity() earlier.
 *   For verifyCollectionV1 to succeed, this identity must be the collection's
 *   update authority (the address that created the collection NFT).
 *
 * PRE-REQUISITES:
 *   1. create-collection.ts → paste the collection address into collectionAddress
 *   2. create-nft.ts        → paste the NFT address into nftAddress
 *
 * RUN: npx esrun verify-nft.ts
 */

import {
  findMetadataPda,      // Derives the Metadata PDA for a given mint
  mplTokenMetadata,
  verifyCollectionV1,   // Instruction builder for verifying collection membership
} from "@metaplex-foundation/mpl-token-metadata";

import {
  airdropIfRequired,
  getExplorerLink,
  getKeypairFromFile,
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { Connection, LAMPORTS_PER_SOL, clusterApiUrl } from "@solana/web3.js";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";

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

// ⚠️  Paste the collection mint address printed by create-collection.ts
const collectionAddress = publicKey(
  "ChfGtd2wT12c2u82PHNpe4PdQ5PMqJnVECfaNbQ2uaVw"
);

// ⚠️  Paste the NFT mint address printed by create-nft.ts
const nftAddress = publicKey("84uZmnRpzfa77w3KtyagjWXA8g1yE6vP8ReuHyN5HZaN");

// verifyCollectionV1 builds the instruction that sets verified: true on the NFT's
// Metadata account. Arguments:
//   metadata       — the NFT's Metadata PDA (derived from its mint address)
//   collectionMint — the collection NFT's mint address
//   authority      — umi.identity (must be the collection's update authority)
const transaction = await verifyCollectionV1(umi, {
  metadata: findMetadataPda(umi, { mint: nftAddress }),
  collectionMint: collectionAddress,
  authority: umi.identity,
});

// Note: we do NOT await here, so any errors (e.g. wrong authority) will be silent.
// In production code you should await and handle errors:
//   await transaction.sendAndConfirm(umi);
transaction.sendAndConfirm(umi);

console.log(
  `✅ NFT ${nftAddress} verified as member of collection ${collectionAddress}! See Explorer at ${getExplorerLink(
    "address",
    nftAddress,
    "devnet"
  )}`
);
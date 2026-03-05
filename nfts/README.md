SOLANA NFTs – QUICK REVISION
========================================================

1. NFTs are just SPL Tokens
- Minted from token mint accounts.
- Stored in Associated Token Accounts (ATAs).
- Transferred using the token program.

2. Distinct Characteristics
- Unique: Only 1 token is ever minted (Supply = 1).
- Indivisible: Cannot be broken up (Decimals = 0).

3. Off-Chain Metadata
- Contains a link (URI) to an off-chain JSON file.
- Stored on decentralized storage like Arweave/Irys or IPFS.
- This JSON file links to media (images, videos, 3D objects), traits, and project info.

4. Authenticity & Collections
- Regular tokens (like USDC) are verified by checking if their Mint Address matches the official one.
- Since every single NFT has its own unique Mint Address, we use "Collections".
- Collections verify that an NFT was minted by the correct project and isn't a forgery.

KEY IDEA
========================================================

An NFT on Solana is basically just an SPL token with 0 decimals, a capped supply of exactly 1, and an attached metadata URI pointing to its artwork and traits.
========================================================
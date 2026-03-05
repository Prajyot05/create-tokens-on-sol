SOLANA TOKENS – QUICK REVISION
========================================================

1. Native Token (SOL)
- SOL is the native token of Solana.
- It is built directly into the Solana blockchain.
- Used primarily to pay transaction fees and rent.

2. SPL Tokens
- All tokens other than SOL on Solana are called SPL Tokens.
- SPL = Solana Program Library.
- SPL provides the token program used to create and manage tokens.

Examples of SPL tokens:
- Stablecoins (e.g., USDC)
- NFTs
- Utility tokens
- Tokens representing real-world assets (stocks, metals, commodities)
- Meme tokens (dog tokens, etc.)

3. Token Mint
- Every SPL token is created by a "Token Mint".
- A token mint is like a factory that produces tokens.
- Each token has its own unique mint account.

Example:
USDC → has its own mint address.

4. Mint Authority
- The Mint Authority controls the mint.
- Only the mint authority can create (mint) new tokens.
- The mint authority must sign transactions that mint tokens.

Example:
USDC mint authority → Circle.

If you create your own token:
- You become the mint authority.

5. Token Storage
Regular Solana accounts store only SOL.
SPL tokens require a separate storage account.

This is called a:
→ Associated Token Account (ATA)

6. Associated Token Account (ATA)
- A special account used to store tokens for a wallet.
- Each wallet + token mint pair has exactly one ATA.

Structure:
ATA = PDA(wallet_address + token_mint)

Examples:
Alice + USDC mint → Alice's USDC token account
Bob + USDC mint → Bob's USDC token account
Alice + DogToken mint → Alice's DogToken account

This allows anyone to deterministically find a user's token account.

KEY IDEA
========================================================

Token Mint → creates tokens
Mint Authority → controls minting
Associated Token Account → stores tokens for a wallet

Wallets store SOL directly.
Tokens are stored in Associated Token Accounts.
========================================================


PART 1: ENVIRONMENT & WALLET SETUP
========================================================
Before creating a token, you need to configure your environment to use the 
Devnet (so you don't spend real money while testing) and create a wallet.

1. Set the Solana CLI to use Devnet
solana config set --url devnet
Explanation: Points your CLI to the Solana Devnet cluster. All transactions will happen on this testing network.

2. Generate a new Solana wallet
solana-keygen new --outfile ~/.config/solana/id.json
Explanation: Creates a new keypair (wallet) and saves it locally. This wallet will act as your Mint Authority and fee payer. Save the seed phrase it generates!

3. Set this new wallet as your default keypair
solana config set --keypair ~/.config/solana/id.json
Explanation: Tells the CLI to use this wallet for all upcoming transactions.

4. Airdrop some Devnet SOL
solana airdrop 2
Explanation: Requests 2 fake SOL from the Devnet faucet. You need SOL to pay for the transaction fees and rent required to create your token mint and accounts.

5. Check your SOL balance
solana balance
Explanation: Verifies that the airdrop was successful and you have SOL in your wallet.


PART 2: CREATING THE TOKEN MINT
========================================================
Now we create the "factory" (Mint) for your new token.

1. Create the Token Mint
spl-token create-token
Explanation: Creates a new SPL token mint. 
IMPORTANT: The output will give you a "Creating token <TOKEN_ADDRESS>". 
Save this <TOKEN_ADDRESS>. It is the official contract address of your new token.

2. View the token mint details
spl-token supply <TOKEN_ADDRESS>
Explanation: Shows the current total supply of your token. Right now, it will be 0 because we haven't minted any tokens yet.


PART 3: CREATING ACCOUNTS & MINTING TOKENS
========================================================
Before we can mint tokens, we need a place to store them. 
We must create an Associated Token Account (ATA) for our wallet.

1. Create an Associated Token Account (ATA) for yourself
spl-token create-account <TOKEN_ADDRESS>
Explanation: Creates an ATA for your wallet to hold this specific token. 

2. Mint new tokens
spl-token mint <TOKEN_ADDRESS> 1000000
Explanation: Instructs the Mint Authority (you) to create 1,000,000 tokens and deposit them into your ATA.

3. Check your token balance
spl-token balance <TOKEN_ADDRESS>
Explanation: Verifies how many of these specific tokens your wallet holds.

4. View all your token accounts
spl-token accounts
Explanation: Lists all SPL tokens you own, showing the token addresses and your balances across all ATAs.


PART 4: DISTRIBUTING TOKENS (TRANSFERS)
========================================================
How to send your newly created tokens to other people.

1. Transfer tokens to another wallet
spl-token transfer <TOKEN_ADDRESS> 500 <RECIPIENT_WALLET_ADDRESS> --fund-recipient
Explanation: Sends 500 of your tokens to the recipient's wallet. 
The '--fund-recipient' flag is crucial: if the recipient doesn't already have an ATA for your token, this flag pays the tiny SOL fee to create one for them on the fly.


PART 5: SUPPLY MANAGEMENT & SECURITY
========================================================
Operations for burning tokens or locking the supply permanently.

1. Burn tokens (Remove them from circulation)
spl-token burn <YOUR_ATA_ADDRESS> 1000
Explanation: Destroys 1,000 tokens from your specific token account, permanently reducing the total supply. Note: Use your token account address here, not the main token mint address.

2. Disable future minting (Cap the supply)
spl-token authorize <TOKEN_ADDRESS> mint --disable
Explanation: Revokes your Mint Authority. Once executed, NO ONE (not even you) can ever mint more of this token. This creates a fixed-supply token, which builds trust with potential buyers/users.
WARNING: This action is irreversible!
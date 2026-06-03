# NFT Marketplace

## Project Overview

**Objective:** Develop a digital asset marketplace that automatically distributes sales revenue to multiple stakeholders upon every trade.

**Key requirements:**
- Advanced ERC-721: Extend the standard NFT contract to support EIP-2981 (Royalty Standard) with a custom multi-receiver array
- Payment Splitter: Implement a "Pull-payment" pattern (claim-based) to ensure the contract is secure against Reentrancy and "Out of Gas" errors when distributing funds to many creators
- Atomic Swaps: Ensure that the transfer of the NFT and the distribution of funds (including royalties) occur in a single atomic transaction

## Setup & Deployment

### Prerequisites

- Node.js 18+
- MetaMask browser extension
- Sepolia test ETH (from [sepoliafaucet.com](https://sepoliafaucet.com))

### 1. Install dependencies

```bash
npm install
npm uninstall hardhat
npm install --save-dev hardhat@2 @nomicfoundation/hardhat-toolbox dotenv
```

Verify Hardhat 2 is installed:

```bash
npx hardhat --version
```

Should print `2.x.x`, not `3.x.x`.

### 2. Initialize Hardhat

```bash
npx hardhat init
```

When prompted:
- **Which version?** → Choose `Hardhat 2 (older version)`
- **Path** → Press Enter (use current directory `.`)
- **Project type** → Choose `A Javascript project using Mocha and Ethers.js`
- **Install dependencies?** → Choose `n` (No — already installed via hardhat-toolbox)

### 3. Configure environment

Create `.env` in the project root:

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
PRIVATE_KEY=your_metamask_private_key_here
```

> Never commit `.env` to Git. It is listed in `.gitignore`.

### 4. Configure Hardhat
`hardhat.config.js`:

```js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.28" },
      { version: "0.8.24" },
      { version: "0.8.20" },
      { version: "0.4.24" },
    ],
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
};
```

### 5. Compile

```bash
npx hardhat compile
```

### 6. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Output:
```
Deploying with: 0xYourWalletAddress
ArtNFT deployed to:      sth here   
NFTMarketplace deployed to: sth here
```

### 7. Update frontend addresses

Edit `Frontend/src/abis/addresses.js`:

```js
11155111: {
  MARKETPLACE: "YOUR_NFTMARKETPLACE_KEY",
  NFT:         "YOUR_ARTNFT_KEY",
},
```

### 8. Run the frontend

```bash
cd Frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser with MetaMask set to **Sepolia**.

---

## Demo Guide

### Step 1 — Mint an ArtNFT

Go to **Mint NFT** tab and fill in:

| Field | Example value |
|---|---|
| Collector | Your wallet address |
| Title | `Sunset #1` |
| Token URI | `https://ipfs.io/ipfs/QmTest` |
| Royalty receiver | Your wallet (or PaymentSplitter address) |
| Royalty bps | `1000` (= 10%) |

Click **✦ Mint ArtNFT** → confirm in MetaMask.

This calls `ArtNFT.mint()` — only the contract owner can mint.

### Step 2 — List the NFT

Go to **My NFTs** tab:
- Your minted token appears with its title and royalty info
- Enter a price e.g. `0.001` ETH
- Click **Approve & list** → confirm two MetaMask popups:
  1. `setApprovalForAll(marketplace, true)` — one-time approval
  2. `listNFT(nft, tokenId, price)` — records listing on-chain

### Step 3 — Buy the NFT (atomic swap)

Go to **Marketplace** tab:
- The listed token appears with price and royalty badge
- Click **Buy now** → confirm in MetaMask
- One transaction atomically: transfers NFT + distributes royalties

### Step 4 — Claim royalties (pull-payment)

Go to **Royalties** tab:
- **Marketplace pending** shows your accumulated ETH
- Click **↓ Withdraw** to claim via `withdraw()`
- Demonstrates effects-before-interactions: balance zeroed before ETH transfer

### Step 5 — PaymentSplitter (multi-receiver royalties)

Still on **Royalties** tab:
- Paste a deployed `PaymentSplitter` address
- Click **Load** → see all payees and their released amounts
- Click **Release** per payee to pull their proportional share

### Step 6 — Verify on Activity feed

Go to **Activity** tab:
- See all events: `ArtMinted`, `NFTListed`, `NFTSold`, `RoyaltyAccrued`, `Withdrawal`
- Filter by event type using the tab buttons
- Each event links to Sepolia Etherscan transaction

---

## Technical Concepts

### EIP-2981 (NFT Royalty Standard)

A standard interface for NFT royalty payments. Marketplaces call `royaltyInfo(tokenId, salePrice)` before every sale to determine how much royalty to pay and to whom.

```solidity
function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external view returns (address receiver, uint256 royaltyAmount)
```

Royalty amount = `salePrice × royaltyBps / 10000`

### Pull-Payment Pattern

Instead of the contract pushing ETH to multiple receivers (which can fail if one receiver is a malicious contract), funds are credited to a mapping and each receiver pulls their own funds:

```
Push (dangerous):  contract → sends ETH to A, B, C, D (any can block all)
Pull (safe):       contract → credits mapping → A pulls, B pulls, C pulls independently
```

### Atomic Swap

The NFT transfer and fund distribution happen in a single transaction. Either everything succeeds or everything reverts — there is no intermediate state where the NFT has been transferred but funds have not been distributed.

### Reentrancy Attack (and prevention)

A reentrancy attack occurs when a malicious contract calls back into the marketplace during an ETH transfer. Prevention:

```solidity
//  Vulnerable — sends ETH before zeroing balance
function withdraw() external {
    payable(msg.sender).transfer(pendingWithdrawals[msg.sender]);
    pendingWithdrawals[msg.sender] = 0;
}

//  Safe — zeros balance BEFORE sending ETH (Checks-Effects-Interactions)
function withdraw() external nonReentrant {
    uint256 amount = pendingWithdrawals[msg.sender];
    pendingWithdrawals[msg.sender] = 0;
    payable(msg.sender).transfer(amount);
}
```

### Basis Points (BPS)

A unit for expressing percentages precisely without floating point:

| BPS | Percentage |
|---|---|
| 100 | 1% |
| 500 | 5% |
| 1000 | 10% |
| 10000 | 100% |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart contracts | Solidity 0.8.20 |
| NFT standard | ERC-721 (OpenZeppelin) |
| Royalty standard | EIP-2981 |
| Development framework | Hardhat 2 |
| Testnet | Ethereum Sepolia |
| Frontend | React + Vite |
| Blockchain library | ethers.js v6 |
| Wallet | MetaMask |
| RPC provider | Alchemy |
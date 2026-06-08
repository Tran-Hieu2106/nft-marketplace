// ─────────────────────────────────────────────────────────────────
//  Update these after deploying your contracts.
//  Run:  npx hardhat run scripts/deploy.js --network <network>
// ─────────────────────────────────────────────────────────────────

export const ADDRESSES = {
  // Hardhat local (chain 31337) — replace after `npx hardhat node`
  31337: {
    MARKETPLACE: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    NFT:         "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
  // Sepolia testnet — fill in after deploying
    11155111: {
    MARKETPLACE: "0x4415A39487C220e8153Be69bBba8A923cC0bD951",
    NFT:         "0x0F6d06933D5F6126cC9EC3904669c85b578B1aa3",
  },
};

export function getAddresses(chainId) {
  return ADDRESSES[chainId] ?? null;
}

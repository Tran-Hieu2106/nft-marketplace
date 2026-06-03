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
    MARKETPLACE: "0xA6c45133C8c4F60108114ab78832240271d0fe8c",
    NFT:         "0x96586dCE8bEf195f62D21548cb9CAB74bdE538d6",
  },
};

export function getAddresses(chainId) {
  return ADDRESSES[chainId] ?? null;
}

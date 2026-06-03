const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // 1. Deploy ArtNFT
  const ArtNFT = await ethers.getContractFactory("ArtNFT");
  const artNFT = await ArtNFT.deploy();
  await artNFT.waitForDeployment();
  console.log("ArtNFT deployed to:", await artNFT.getAddress());

  // 2. Deploy NFTMarketplace
  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();
  console.log("NFTMarketplace deployed to:", await marketplace.getAddress());

  console.log("\n=== COPY THESE INTO src/abis/addresses.js ===");
  console.log(`NFT:         "${await artNFT.getAddress()}"`);
  console.log(`MARKETPLACE: "${await marketplace.getAddress()}"`);
}

main().catch((err) => { console.error(err); process.exit(1); });
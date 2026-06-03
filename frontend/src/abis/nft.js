// ABI for ArtNFT.sol (extends MyERC721 + MyOwnable + IERC2981)
export const NFT_ABI = [
  // ── Mint ──────────────────────────────────────────────────────────
  // mint(address collector, string title, string uri, address royaltyReceiver, uint96 royaltyBps)
  {
    inputs: [
      { name: "collector",       type: "address" },
      { name: "title",           type: "string"  },
      { name: "uri",             type: "string"  },
      { name: "royaltyReceiver", type: "address" },
      { name: "royaltyBps",      type: "uint96"  },
    ],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Burn ──────────────────────────────────────────────────────────
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Update royalty (onlyOwner) ────────────────────────────────────
  {
    inputs: [
      { name: "tokenId",  type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "bps",      type: "uint96"  },
    ],
    name: "updateRoyalty",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Art metadata ──────────────────────────────────────────────────
  // artPieces(uint256) → (title, createdAt, royaltyBps, royaltyReceiver)
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "artPieces",
    outputs: [
      { name: "title",           type: "string"  },
      { name: "createdAt",       type: "uint256" },
      { name: "royaltyBps",      type: "uint96"  },
      { name: "royaltyReceiver", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ── EIP-2981 ──────────────────────────────────────────────────────
  {
    inputs: [
      { name: "tokenId",   type: "uint256" },
      { name: "salePrice", type: "uint256" },
    ],
    name: "royaltyInfo",
    outputs: [
      { name: "receiver",      type: "address" },
      { name: "royaltyAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },

  // ── Standard ERC-721 ─────────────────────────────────────────────
  {
    inputs: [{ name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to",      type: "address" },
      { name: "tokenId", type: "uint256" },
    ],
    name: "approve",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool"    },
    ],
    name: "setApprovalForAll",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "tokenId", type: "uint256" }],
    name: "getApproved",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "owner",    type: "address" },
      { name: "operator", type: "address" },
    ],
    name: "isApprovedForAll",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },

  // ── MyOwnable ─────────────────────────────────────────────────────
  {
    inputs: [],
    name: "owner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "acceptOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Events ────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "tokenId",   type: "uint256" },
      { indexed: false, name: "title",     type: "string"  },
      { indexed: true,  name: "collector", type: "address" },
    ],
    name: "ArtMinted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true,  name: "tokenId",  type: "uint256" },
      { indexed: false, name: "receiver", type: "address" },
      { indexed: false, name: "bps",      type: "uint96"  },
    ],
    name: "RoyaltyUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from",    type: "address" },
      { indexed: true, name: "to",      type: "address" },
      { indexed: true, name: "tokenId", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
];

// ABI for PaymentSplitter.sol
// Deployed per-token: constructor(address[] payees, uint256[] shares)
// The royaltyReceiver on ArtNFT points to one of these contracts.
export const SPLITTER_ABI = [
  // ── View ──────────────────────────────────────────────────────────
  {
    inputs: [],
    name: "totalShares",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalReleased",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "released",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "index", type: "uint256" }],
    name: "payee",
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },

  // ── Release (pull-payment for one payee) ──────────────────────────
  // Call release(yourAddress) to pull your proportional share
  {
    inputs: [{ name: "account", type: "address" }],
    name: "release",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // ── Events ────────────────────────────────────────────────────────
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "account", type: "address" },
      { indexed: false, name: "shares",  type: "uint256" },
    ],
    name: "PayeeAdded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "to",     type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PaymentReleased",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: false, name: "from",   type: "address" },
      { indexed: false, name: "amount", type: "uint256" },
    ],
    name: "PaymentReceived",
    type: "event",
  },
];

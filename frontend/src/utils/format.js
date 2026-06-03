import { ethers } from "ethers";

/** Shorten 0xABCD...1234 */
export function fmt(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

/** basis points → human percent string  (1000 → "10.00%") */
export function bpsToPercent(bps) {
  return (Number(bps) / 100).toFixed(2) + "%";
}

/** wei BigInt → ETH string rounded to 4 dp */
export function fmtEth(wei) {
  if (wei === undefined || wei === null) return "—";
  return parseFloat(ethers.formatEther(wei)).toFixed(4) + " ETH";
}

/** Copy text to clipboard */
export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Return Etherscan-like explorer URL for tx hash */
export function explorerTx(chainId, hash) {
  const bases = {
    1:        "https://etherscan.io/tx/",
    11155111: "https://sepolia.etherscan.io/tx/",
    31337:    null, // local hardhat — no explorer
  };
  const base = bases[chainId];
  return base ? base + hash : null;
}

/** Debounce a function */
export function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

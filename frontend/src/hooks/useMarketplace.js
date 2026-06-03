import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { MARKETPLACE_ABI } from "../abis/marketplace";
import { NFT_ABI }         from "../abis/nft";
import { SPLITTER_ABI }    from "../abis/splitter";
import { getAddresses }    from "../abis/addresses";

/**
 * Central hook for all contract interactions.
 * Receives { signer, provider, chainId, account } from useWallet.
 */
export function useMarketplace({ signer, provider, chainId, account }) {
  const [loading, setLoading] = useState({});
  const [txHash,  setTxHash]  = useState(null);

  // ── contract factory helpers ───────────────────────────────────────
  function addrs() {
    const a = getAddresses(chainId);
    if (!a) throw new Error(`No contracts configured for chain ${chainId}`);
    if (!a.MARKETPLACE || !a.NFT) {
      throw new Error(
        `Contract addresses are empty for chain ${chainId}. ` +
        `Fill in MARKETPLACE and NFT addresses in src/abis/addresses.js`
      );
    }
    return a;
  }

  function marketplace(sp) {
    return new ethers.Contract(addrs().MARKETPLACE, MARKETPLACE_ABI, sp ?? signer);
  }

  function nft(sp) {
    return new ethers.Contract(addrs().NFT, NFT_ABI, sp ?? signer);
  }

  function splitter(address, sp) {
    return new ethers.Contract(address, SPLITTER_ABI, sp ?? signer);
  }

  // ── tx helper ─────────────────────────────────────────────────────
  function setLoad(key, val) {
    setLoading((p) => ({ ...p, [key]: val }));
  }

  async function send(key, fn) {
    setLoad(key, true);
    try {
      const tx = await fn();
      setTxHash(tx.hash);
      await tx.wait();
      setTxHash(null);
      return { ok: true, hash: tx.hash };
    } catch (e) {
      const msg = e?.reason || e?.shortMessage || e?.message || "Transaction failed";
      return { ok: false, error: msg };
    } finally {
      setLoad(key, false);
    }
  }

  // ════════════════════════════════════════════════════════════════════
  //  READ — NFT (ArtNFT)
  // ════════════════════════════════════════════════════════════════════

  /** Full ArtPiece metadata for a token: { title, createdAt, royaltyBps, royaltyReceiver } */
  async function getArtPiece(tokenId) {
    return nft(provider).artPieces(tokenId);
  }

  /** EIP-2981: { receiver, royaltyAmount } for a given sale price */
  async function getRoyaltyInfo(tokenId, salePrice) {
    return nft(provider).royaltyInfo(tokenId, salePrice);
  }

  /** tokenURI string */
  async function getTokenURI(tokenId) {
    return nft(provider).tokenURI(tokenId);
  }

  /** ownerOf — throws if token doesn't exist */
  async function getOwnerOf(tokenId) {
    return nft(provider).ownerOf(tokenId);
  }

  /** balanceOf wallet */
  async function getNFTBalance(addr) {
    return nft(provider).balanceOf(addr ?? account);
  }

  /** Contract owner address */
  async function getNFTOwner() {
    return nft(provider).owner();
  }

  /** Check if marketplace is approved to transfer tokenId */
  async function isApproved(tokenId, ownerAddr) {
    const { MARKETPLACE } = addrs();
    const c = nft(provider);
    const [approved, approvedAll] = await Promise.all([
      c.getApproved(tokenId),
      c.isApprovedForAll(ownerAddr ?? account, MARKETPLACE),
    ]);
    return approved.toLowerCase() === MARKETPLACE.toLowerCase() || approvedAll;
  }

  // ════════════════════════════════════════════════════════════════════
  //  READ — Marketplace
  // ════════════════════════════════════════════════════════════════════

  /** Returns { seller, price } (price is BigInt wei). price===0n means not listed. */
  async function getListing(tokenId) {
    const { NFT } = addrs();
    return marketplace(provider).getListing(NFT, tokenId);
  }

  /** Returns pending ETH balance (BigInt wei) for an address */
  async function getPendingBalance(addr) {
    return marketplace(provider).getPendingBalance(addr ?? account);
  }

  // ════════════════════════════════════════════════════════════════════
  //  READ — PaymentSplitter
  // ════════════════════════════════════════════════════════════════════

  /**
   * Reads splitter state for a deployed PaymentSplitter contract.
   * Returns { totalShares, totalReleased, payees, shares, released }
   * where payees is an array built by scanning indices until it throws.
   */
  async function getSplitterInfo(splitterAddr) {
    const c = splitter(splitterAddr, provider);
    const [totalShares, totalReleased] = await Promise.all([
      c.totalShares(),
      c.totalReleased(),
    ]);

    // Scan payees array — stop at first revert
    const payees = [];
    for (let i = 0; i < 20; i++) {
      try {
        const addr = await c.payee(i);
        const rel  = await c.released(addr);
        payees.push({ address: addr, released: rel });
      } catch {
        break;
      }
    }

    return { totalShares, totalReleased, payees };
  }

  // ════════════════════════════════════════════════════════════════════
  //  WRITE — ArtNFT
  // ════════════════════════════════════════════════════════════════════

  /**
   * Mint a new ArtNFT (onlyOwner).
   * @param {string} collector  — recipient address
   * @param {string} title      — artwork title
   * @param {string} uri        — tokenURI (IPFS / HTTPS)
   * @param {string} royaltyReceiver — address (or PaymentSplitter) to receive royalties
   * @param {number} royaltyBps — basis points 0–10000
   */
  async function mintNFT(collector, title, uri, royaltyReceiver, royaltyBps) {
    return send("mint", () =>
      nft().mint(collector, title, uri, royaltyReceiver, royaltyBps)
    );
  }

  /** Burn own token */
  async function burnNFT(tokenId) {
    return send("burn_" + tokenId, () => nft().burn(tokenId));
  }

  /** Update royalty info for existing token (onlyOwner) */
  async function updateRoyalty(tokenId, receiver, bps) {
    return send("updateRoyalty_" + tokenId, () =>
      nft().updateRoyalty(tokenId, receiver, bps)
    );
  }

  // ════════════════════════════════════════════════════════════════════
  //  WRITE — Marketplace
  // ════════════════════════════════════════════════════════════════════

  /** Step 1 of listing: approve marketplace (setApprovalForAll = one approval for all) */
  async function approveMarketplace(tokenId, useApprovalForAll = true) {
    const { MARKETPLACE } = addrs();
    return send("approve_" + tokenId, () => {
      const c = nft();
      return useApprovalForAll
        ? c.setApprovalForAll(MARKETPLACE, true)
        : c.approve(MARKETPLACE, tokenId);
    });
  }

  /** Step 2 of listing: listNFT(nft, tokenId, price in wei) */
  async function listNFT(tokenId, priceEth) {
    const { NFT } = addrs();
    return send("list_" + tokenId, () =>
      marketplace().listNFT(NFT, tokenId, ethers.parseEther(priceEth))
    );
  }

  /** Cancel an active listing */
  async function cancelListing(tokenId) {
    const { NFT } = addrs();
    return send("cancel_" + tokenId, () =>
      marketplace().cancelListing(NFT, tokenId)
    );
  }

  /**
   * Atomic swap buy — sends exact ETH price.
   * Royalties distributed to royaltyReceiver (PaymentSplitter), seller gets the rest.
   */
  async function buyNFT(tokenId, priceEth) {
    const { NFT } = addrs();
    return send("buy_" + tokenId, () =>
      marketplace().buyNFT(NFT, tokenId, { value: ethers.parseEther(priceEth) })
    );
  }

  /**
   * Withdraw pending ETH from marketplace (seller proceeds + direct royalties).
   * Safe against reentrancy — balance zeroed before transfer.
   */
  async function withdraw() {
    return send("withdraw", () => marketplace().withdraw());
  }

  // ════════════════════════════════════════════════════════════════════
  //  WRITE — PaymentSplitter
  // ════════════════════════════════════════════════════════════════════

  /**
   * Release proportional royalties from a PaymentSplitter to `account`.
   * Call release(yourAddress) from the address that is a payee.
   */
  async function releaseSplitter(splitterAddr, account) {
    return send("release_" + splitterAddr, () =>
      splitter(splitterAddr).release(account)
    );
  }

  // ════════════════════════════════════════════════════════════════════
  //  EVENTS
  // ════════════════════════════════════════════════════════════════════

  /**
   * Fetch recent on-chain events from both marketplace and NFT contracts.
   * Looks back `blocksBack` blocks (default 10 000).
   */
  const fetchEvents = useCallback(async (blocksBack = 10000) => {
    if (!provider) return [];
    const mp   = marketplace(provider);
    const nftC = nft(provider);
    const latest = await provider.getBlockNumber();
    const from   = Math.max(0, latest - blocksBack);
    const opts   = { fromBlock: from, toBlock: "latest" };

    const [sold, listed, accrued, withdrawn, cancelled, minted, royaltyUpdated] =
      await Promise.all([
        mp.queryFilter(mp.filters.NFTSold(),           opts.fromBlock, opts.toBlock),
        mp.queryFilter(mp.filters.NFTListed(),         opts.fromBlock, opts.toBlock),
        mp.queryFilter(mp.filters.RoyaltyAccrued(),    opts.fromBlock, opts.toBlock),
        mp.queryFilter(mp.filters.Withdrawal(),        opts.fromBlock, opts.toBlock),
        mp.queryFilter(mp.filters.ListingCancelled(),  opts.fromBlock, opts.toBlock),
        nftC.queryFilter(nftC.filters.ArtMinted(),     opts.fromBlock, opts.toBlock),
        nftC.queryFilter(nftC.filters.RoyaltyUpdated(),opts.fromBlock, opts.toBlock),
      ]);

    return [
      ...sold.map((e) => ({
        type: "buy",
        text: `Token #${e.args.tokenId} sold for ${ethers.formatEther(e.args.price)} ETH`,
        addr: e.args.buyer,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
      ...listed.map((e) => ({
        type: "list",
        text: `Token #${e.args.tokenId} listed at ${ethers.formatEther(e.args.price)} ETH`,
        addr: e.args.seller,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
      ...accrued.map((e) => ({
        type: "royalty",
        text: `Royalty accrued — ${ethers.formatEther(e.args.amount)} ETH`,
        addr: e.args.receiver,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
      ...withdrawn.map((e) => ({
        type: "withdraw",
        text: `Withdrawal — ${ethers.formatEther(e.args.amount)} ETH`,
        addr: e.args.user,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
      ...cancelled.map((e) => ({
        type: "cancel",
        text: `Listing cancelled for token #${e.args.tokenId}`,
        addr: e.args.seller,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
      ...minted.map((e) => ({
        type: "mint",
        text: `"${e.args.title}" minted as token #${e.args.tokenId}`,
        addr: e.args.collector,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
      ...royaltyUpdated.map((e) => ({
        type: "royaltyUpdate",
        text: `Royalty updated for token #${e.args.tokenId} → ${(Number(e.args.bps) / 100).toFixed(2)}%`,
        addr: e.args.receiver,
        block: e.blockNumber,
        hash: e.transactionHash,
      })),
    ].sort((a, b) => b.block - a.block);
  }, [provider]); // eslint-disable-line react-hooks/exhaustive-deps

  // True only when addresses are non-empty for the current chain
  const contractsConfigured = (() => {
    try { const a = getAddresses(chainId); return !!(a?.MARKETPLACE && a?.NFT); }
    catch { return false; }
  })();

  return {
    loading,
    txHash,
    contractsConfigured,
    // reads
    getArtPiece,
    getRoyaltyInfo,
    getTokenURI,
    getOwnerOf,
    getNFTBalance,
    getNFTOwner,
    isApproved,
    getListing,
    getPendingBalance,
    getSplitterInfo,
    fetchEvents,
    // writes
    mintNFT,
    burnNFT,
    updateRoyalty,
    approveMarketplace,
    listNFT,
    cancelListing,
    buyNFT,
    withdraw,
    releaseSplitter,
  };
}

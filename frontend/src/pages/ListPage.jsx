import { useState, useEffect, useCallback } from "react";
import { toast }    from "../components/Toast";
import { TxStatus } from "../components/TxStatus";
import { fmtEth, bpsToPercent, fmt } from "../utils/format";

const EMOJIS = ["🔮","⚡","🌌","👁️","🎭","🗝️","🧬","🌀","🔺","💎","🏺","🌊","🔥","🌙","🦋"];

export function ListPage({ marketplace, account, chainId, txHash }) {
  const [myTokens, setMyTokens] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [prices,   setPrices]   = useState({});
  const [steps,    setSteps]    = useState({}); // tokenId → "approving"|"listing"|"cancelling"|"burning"

  // Find tokens owned by the connected wallet by scanning Transfer events (ArtMinted)
  const loadMyTokens = useCallback(async () => {
    if (!marketplace || !account || !marketplace.contractsConfigured) return;
    setFetching(true);
    try {
      // Scan tokenIds 0–49; check ownerOf + listing status
      const results = await Promise.all(
        Array.from({ length: 50 }, (_, i) => i).map(async (tokenId) => {
          try {
            const owner = await marketplace.getOwnerOf(tokenId);
            if (owner.toLowerCase() !== account.toLowerCase()) return null;

            // ArtPiece metadata
            let artPiece = { title: `Token #${tokenId}`, royaltyBps: 0, royaltyReceiver: "" };
            try { artPiece = await marketplace.getArtPiece(tokenId); } catch {}

            // Current listing
            let listing = null;
            try {
              const l = await marketplace.getListing(tokenId);
              if (l.price > 0n) listing = l;
            } catch {}

            // Approval status
            let approved = false;
            try { approved = await marketplace.isApproved(tokenId, account); } catch {}

            return {
              tokenId,
              title:           artPiece.title,
              royaltyBps:      artPiece.royaltyBps,
              royaltyReceiver: artPiece.royaltyReceiver,
              listed:          !!listing,
              listingPrice:    listing?.price ?? null,
              approved,
            };
          } catch {
            return null; // token doesn't exist
          }
        })
      );
      setMyTokens(results.filter(Boolean));
    } catch (e) {
      toast.error("Failed to load tokens: " + e.message);
    } finally {
      setFetching(false);
    }
  }, [marketplace, account]);

  useEffect(() => { loadMyTokens(); }, [loadMyTokens]);

  function setStep(tokenId, step) {
    setSteps((p) => ({ ...p, [tokenId]: step }));
  }

  async function handleApproveAndList(tokenId) {
    if (!account) { toast.error("Connect your wallet first"); return; }
    const priceEth = prices[tokenId];
    if (!priceEth || parseFloat(priceEth) <= 0) { toast.error("Enter a valid price"); return; }

    // Only approve if not already approved
    const token = myTokens.find((t) => t.tokenId === tokenId);
    if (!token?.approved) {
      setStep(tokenId, "approving");
      const r = await marketplace.approveMarketplace(tokenId, true);
      if (!r.ok) { toast.error("Approval failed: " + r.error); setStep(tokenId, "idle"); return; }
      toast.info("Approved! Now listing…");
    }

    setStep(tokenId, "listing");
    const r = await marketplace.listNFT(tokenId, priceEth);
    setStep(tokenId, "idle");
    if (r.ok) {
      toast.success(`"${token?.title}" listed at ${priceEth} ETH!`);
      loadMyTokens();
    } else {
      toast.error("Listing failed: " + r.error);
    }
  }

  async function handleCancel(tokenId) {
    setStep(tokenId, "cancelling");
    const r = await marketplace.cancelListing(tokenId);
    setStep(tokenId, "idle");
    if (r.ok) { toast.success("Listing cancelled."); loadMyTokens(); }
    else toast.error(r.error);
  }

  async function handleBurn(tokenId, title) {
    if (!window.confirm(`Burn "${title}" permanently? This cannot be undone.`)) return;
    setStep(tokenId, "burning");
    const r = await marketplace.burnNFT(tokenId);
    setStep(tokenId, "idle");
    if (r.ok) { toast.success(`Token #${tokenId} burned.`); loadMyTokens(); }
    else toast.error(r.error);
  }

  return (
    <div>
      <div className="page-header">
        <h1>My ArtNFTs</h1>
        <p>
          Approve the marketplace, then list your tokens. You can also burn tokens you own.
        </p>
      </div>

      {!account && (
        <div className="callout callout-info" style={{ marginBottom: "1.5rem" }}>
          Connect your wallet to see your tokens.
        </div>
      )}

      <TxStatus hash={txHash} chainId={chainId} />

      <div className="callout callout-muted" style={{ marginBottom: "1.5rem" }}>
        <strong>Listing flow:</strong>&nbsp;
        1.&nbsp;<code>setApprovalForAll(marketplace, true)</code> — one-time approval for all your tokens.&nbsp;
        2.&nbsp;<code>listNFT(nft, tokenId, price)</code> — records your ask on-chain.
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <span style={{ fontSize: "14px", color: "var(--color-muted)" }}>
          {fetching ? "Scanning…" : `${myTokens.length} token${myTokens.length !== 1 ? "s" : ""} found`}
        </span>
        <button className="btn btn-sm" onClick={loadMyTokens} disabled={fetching || !account}>↻ Refresh</button>
      </div>

      {!fetching && myTokens.length === 0 && account && (
        <div className="empty-state">
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>🗂️</div>
          <p>No ArtNFTs found in this wallet.<br />Mint one first, or check you're on the right network.</p>
        </div>
      )}

      <div className="grid-3">
        {myTokens.map((token) => (
          <div className="nft-card" key={token.tokenId}>
            <div className="nft-img">
              <span style={{ fontSize: "48px" }}>{EMOJIS[token.tokenId % EMOJIS.length]}</span>
              {token.listed
                ? <span className="royalty-badge" style={{ background: "rgba(23,143,221,.1)", color: "#185FA5", borderColor: "rgba(23,143,221,.25)" }}>Listed</span>
                : token.approved
                  ? <span className="royalty-badge" style={{ background: "rgba(29,158,117,.1)", color: "#0F6E56", borderColor: "rgba(29,158,117,.25)" }}>Approved</span>
                  : null
              }
            </div>
            <div className="nft-body">
              <div className="nft-name">{token.title}</div>
              <div className="nft-meta">
                #{token.tokenId} · {bpsToPercent(token.royaltyBps)} royalty
              </div>
              {token.royaltyReceiver && (
                <div className="nft-meta">→ {fmt(token.royaltyReceiver)}</div>
              )}
              <div className="divider" />

              {token.listed ? (
                <>
                  <div style={{ fontSize: "13px", marginBottom: "10px" }}>
                    Listed at <strong>{fmtEth(token.listingPrice)}</strong>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleCancel(token.tokenId)}
                    disabled={steps[token.tokenId] === "cancelling"}
                  >
                    {steps[token.tokenId] === "cancelling" ? "Cancelling…" : "Cancel listing"}
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group" style={{ marginBottom: "8px" }}>
                    <label>List price (ETH)</label>
                    <input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.001"
                      value={prices[token.tokenId] ?? ""}
                      onChange={(e) => setPrices((p) => ({ ...p, [token.tokenId]: e.target.value }))}
                    />
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleApproveAndList(token.tokenId)}
                      disabled={!!steps[token.tokenId] && steps[token.tokenId] !== "idle"}
                    >
                      {steps[token.tokenId] === "approving" ? "Approving…"
                        : steps[token.tokenId] === "listing"   ? "Listing…"
                        : token.approved ? "List" : "Approve & list"}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleBurn(token.tokenId, token.title)}
                      disabled={steps[token.tokenId] === "burning"}
                      title="Burn this token permanently"
                    >
                      {steps[token.tokenId] === "burning" ? "Burning…" : "🔥"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

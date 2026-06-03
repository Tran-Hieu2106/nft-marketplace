import { useState, useEffect, useCallback } from "react";
import { fmt, explorerTx } from "../utils/format";
import { toast } from "../components/Toast";

const TYPE_META = {
  buy:          { label: "Sale",            color: "#1D9E75", bg: "#E1F5EE" },
  list:         { label: "Listed",          color: "#178FDD", bg: "#E6F1FB" },
  royalty:      { label: "Royalty",         color: "#7F77DD", bg: "#EEEDFE" },
  withdraw:     { label: "Withdrawal",      color: "#EF9F27", bg: "#FAEEDA" },
  cancel:       { label: "Cancelled",       color: "#E24B4A", bg: "#FCEBEB" },
  mint:         { label: "Minted",          color: "#0F6E56", bg: "#D1FAE5" },
  royaltyUpdate:{ label: "Royalty updated", color: "#6D28D9", bg: "#F5EEFF" },
};

export function ActivityPage({ marketplace, chainId }) {
  const [events,   setEvents]   = useState([]);
  const [fetching, setFetching] = useState(false);
  const [filter,   setFilter]   = useState("all");

  const loadEvents = useCallback(async () => {
    if (!marketplace || !marketplace.contractsConfigured) return;
    setFetching(true);
    try {
      setEvents(await marketplace.fetchEvents(10000));
    } catch (e) {
      toast.error("Failed to fetch events: " + e.message);
    } finally {
      setFetching(false);
    }
  }, [marketplace]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const filtered = filter === "all" ? events : events.filter((e) => e.type === filter);

  return (
    <div>
      <div className="page-header">
        <h1>Activity feed</h1>
        <p>
          On-chain events from ArtNFT + Marketplace:&nbsp;
          <code>ArtMinted</code> · <code>NFTListed</code> · <code>NFTSold</code> ·&nbsp;
          <code>RoyaltyAccrued</code> · <code>Withdrawal</code> · <code>RoyaltyUpdated</code>
        </p>
      </div>

      {/* ── Filter tabs ── */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
        {["all", ...Object.keys(TYPE_META)].map((f) => (
          <button
            key={f}
            className={`tab-btn${filter === f ? " active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : TYPE_META[f]?.label ?? f}
          </button>
        ))}
        <button className="btn btn-sm" onClick={loadEvents} disabled={fetching} style={{ marginLeft: "auto" }}>
          {fetching ? "Loading…" : "↻ Refresh"}
        </button>
      </div>

      {!fetching && filtered.length === 0 && (
        <div className="empty-state">
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>📭</div>
          <p>
            {events.length === 0
              ? "No events found in the last 10,000 blocks."
              : "No events match this filter."}
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {filtered.map((e, i) => {
          const meta = TYPE_META[e.type] ?? { label: e.type, color: "#888", bg: "#f0f0f0" };
          const url  = explorerTx(chainId, e.hash);
          return (
            <div key={i} className="event-item">
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
              <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "20px", background: meta.bg, color: meta.color, flexShrink: 0, fontWeight: 500 }}>
                {meta.label}
              </span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "13px" }}>{e.text}</div>
                <div style={{ fontFamily: "monospace", fontSize: "11px", color: "var(--color-muted)", marginTop: "1px" }}>
                  {fmt(e.addr)}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px", flexShrink: 0 }}>
                <span style={{ fontSize: "11px", color: "var(--color-muted)" }}>block #{e.block}</span>
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: "11px", color: "#178FDD" }}>tx ↗</a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

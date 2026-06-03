import { explorerTx } from "../utils/format";

export function TxStatus({ hash, chainId }) {
  if (!hash) return null;
  const url = explorerTx(chainId, hash);

  return (
    <div className="tx-status">
      <div className="spinner" />
      <div>
        <div style={{ fontWeight: 500, fontSize: "13px" }}>Transaction pending…</div>
        <div style={{ fontSize: "12px", color: "var(--color-muted)", marginTop: "2px", fontFamily: "monospace" }}>
          {hash.slice(0, 18)}…
        </div>
      </div>
      {url && (
        <a href={url} target="_blank" rel="noreferrer" className="btn btn-sm" style={{ marginLeft: "auto" }}>
          View ↗
        </a>
      )}
    </div>
  );
}

import { fmt } from "../utils/format";
import { getAddresses } from "../abis/addresses";

const PAGES = [
  { id: "marketplace", label: "Marketplace" },
  { id: "mint",        label: "Mint NFT" },
  { id: "list",        label: "My NFTs" },
  { id: "royalties",   label: "Royalties" },
  { id: "activity",    label: "Activity" },
];

export function Topbar({ page, setPage, account, chainId, connecting, onConnect }) {
  const addrs = chainId ? getAddresses(chainId) : null;
  const networkOk = !!addrs;

  return (
    <header className="topbar">
      <div className="logo">
        <span className="logo-icon">◈</span>
        FractionalNFT Market
      </div>

      <nav className="nav">
        {PAGES.map((p) => (
          <button
            key={p.id}
            className={`nav-btn${page === p.id ? " active" : ""}`}
            onClick={() => setPage(p.id)}
          >
            {p.label}
          </button>
        ))}
      </nav>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        {account && !networkOk && (
          <span className="chip chip-danger">Wrong network</span>
        )}
        {account && networkOk && (
          <span className="chip chip-success">
            {chainId === 31337 ? "Hardhat" : chainId === 11155111 ? "Sepolia" : `Chain ${chainId}`}
          </span>
        )}
        <button
          className={`wallet-btn${account ? " connected" : ""}`}
          onClick={onConnect}
          disabled={connecting}
        >
          <span className="wallet-dot" />
          {connecting ? "Connecting…" : account ? fmt(account) : "Connect wallet"}
        </button>
      </div>
    </header>
  );
}

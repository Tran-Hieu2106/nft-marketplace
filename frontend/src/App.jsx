import { useState } from "react";
import "./index.css";

import { useWallet }      from "./hooks/useWallet";
import { useMarketplace } from "./hooks/useMarketplace";

import { Topbar }         from "./components/Topbar";
import { ToastContainer, toast } from "./components/Toast";

import { MarketplacePage } from "./pages/MarketplacePage";
import { MintPage }        from "./pages/MintPage";
import { ListPage }        from "./pages/ListPage";
import { RoyaltiesPage }   from "./pages/RoyaltiesPage";
import { ActivityPage }    from "./pages/ActivityPage";

export default function App() {
  const [page, setPage] = useState("marketplace");

  // ── Wallet ────────────────────────────────────────────────────────
  const { provider, signer, account, chainId, connecting, error: walletError, connect } = useWallet();

  // Show wallet errors as toasts
  if (walletError) toast.error(walletError);

  // ── Contract interactions ─────────────────────────────────────────
  const marketplace = useMarketplace({ signer, provider, chainId, account });

  // ── Shared props ──────────────────────────────────────────────────
  const sharedProps = { marketplace, account, chainId, txHash: marketplace.txHash };

  return (
    <div className="app">
      <Topbar
        page={page}
        setPage={setPage}
        account={account}
        chainId={chainId}
        connecting={connecting}
        onConnect={connect}
      />

      <main className="content">
        {/* Show a clear banner when contract addresses are not filled in yet */}
        {account && !marketplace.contractsConfigured && (
          <div style={{
            marginBottom: "1.5rem",
            padding: "12px 16px",
            background: "#FEF3C7",
            border: "1px solid #F59E0B",
            borderLeft: "4px solid #F59E0B",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#92400E",
            lineHeight: 1.7,
          }}>
            <strong>⚠️ Contract addresses not configured for chain {chainId}.</strong><br />
            Open <code>src/abis/addresses.js</code> and paste your deployed{" "}
            <code>MARKETPLACE</code> and <code>NFT</code> addresses for this network.
            The app will work once those are filled in.
          </div>
        )}
        {page === "marketplace" && <MarketplacePage {...sharedProps} />}
        {page === "mint"        && <MintPage        {...sharedProps} />}
        {page === "list"        && <ListPage        {...sharedProps} />}
        {page === "royalties"   && <RoyaltiesPage   {...sharedProps} />}
        {page === "activity"    && <ActivityPage    marketplace={marketplace} chainId={chainId} />}
      </main>

      <ToastContainer />
    </div>
  );
}

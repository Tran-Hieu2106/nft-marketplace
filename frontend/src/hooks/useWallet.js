import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [provider, setProvider]   = useState(null);
  const [signer, setSigner]       = useState(null);
  const [account, setAccount]     = useState(null);
  const [chainId, setChainId]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]         = useState(null);

  // Re-hydrate provider on page load if already authorized
  useEffect(() => {
    if (!window.ethereum) return;
    const p = new ethers.BrowserProvider(window.ethereum);

    // Check if already connected (no prompt)
    p.listAccounts().then((accounts) => {
      if (accounts.length > 0) {
        _init(p, accounts[0].address);
      }
    }).catch(() => {});

    // Listen for account / chain changes
    window.ethereum.on("accountsChanged", (accounts) => {
      if (accounts.length === 0) {
        setAccount(null); setSigner(null);
      } else {
        _init(p, accounts[0]);
      }
    });

    window.ethereum.on("chainChanged", () => {
      window.location.reload();
    });

    return () => {
      window.ethereum?.removeAllListeners?.("accountsChanged");
      window.ethereum?.removeAllListeners?.("chainChanged");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function _init(p, addr) {
    try {
      const s = await p.getSigner();
      const network = await p.getNetwork();
      setProvider(p);
      setSigner(s);
      setAccount(addr.toLowerCase ? addr : addr.toLowerCase());
      setChainId(Number(network.chainId));
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not installed. Please install it from metamask.io");
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const p = new ethers.BrowserProvider(window.ethereum);
      const accounts = await p.send("eth_requestAccounts", []);
      await _init(p, accounts[0]);
    } catch (e) {
      setError(e.code === 4001 ? "Connection rejected by user" : e.message);
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
  }, []);

  return { provider, signer, account, chainId, connecting, error, connect, disconnect };
}

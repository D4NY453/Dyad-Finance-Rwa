import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

export function useWallet() {
  const [provider, setProvider]   = useState(null);
  const [signer, setSigner]       = useState(null);
  const [account, setAccount]     = useState("");
  const [chainId, setChainId]     = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError]         = useState("");

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask no encontrado. Instálalo en chrome://extensions/");
      return;
    }
    try {
      setConnecting(true);
      setError("");
      const web3Provider = new ethers.BrowserProvider(window.ethereum);
      await web3Provider.send("eth_requestAccounts", []);
      const web3Signer = await web3Provider.getSigner();
      const addr       = await web3Signer.getAddress();
      const network    = await web3Provider.getNetwork();

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(addr);
      setChainId(Number(network.chainId));
    } catch (err) {
      setError(err.message || "Error al conectar");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount("");
    setChainId(null);
  }, []);

  // Escuchar cambios de cuenta / red
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
        if (provider) {
          const s = await provider.getSigner();
          setSigner(s);
        }
      }
    };

    const handleChainChanged = (chainIdHex) => {
      setChainId(parseInt(chainIdHex, 16));
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged",    handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged",    handleChainChanged);
    };
  }, [provider, disconnect]);

  const shortAddress = account
    ? `${account.slice(0, 6)}...${account.slice(-4)}`
    : "";

  return { provider, signer, account, chainId, connecting, error, connect, disconnect, shortAddress };
}

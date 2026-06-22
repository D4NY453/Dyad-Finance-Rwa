import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

// ==========================================
// 🛠 CONFIGURACIÓN DE CONTRATOS
// ==========================================
const VAULT_CONTRACT_ADDRESS = "0xA8E543E96E1e2AC0F95641a3F9b2418e7a5b1376"; 

const VAULT_ABI = [
  "function deposit() external payable",
  "function redeemStable(uint256 _stableAmount) external",
  "function redeemVolatile(uint256 _volatileAmount) external",
  "function stableToken() external view returns (address)",
  "function volatileToken() external view returns (address)"
];

const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)"
];

const SEPOLIA_CHAIN_ID = 11155111n;

export default function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState("");
  
  const [balances, setBalances] = useState({ eth: "0.0000", stable: "0.00", volatile: "0.0000" });
  const [loading, setLoading] = useState({ deposit: false, redeemStable: false, redeemVolatile: false });
  const [inputs, setInputs] = useState({ deposit: "", redeemStable: "", redeemVolatile: "" });
  const [notification, setNotification] = useState({ show: false, message: "", type: "", title: "" });

  // Notificaciones Temporales
  const showNotification = (title, message, type) => {
    setNotification({ show: true, title, message, type });
    setTimeout(() => setNotification({ show: false, message: "", type: "", title: "" }), 5000);
  };

  // Conectar Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const web3Provider = new ethers.BrowserProvider(window.ethereum);
        const network = await web3Provider.getNetwork();
        
        if (network.chainId !== SEPOLIA_CHAIN_ID) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }], // Hexadecimal for 11155111
            });
            showNotification("RETE WORK SWITCH", "Red cambiada a Sepolia. Haz clic en Conectar de nuevo.", "info");
            return;
          } catch (switchError) {
            showNotification("NETWORK ERROR", "Por favor, cambia a la red Sepolia en MetaMask manualmente.", "error");
            return;
          }
        }
        
        const web3Signer = await web3Provider.getSigner();
        const address = await web3Signer.getAddress();
        
        setProvider(web3Provider);
        setSigner(web3Signer);
        setAccount(address);
        showNotification("SYSTEM READY", "Wallet conectada exitosamente", "success");
      } catch (error) {
        console.error(error);
        showNotification("CONNECTION FAILED", "Error al conectar wallet", "error");
      }
    } else {
      showNotification("MISSING MODULE", "MetaMask no está instalado", "error");
    }
  };

  // Cargar Saldos
  const loadBalances = async () => {
    if (!signer || !account || VAULT_CONTRACT_ADDRESS === "PEGAR_AQUI_DIRECCION") return;
    
    try {
      const vaultContract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer);
      
      const stableAddress = await vaultContract.stableToken();
      const volatileAddress = await vaultContract.volatileToken();

      const stableContract = new ethers.Contract(stableAddress, ERC20_ABI, signer);
      const volatileContract = new ethers.Contract(volatileAddress, ERC20_ABI, signer);

      const ethBal = await provider.getBalance(account);
      const stableBal = await stableContract.balanceOf(account);
      const volatileBal = await volatileContract.balanceOf(account);

      setBalances({
        eth: parseFloat(ethers.formatEther(ethBal)).toFixed(4),
        stable: parseFloat(ethers.formatUnits(stableBal, 18)).toFixed(2),
        volatile: parseFloat(ethers.formatUnits(volatileBal, 18)).toFixed(4)
      });
    } catch (error) {
      console.error("Error cargando saldos:", error);
    }
  };

  useEffect(() => {
    loadBalances();
  }, [account, signer]);

  // Interacciones con el Contrato
  const handleTransaction = async (type, actionName) => {
    if (!inputs[type] || isNaN(inputs[type]) || Number(inputs[type]) <= 0) return;
    if (VAULT_CONTRACT_ADDRESS === "PEGAR_AQUI_DIRECCION") {
      showNotification("SYSTEM ERROR", "Debes configurar la dirección del contrato primero.", "error");
      return;
    }

    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const vaultContract = new ethers.Contract(VAULT_CONTRACT_ADDRESS, VAULT_ABI, signer);
      let tx;

      if (type === 'deposit') {
        tx = await vaultContract.deposit({ value: ethers.parseEther(inputs.deposit) });
      } else if (type === 'redeemStable') {
        tx = await vaultContract.redeemStable(ethers.parseUnits(inputs.redeemStable, 18));
      } else if (type === 'redeemVolatile') {
        tx = await vaultContract.redeemVolatile(ethers.parseUnits(inputs.redeemVolatile, 18));
      }

      showNotification("ACTION COMMENCED", "Transacción enviada. Esperando confirmación...", "info");
      await tx.wait();
      showNotification("ACTION SUCCESS", "¡Transacción confirmada en la blockchain!", "success");
      
      setInputs(prev => ({ ...prev, [type]: "" }));
      loadBalances();
    } catch (error) {
      console.error(error);
      showNotification("ACTION FAILED", "Transacción fallida o rechazada.", "error");
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const truncateAddress = (addr) => `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${x}%`);
      document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bg-background text-on-background font-body-md selection:bg-primary/30 min-h-screen overflow-x-hidden">
      
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 bg-surface/60 backdrop-blur-xl border-b border-white/10 shadow-[0_0_15px_rgba(47,217,244,0.1)]">
        <div className="max-w-[1280px] mx-auto h-16 flex justify-between items-center px-4 md:px-8">
          <div className="flex items-center gap-4">
            <span className="font-headline-lg text-headline-lg font-bold text-primary tracking-tighter">LUNAR VAULT</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden lg:flex items-center px-2 py-1 border border-white/10 rounded bg-white/5">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse mr-2"></div>
              <span className="font-label-caps text-[10px] text-primary">Sepolia</span>
            </div>
            <button 
              onClick={connectWallet}
              className="bg-primary text-[#00363e] px-4 py-2 font-label-caps text-label-caps rounded-lg hover:brightness-110 active:scale-95 transition-all duration-200 ease-in-out-expo shadow-[0_0_10px_rgba(138,235,255,0.3)]"
            >
              {account ? truncateAddress(account) : "Connect Wallet"}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-24 pb-32 max-w-[1280px] mx-auto px-4">
        
        {/* Operational Hub */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8 border-l-2 border-primary pl-4">
            <div>
              <h2 className="font-label-caps text-label-caps text-primary/70 uppercase tracking-widest">System Overview</h2>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Operational Hub</h1>
            </div>
            <div className="hidden md:block text-right">
              <p className="font-data-sm text-data-sm text-on-surface-variant">SYNC STATUS: NOMINAL</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* ETH Balance Card */}
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
              <span className="font-label-caps text-label-caps text-on-surface-variant">ETHEREUM RESERVE</span>
              <div className="flex flex-col">
                <span className="font-data-lg text-[32px] text-primary data-glow">{balances.eth} ETH</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-2/3 shadow-[0_0_8px_rgba(138,235,255,0.5)]"></div>
              </div>
            </div>

            {/* usdJ Balance Card */}
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
              <span className="font-label-caps text-label-caps text-on-surface-variant">STABLE usdJ</span>
              <div className="flex flex-col">
                <span className="font-data-lg text-[32px] text-tertiary data-glow">{balances.stable} usdJ</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-tertiary w-full shadow-[0_0_8px_rgba(97,246,185,0.5)]"></div>
              </div>
            </div>

            {/* vETH Balance Card */}
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-4 relative overflow-hidden group">
              <span className="font-label-caps text-label-caps text-on-surface-variant">VOLATILE vETH</span>
              <div className="flex flex-col">
                <span className="font-data-lg text-[32px] text-secondary data-glow">{balances.volatile} vETH</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-secondary w-1/3 shadow-[0_0_8px_rgba(192,193,255,0.5)]"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Controls */}
        <section>
          <div className="flex items-center gap-4 mb-8">
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Mission Controls</h2>
            <div className="h-[1px] flex-grow bg-gradient-to-r from-white/20 to-transparent"></div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Orbital Deposit */}
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-8 border-primary/20 hover:border-primary/50 transition-colors duration-500">
              <div className="flex items-center gap-2">
                <h3 className="font-label-caps text-label-caps text-primary">ORBITAL DEPOSIT</h3>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant">INPUT ETH AMOUNT</label>
                <div className="relative">
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-data-lg font-data-lg focus:border-primary focus:ring-0 outline-none transition-all duration-300" 
                    placeholder="0.00" 
                    type="number"
                    value={inputs.deposit}
                    onChange={(e) => setInputs({...inputs, deposit: e.target.value})}
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-primary hover:text-white transition-colors" onClick={() => setInputs({...inputs, deposit: balances.eth})}>MAX</button>
                </div>
              </div>
              <button 
                onClick={() => handleTransaction('deposit')}
                disabled={loading.deposit || !account}
                className="w-full bg-primary text-[#00363e] font-label-caps text-label-caps py-4 rounded-lg hover:shadow-[0_0_20px_rgba(138,235,255,0.4)] active:scale-95 transition-all duration-300 ease-in-out-expo uppercase tracking-widest disabled:opacity-50"
              >
                {loading.deposit ? "Processing..." : "Initialize Deposit"}
              </button>
            </div>

            {/* Stable Extraction */}
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-8 border-tertiary/20 hover:border-tertiary/50 transition-colors duration-500">
              <div className="flex items-center gap-2">
                <h3 className="font-label-caps text-label-caps text-tertiary">STABLE EXTRACTION</h3>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant">INPUT usdJ AMOUNT</label>
                <div className="relative">
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-data-lg font-data-lg focus:border-tertiary focus:ring-0 outline-none transition-all duration-300" 
                    placeholder="0.00" 
                    type="number"
                    value={inputs.redeemStable}
                    onChange={(e) => setInputs({...inputs, redeemStable: e.target.value})}
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-tertiary hover:text-white transition-colors" onClick={() => setInputs({...inputs, redeemStable: balances.stable})}>MAX</button>
                </div>
              </div>
              <button 
                onClick={() => handleTransaction('redeemStable')}
                disabled={loading.redeemStable || !account}
                className="w-full bg-tertiary text-[#003825] font-label-caps text-label-caps py-4 rounded-lg hover:shadow-[0_0_20px_rgba(97,246,185,0.4)] active:scale-95 transition-all duration-300 ease-in-out-expo uppercase tracking-widest disabled:opacity-50"
              >
                {loading.redeemStable ? "Processing..." : "Secure Redemption"}
              </button>
            </div>

            {/* Volatile Surge */}
            <div className="glass-panel p-8 rounded-xl flex flex-col gap-8 border-secondary/20 hover:border-secondary/50 transition-colors duration-500">
              <div className="flex items-center gap-2">
                <h3 className="font-label-caps text-label-caps text-secondary">VOLATILE SURGE</h3>
              </div>
              <div className="space-y-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant">INPUT vETH AMOUNT</label>
                <div className="relative">
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-lg p-4 text-data-lg font-data-lg focus:border-secondary focus:ring-0 outline-none transition-all duration-300" 
                    placeholder="0.00" 
                    type="number"
                    value={inputs.redeemVolatile}
                    onChange={(e) => setInputs({...inputs, redeemVolatile: e.target.value})}
                  />
                  <button className="absolute right-4 top-1/2 -translate-y-1/2 font-label-caps text-secondary hover:text-white transition-colors" onClick={() => setInputs({...inputs, redeemVolatile: balances.volatile})}>MAX</button>
                </div>
              </div>
              <button 
                onClick={() => handleTransaction('redeemVolatile')}
                disabled={loading.redeemVolatile || !account}
                className="w-full bg-secondary text-[#1000a9] font-label-caps text-label-caps py-4 rounded-lg hover:shadow-[0_0_20px_rgba(192,193,255,0.4)] active:scale-95 transition-all duration-300 ease-in-out-expo uppercase tracking-widest disabled:opacity-50"
              >
                {loading.redeemVolatile ? "Processing..." : "Execute Leverage"}
              </button>
            </div>

          </div>
        </section>

      </main>

      {/* Notification HUD */}
      {notification.show && (
        <div className="fixed bottom-8 right-8 z-[60] flex flex-col gap-2 pointer-events-none" id="notification-hud">
          <div className={`glass-panel p-4 rounded-lg flex items-start gap-4 min-w-[320px] pointer-events-auto transform translate-y-0 opacity-100 transition-all duration-500 animate-in fade-in slide-in-from-right-10 ${notification.type === 'error' ? 'border-rose-500/40' : notification.type === 'success' ? 'border-tertiary/40' : 'border-primary/40'}`}>
            <div className={`p-1 rounded ${notification.type === 'error' ? 'bg-rose-500/20' : notification.type === 'success' ? 'bg-tertiary/20' : 'bg-primary/20'}`}>
              <div className={`w-4 h-4 ${notification.type === 'error' ? 'bg-rose-500' : notification.type === 'success' ? 'bg-tertiary' : 'bg-primary'} rounded-full animate-pulse`}></div>
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <span className={`font-label-caps text-[10px] ${notification.type === 'error' ? 'text-rose-500' : notification.type === 'success' ? 'text-tertiary' : 'text-primary'}`}>
                  {notification.title}
                </span>
                <span className="font-data-sm text-[9px] text-on-surface-variant opacity-50">NOW</span>
              </div>
              <p className="text-body-md text-sm text-on-surface leading-snug">{notification.message}</p>
            </div>
            <button className="text-on-surface-variant hover:text-white" onClick={() => setNotification({show: false})}>
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Side Image Decor (Bento-like background accent) */}
      <div className="fixed bottom-0 left-0 w-64 h-64 opacity-10 pointer-events-none">
        <img className="w-full h-full object-cover grayscale brightness-200" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCpWgTUGU-dmdukGuDqkHDj0xCu4CVJvZGJKDpuu4P49T5JYml64lE-l6tA33YCRzVcF2Jy-4aXh2gsFjJbdRF18uSsz_JwgCTkST2TeARnDWolXDE9NMAgS-pBwzN82CBZwPUldAsHRcB5tB4c3WLf9TmoHu_suT2NiGtYYEElhYFlVuvXCi28zlswV-Nw9jPXRrfiZzgrAMVeVVSsv-WO31F1pSXyHLMTQsMl8Ja0k0zMWoiZQy2C5Q" />
      </div>
    </div>
  );
}

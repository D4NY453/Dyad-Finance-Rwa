import { motion } from "framer-motion"
import { Wallet, Coins, ArrowRightLeft, TrendingUp } from "lucide-react"
import { ethers } from "ethers"

const USDC_ADDRESS = "0x32c994115a670C9b98e0f889337805038C6cFc4A";
const MOCK_DEX_ADDRESS = "0xd8C425C6a5D1eCd6Fa6bD60eebC074964312edE1";
const USDC_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)"
];
const MOCK_DEX_ABI = [
  "function swapUsdcForEth(uint256 amountUsdc) external"
];

type Balances = {
  eth: string
  stable: string
  volatile: string
  volatileEthValue?: string
  usdc?: string
  link?: string
}

export function PortfolioPanel({ balances }: { balances: Balances }) {
  const assets = [
    { symbol: "ETH", name: "Ethereum", balance: balances.eth, icon: Coins, color: "text-zinc-100", bg: "bg-zinc-800" },
    { symbol: "usdJ", name: "Dyad Stable", balance: balances.stable, icon: Wallet, color: "text-vault-stable", bg: "bg-vault-stable/10" },
    { symbol: "jETH", name: "Dyad Volatile", balance: balances.volatile, icon: TrendingUp, color: "text-vault-indigo", bg: "bg-vault-indigo/10" },
    { symbol: "mUSDC", name: "Mock USDC", balance: balances.usdc || "0.00", icon: ArrowRightLeft, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { symbol: "LINK", name: "Chainlink", balance: balances.link || "0.00", icon: Coins, color: "text-blue-400", bg: "bg-blue-400/10" }
  ];

  const handleSwapToEth = async () => {
    if (!(window as any).ethereum) return alert("MetaMask no detectado.");
    if (parseFloat(balances.usdc || "0") < 25000) return alert("No tienes suficientes USDC para cambiar.");
    
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      
      const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, signer);
      const dexContract = new ethers.Contract(MOCK_DEX_ADDRESS, MOCK_DEX_ABI, signer);
      
      const amountToSwap = ethers.parseUnits("25000", 18);
      
      alert("Paso 1: MetaMask pedirá permiso para que el DEX use tus USDC (Aprobar).");
      const txApprove = await usdcContract.approve(MOCK_DEX_ADDRESS, amountToSwap);
      await txApprove.wait();
      
      alert("Paso 2: Permiso otorgado. Ahora MetaMask pedirá confirmar el intercambio de USDC a ETH.");
      const txSwap = await dexContract.swapUsdcForEth(amountToSwap);
      await txSwap.wait();
      
      alert("¡Retiro final exitoso! Tus USDC se convirtieron en ETH real de Sepolia. Espera unos segundos para ver tu nuevo saldo.");
    } catch (error) {
      console.error(error);
      alert("Fallo el intercambio. Asegúrate de que el DEX tenga liquidez de ETH.");
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
        <div className="p-3 bg-white/5 rounded-xl border border-white/10">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Tu Portafolio</h2>
          <p className="text-sm text-muted-foreground">Saldos en tiempo real en la red Sepolia</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {assets.map((asset, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={asset.symbol} 
            className="flex items-center justify-between p-5 rounded-2xl border border-white/5 bg-card/40 backdrop-blur-sm hover:border-white/10 transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${asset.bg}`}>
                <asset.icon className={`h-6 w-6 ${asset.color}`} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg">{asset.name}</span>
                <span className="text-xs text-muted-foreground uppercase tracking-widest">{asset.symbol}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-mono text-xl font-medium">{asset.balance}</span>
              
              {/* Mostrar el valor subyacente en ETH para el token volátil */}
              {asset.symbol === "jETH" && balances.volatileEthValue && (
                <div className="flex flex-col items-end">
                  <span className="text-xs text-vault-indigo font-medium">
                    Valor: {balances.volatileEthValue} ETH
                  </span>
                  {parseFloat(balances.volatileEthValue) > parseFloat(asset.balance) && (
                    <span className="text-[0.65rem] text-emerald-400">
                      (+{((parseFloat(balances.volatileEthValue) / parseFloat(asset.balance) - 1) * 100).toFixed(2)}%)
                    </span>
                  )}
                  {parseFloat(balances.volatileEthValue) < parseFloat(asset.balance) && parseFloat(asset.balance) > 0 && (
                    <span className="text-[0.65rem] text-red-400">
                      ({((parseFloat(balances.volatileEthValue) / parseFloat(asset.balance) - 1) * 100).toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}

              {asset.symbol === "mUSDC" && parseFloat(asset.balance) > 0 && (
                <button onClick={handleSwapToEth} className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full hover:bg-emerald-500/30 transition-colors border border-emerald-500/30">
                  Convertir a ETH
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

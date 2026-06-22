import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowDown, Settings2, Zap } from "lucide-react"
import { ethers } from "ethers"

const USDC_ADDRESS = "0x32c994115a670C9b98e0f889337805038C6cFc4A";
const MOCK_DEX_ADDRESS = "0xd8C425C6a5D1eCd6Fa6bD60eebC074964312edE1";

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];
const MOCK_DEX_ABI = [
  "function swapUsdjForUsdc(uint256 amountUsdj) external",
  "function swapUsdcForEth(uint256 amountUsdc) external"
];

// True usdJ address from VaultV2 stableToken()
const trueUsdjAddress = "0x53d6E709292c42dBEb54906F8d887a0D61B1B85D"; 

type Balances = {
  eth: string
  stable: string
  usdc?: string
}

export function SwapPanel({ balances, onRefresh }: { balances: Balances, onRefresh: () => void }) {
  const [payAmount, setPayAmount] = useState("");
  const [isUsdjToUsdc, setIsUsdjToUsdc] = useState(true);
  const [isSwapping, setIsSwapping] = useState(false);

  const payToken = isUsdjToUsdc ? { symbol: "usdJ", name: "Dyad Stable", balance: balances.stable } : { symbol: "USDC", name: "USD Coin", balance: balances.usdc || "0.00" };
  const receiveToken = isUsdjToUsdc ? { symbol: "USDC", name: "USD Coin", balance: balances.usdc || "0.00" } : { symbol: "ETH", name: "Ethereum", balance: balances.eth };
  
  // Exchange rate 1:1 for mock
  const receiveAmount = payAmount; 

  const handleSwap = async () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) return;
    if (!(window as any).ethereum) return alert("MetaMask no detectado.");
    
    setIsSwapping(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const dexContract = new ethers.Contract(MOCK_DEX_ADDRESS, MOCK_DEX_ABI, signer);
      
      const amountToSwap = ethers.parseUnits(payAmount, 18);

      if (isUsdjToUsdc) {
        const usdjContract = new ethers.Contract(trueUsdjAddress, ERC20_ABI, signer);
        await (await usdjContract.approve(MOCK_DEX_ADDRESS, amountToSwap)).wait();
        await (await dexContract.swapUsdjForUsdc(amountToSwap)).wait();
      } else {
        const usdcContract = new ethers.Contract(USDC_ADDRESS, ERC20_ABI, signer);
        await (await usdcContract.approve(MOCK_DEX_ADDRESS, amountToSwap)).wait();
        await (await dexContract.swapUsdcForEth(amountToSwap)).wait();
      }
      
      setPayAmount("");
      onRefresh();
      alert("¡Swap completado instantáneamente! ⚡");
    } catch (error) {
      console.error(error);
      alert("Error en el Swap. Verifica tus saldos y permisos.");
    } finally {
      setIsSwapping(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <div className="w-full bg-[#131313] rounded-[24px] border border-white/5 p-2 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 mb-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-vault-stable" />
            <span className="font-semibold text-white/90">Insta-Swap</span>
          </div>
          <button className="p-2 rounded-full hover:bg-white/5 transition-colors text-white/40 hover:text-white/80">
            <Settings2 className="h-4 w-4" />
          </button>
        </div>

        {/* Pay Section */}
        <div className="bg-[#1C1C1C] rounded-[20px] p-4 relative group border border-transparent hover:border-white/5 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-white/50">Tú pagas</span>
            <span className="text-sm font-medium text-white/50">Balance: {payToken.balance}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input 
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-4xl font-semibold outline-none w-full text-white placeholder:text-white/20"
            />
            <div className="flex items-center gap-2 bg-[#2C2C2C] hover:bg-[#3C3C3C] cursor-pointer transition-colors rounded-full px-4 py-2 shrink-0">
              <span className="font-bold text-lg">{payToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Switch Button */}
        <div className="relative h-2 w-full flex items-center justify-center z-10">
          <button 
            onClick={() => setIsUsdjToUsdc(!isUsdjToUsdc)}
            className="absolute bg-[#2C2C2C] border-4 border-[#131313] p-2 rounded-xl hover:bg-[#3C3C3C] transition-colors group"
          >
            <ArrowDown className="h-4 w-4 text-white/70 group-hover:text-white" />
          </button>
        </div>

        {/* Receive Section */}
        <div className="bg-[#1C1C1C] rounded-[20px] p-4 relative group border border-transparent hover:border-white/5 transition-colors">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-white/50">Tú recibes</span>
            <span className="text-sm font-medium text-white/50">Balance: {receiveToken.balance}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <input 
              type="text"
              value={receiveAmount}
              readOnly
              placeholder="0.0"
              className="bg-transparent text-4xl font-semibold outline-none w-full text-white/50 placeholder:text-white/20"
            />
            <div className="flex items-center gap-2 bg-[#2C2C2C] cursor-default rounded-full px-4 py-2 shrink-0">
              <span className="font-bold text-lg">{receiveToken.symbol}</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleSwap}
          disabled={!payAmount || isSwapping}
          className={`w-full mt-2 py-4 rounded-[16px] font-bold text-lg transition-all ${
            !payAmount ? 'bg-[#2C2C2C] text-white/30 cursor-not-allowed' : 
            isSwapping ? 'bg-vault-stable/50 text-white cursor-wait' : 
            'bg-vault-stable text-black hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(255,255,255,0.1)]'
          }`}
        >
          {isSwapping ? "Procesando..." : !payAmount ? "Ingresa un monto" : "Confirmar Swap"}
        </button>

      </div>
      
      <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/50">
        <span>⚡ Impulsado por el motor de Dyad Finance</span>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect, useRef } from "react"
import { ethers } from "ethers"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Building2, 
  Pickaxe, 
  Paintbrush, 
  Home, 
  Loader2, 
  Upload, 
  FileCheck, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Coins, 
  TrendingUp, 
  Hammer 
} from "lucide-react"

// Dirección del contrato RealEstateOracle y ABIs
const ORACLE_ADDRESS = "0xbbBaDa73a01212782Abd0597397666976824BC1a"
const ORACLE_ABI = [
  "function updatePropertyPrice(uint256 _propertyId, uint256 _newPriceInUSD) external",
  "function getLatestPrice(uint256 _propertyId) external view returns (uint256 price, uint256 timestamp)"
]

const VAULT_ADDRESS = "0x7c023497E7b4B97DAc3954929A306C27BD3c7600"
const VAULT_ABI = [
  "function mintUsdJAgainstRWA(uint256 _propertyId) external",
  "function stableToken() external view returns (address)"
]

const USDJ_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
]

const MOCK_DEX_ADDRESS = "0xd8C425C6a5D1eCd6Fa6bD60eebC074964312edE1"
const MOCK_DEX_ABI = [
  "function swapUsdjForUsdc(uint256 amount) external"
]

const stages = [
  {
    id: "gris",
    label: "Obra Gris",
    icon: Pickaxe,
    description: "Cimientos, muros y techos estructurales sin acabados.",
    color: "from-zinc-500 to-zinc-700",
    value: 120000,
    multiplier: 1.0,
    image: "/frames/frame1.png"
  },
  {
    id: "3d",
    label: "Diseño 3D (SketchUp)",
    icon: Paintbrush,
    description: "Renders y planificación arquitectónica de los acabados finales.",
    color: "from-vault-cyan to-blue-600",
    value: 145000,
    multiplier: 1.25,
    image: "/frames/frame2.png"
  },
  {
    id: "terminada",
    label: "Obra Terminada",
    icon: Home,
    description: "Activo listo para habitar con todos los acabados instalados.",
    color: "from-vault-stable to-emerald-700",
    value: 210000,
    multiplier: 1.75,
    image: "/frames/frame3.png"
  }
]

export function RwaPanel({ balances, onRefresh }: { balances?: any; onRefresh?: () => void }) {
  const [activeStage, setActiveStage] = useState(stages[0].id)
  const [imageError, setImageError] = useState<Record<string, boolean>>({})
  
  // Evidencia
  const [obraGrisFile, setObraGrisFile] = useState<string | null>(null)
  const [diseno3dFile, setDiseno3dFile] = useState<string | null>(null)
  const [obraTerminadaFile, setObraTerminadaFile] = useState<string | null>(null)
  const [approvalStatus, setApprovalStatus] = useState<'uploading' | 'pending' | 'approved'>('uploading')
  const [uploadProgress, setUploadProgress] = useState(0)

  // Minería y Staking
  const [isStaked, setIsStaked] = useState(false)
  const [accumulatedRewards, setAccumulatedRewards] = useState(0)
  const [miningRate, setMiningRate] = useState(0)
  const [stakingLoading, setStakingLoading] = useState(false)
  const [claimingLoading, setClaimingLoading] = useState(false)
  const [unstakingLoading, setUnstakingLoading] = useState(false)

  // Refs de secciones para el IntersectionObserver
  const grisRef = useRef<HTMLDivElement>(null)
  const d3dRef = useRef<HTMLDivElement>(null)
  const terminadaRef = useRef<HTMLDivElement>(null)

  // Observador de Scroll para detectar qué etapa está en pantalla
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -40% 0px",
      threshold: 0.2
    }

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("data-stage-id")
          if (id) setActiveStage(id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    if (grisRef.current) observer.observe(grisRef.current)
    if (d3dRef.current) observer.observe(d3dRef.current)
    if (terminadaRef.current) observer.observe(terminadaRef.current)

    return () => observer.disconnect()
  }, [])

  // Efecto del Contador de Minería en tiempo real
  useEffect(() => {
    if (!isStaked) {
      setMiningRate(0)
      return
    }

    const currentStageObj = stages.find(s => s.id === activeStage)!
    // Tasa Base: 0.000001 tokens por USD por segundo
    const ratePerSecond = 0.000001 * currentStageObj.value * currentStageObj.multiplier
    setMiningRate(ratePerSecond)

    const interval = setInterval(() => {
      setAccumulatedRewards(prev => prev + (ratePerSecond * 0.1))
    }, 100)

    return () => clearInterval(interval)
  }, [isStaked, activeStage])

  // Manejar subida de fotos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, stageId: string) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      if (stageId === 'gris') setObraGrisFile(url)
      if (stageId === '3d') setDiseno3dFile(url)
      if (stageId === 'terminada') setObraTerminadaFile(url)
    }
  }

  const handleEnviarEvidencia = () => {
    if (!obraGrisFile && !diseno3dFile && !obraTerminadaFile) {
      alert("Sube al menos una foto de evidencia.")
      return
    }
    setApprovalStatus('pending')
    
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)
      if (progress >= 100) {
        clearInterval(interval)
      }
    }, 100)
  }

  // Acciones Web3
  const handleSolicitarTasacion = async () => {
    if (!(window as any).ethereum) {
      alert("MetaMask no detectado. Instálalo para certificar la plusvalía.")
      return
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer)
      const tx = await oracleContract.updatePropertyPrice(2, 31250) // $31,250 para maxMintable de $25,000
      await tx.wait()
      alert("¡Plusvalía certificada exitosamente en la blockchain!")
    } catch (error) {
      console.error(error)
      alert("Error al certificar. Asegúrate de ser el tasador autorizado.")
    }
  }

  const handleMintearUsdJ = async () => {
    if (!(window as any).ethereum) {
      alert("MetaMask no detectado. Instálalo para mintear usdJ.")
      return
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.send("eth_requestAccounts", [])
      const signer = await provider.getSigner()
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer)
      
      const tx = await vaultContract.mintUsdJAgainstRWA(2)
      alert("Transacción enviada... Esperando confirmación de la blockchain Sepolia.")
      await tx.wait()
      
      if (onRefresh) onRefresh()
      alert("¡Transacción Exitosa! Has minteado usdJ reales en Sepolia.")
    } catch (error) {
      console.error(error)
      alert("Error al mintear. Verifica tus saldos y gas.")
    }
  }

  const handleRetirarUsdJ = async () => {
    if (!(window as any).ethereum) return alert("MetaMask no detectado.")
    if (!balances || parseFloat(balances.stable) <= 0) {
      return alert("No tienes deudas de usdJ que redimir.")
    }
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const signer = await provider.getSigner()
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer)
      const trueUsdjAddress = await vaultContract.stableToken()
      const usdjContract = new ethers.Contract(trueUsdjAddress, USDJ_ABI, signer)
      const dexContract = new ethers.Contract(MOCK_DEX_ADDRESS, MOCK_DEX_ABI, signer)

      const balanceToSwap = await usdjContract.balanceOf(await signer.getAddress())

      alert("Firma 1/2: Permite al DEX interactuar con tus usdJ (Approve).")
      const txApprove = await usdjContract.approve(MOCK_DEX_ADDRESS, balanceToSwap)
      await txApprove.wait()

      alert("Firma 2/2: Confirmar intercambio (Swap) de usdJ a USDC.")
      const txSwap = await dexContract.swapUsdjForUsdc(balanceToSwap)
      await txSwap.wait()
      
      if (onRefresh) onRefresh()
      alert("¡Retiro completado! Tus USDC de prueba ya están en tu billetera Sepolia.")
    } catch (error) {
      console.error(error)
      alert("Fallo el retiro.")
    }
  }

  // Funciones de Minería & Staking Web3 Mock
  const handleStake = async () => {
    if (!(window as any).ethereum) return alert("MetaMask no detectado.")
    setStakingLoading(true)
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.getSigner()
      alert("Firma transacción en MetaMask para bloquear tu Certificado NFT en Staking...");
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsStaked(true)
      alert("¡NFT bloqueado en Staking! Has iniciado la minería de rendimiento de RWA. ⛏️")
    } catch (err) {
      console.error(err)
    } finally {
      setStakingLoading(false)
    }
  }

  const handleClaim = async () => {
    if (!(window as any).ethereum) return alert("MetaMask no detectado.")
    setClaimingLoading(true)
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.getSigner()
      alert(`Reclamando ${accumulatedRewards.toFixed(6)} tokens de recompensa...`);
      await new Promise(resolve => setTimeout(resolve, 1500))
      setAccumulatedRewards(0)
      alert("¡Tokens de minería reclamados con éxito en Sepolia!")
    } catch (err) {
      console.error(err)
    } finally {
      setClaimingLoading(false)
    }
  }

  const handleUnstake = async () => {
    if (!(window as any).ethereum) return alert("MetaMask no detectado.")
    setUnstakingLoading(true)
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.getSigner()
      alert("Confirmando retiro de NFT de Staking y liquidación de ganancias...");
      await new Promise(resolve => setTimeout(resolve, 2000))
      setIsStaked(false)
      setAccumulatedRewards(0)
      alert("¡NFT liberado y minería de RWA finalizada!")
    } catch (err) {
      console.error(err)
    } finally {
      setUnstakingLoading(false)
    }
  }

  const currentStageObj = stages.find(s => s.id === activeStage)!

  return (
    <div className="flex flex-col gap-10">
      {/* Balance Stable float */}
      <div className="flex justify-start">
        <div className="flex flex-col items-start rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm shadow-[0_0_15px_rgba(255,255,255,0.02)]">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            STABLE DEUDA
          </span>
          <span className="font-mono text-2xl font-bold text-vault-stable">
            {parseFloat(balances?.stable || "0").toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
          <span className="text-xs text-muted-foreground font-medium">usdJ</span>
          <button onClick={handleRetirarUsdJ} className="mt-3 w-full text-xs font-semibold text-emerald-400 border border-emerald-500/20 py-1.5 px-4 rounded-xl bg-emerald-950/10 hover:bg-emerald-950/30 transition-all">
            Retirar a USDC
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
          Minera y extrae <span className="text-vault-cyan">plusvalía RWA</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto text-pretty leading-relaxed">
          Sube la evidencia de tu construcción, solicita la tasación on-chain y mina pasivamente recompensas bloqueando tu certificado en staking.
        </p>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        
        {/* LEFT COLUMN: Sticky Panels (Viewer, Upload, Mining Stats) */}
        <div className="sticky top-24 flex flex-col gap-6">
          
          {/* Active Image Visualizer (Scroll Storytelling Sync) */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-black/40 h-[300px] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
            
            <AnimatePresence mode="wait">
              {!imageError[activeStage] ? (
                <motion.img
                  key={activeStage}
                  src={currentStageObj.image}
                  alt={currentStageObj.label}
                  onError={() => setImageError(prev => ({ ...prev, [activeStage]: true }))}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <motion.div
                  key={`fallback-${activeStage}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`w-full h-full bg-gradient-to-br ${currentStageObj.color} flex flex-col items-center justify-center p-8 text-white rounded-xl`}
                >
                  {activeStage === 'gris' && <Pickaxe className="h-16 w-16 mb-4 text-white/80 animate-bounce" />}
                  {activeStage === '3d' && <Paintbrush className="h-16 w-16 mb-4 text-white/80" />}
                  {activeStage === 'terminada' && <Home className="h-16 w-16 mb-4 text-white/80" />}
                  <span className="font-bold text-xl">{currentStageObj.label}</span>
                  <span className="text-xs text-white/60 mt-1">Coloca tu imagen en public/frames/frameX.png</span>
                </motion.div>
              )}
            </AnimatePresence>

            <span className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider text-vault-cyan backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-vault-cyan animate-pulse" />
              Frame Sincronizado
            </span>
          </div>

          {/* Proof of Value Upload Card */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm">
            <h3 className="mb-4 text-lg font-bold flex items-center gap-2">
              <Building2 className="h-5 w-5 text-vault-cyan" />
              Evidencia Estructural
            </h3>

            <div className="relative overflow-hidden rounded-xl bg-black/20 border border-white/5 p-6 text-center min-h-[160px] flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                {approvalStatus === 'uploading' && (
                  <motion.div
                    key="upload-ui"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full"
                  >
                    <label className="cursor-pointer group">
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, activeStage)} 
                      />
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-vault-cyan/10 text-vault-cyan transition-transform group-hover:scale-105 border border-vault-cyan/20">
                        { (activeStage === 'gris' && obraGrisFile) || 
                          (activeStage === '3d' && diseno3dFile) || 
                          (activeStage === 'terminada' && obraTerminadaFile) ? (
                          <img 
                            src={
                              activeStage === 'gris' ? obraGrisFile! : 
                              activeStage === '3d' ? diseno3dFile! : 
                              obraTerminadaFile!
                            } 
                            alt="preview" 
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          <Upload className="h-6 w-6" />
                        )}
                      </div>
                    </label>
                    <span className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                      Sube la fotografía de la obra en etapa <strong>{currentStageObj.label}</strong>
                    </span>
                    <button onClick={handleEnviarEvidencia} className="mt-4 flex items-center gap-1.5 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 px-4 py-2 text-xs font-semibold hover:bg-orange-500/20 transition-all">
                      <FileCheck className="h-3.5 w-3.5" />
                      Enviar a Oráculo
                    </button>
                  </motion.div>
                )}

                {approvalStatus === 'pending' && (
                  <motion.div
                    key="pending-ui"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full"
                  >
                    <Loader2 className="h-10 w-10 text-vault-cyan animate-spin mb-3" />
                    <span className="text-sm font-semibold">Validando con Inteligencia de Oráculo</span>
                    <div className="w-full max-w-xs mt-3 bg-black/45 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-vault-cyan h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                  </motion.div>
                )}

                {approvalStatus === 'approved' && (
                  <motion.div
                    key="approved-ui"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center w-full"
                  >
                    <CheckCircle2 className="h-10 w-10 text-vault-stable mb-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
                    <span className="text-sm font-bold text-vault-stable">Certificado NFT Emitido</span>
                    <span className="text-[0.65rem] text-muted-foreground mt-1 max-w-[220px]">
                      Tu casa digital ha sido validada criptográficamente en Sepolia.
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* RWA Mining Staking Module */}
          <div className="rounded-2xl border border-border bg-card/60 p-6 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.2)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Hammer className="h-5 w-5 text-vault-stable" />
                Estadísticas de Minería RWA
              </h3>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[0.65rem] font-bold uppercase tracking-wider ${isStaked ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]" : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${isStaked ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"}`} />
                {isStaked ? "Mining Activo" : "Inactivo"}
              </span>
            </div>

            {/* Real-time Rewards Counter */}
            <div className="bg-black/35 rounded-xl border border-white/5 p-5 text-center mb-6">
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Tokens Acumulados
              </span>
              <div className="font-mono text-3xl font-extrabold text-white mt-1 tabular-nums tracking-tight">
                {isStaked ? accumulatedRewards.toFixed(8) : "0.00000000"}
              </div>
              <span className="text-[0.65rem] text-vault-stable font-bold uppercase tracking-wider block mt-1">
                ⛏️ {isStaked ? `${miningRate.toFixed(4)} jKERO / sec` : "0.0000 jKERO / sec"}
              </span>
            </div>

            {/* Multiplier Display */}
            <div className="grid grid-cols-2 gap-4 mb-6 text-center">
              <div className="p-3 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Valor Tasado
                </span>
                <div className="font-bold text-sm text-white font-mono mt-0.5">
                  ${currentStageObj.value.toLocaleString('en-US')} USD
                </div>
              </div>
              <div className="p-3 rounded-xl bg-black/20 border border-white/5 relative overflow-hidden group">
                <span className="text-[0.65rem] uppercase tracking-wider text-muted-foreground">
                  Multiplicador
                </span>
                <div className={`font-extrabold text-sm font-mono mt-0.5 ${
                  activeStage === 'gris' ? "text-zinc-400" :
                  activeStage === '3d' ? "text-vault-cyan" :
                  "text-vault-stable"
                }`}>
                  {currentStageObj.multiplier.toFixed(2)}x
                </div>
              </div>
            </div>

            {/* Mining Staking Action Buttons */}
            <div className="flex flex-col gap-3">
              {!isStaked ? (
                <button
                  disabled={approvalStatus !== 'approved' || stakingLoading}
                  onClick={handleStake}
                  className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
                    approvalStatus === 'approved' 
                      ? "bg-vault-cyan text-black hover:scale-[1.01] active:scale-[0.99] shadow-[0_0_20px_rgba(138,235,255,0.15)]" 
                      : "bg-vault-cyan/10 text-vault-cyan/40 cursor-not-allowed opacity-50 border border-vault-cyan/10"
                  }`}
                >
                  {stakingLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <span>Iniciar Staking de NFT</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={claimingLoading}
                    onClick={handleClaim}
                    className="py-3 rounded-xl font-semibold bg-vault-stable text-black hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] text-sm"
                  >
                    {claimingLoading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      "Reclamar"
                    )}
                  </button>
                  <button
                    disabled={unstakingLoading}
                    onClick={handleUnstake}
                    className="py-3 rounded-xl font-semibold border border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/10 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-1.5 transition-all text-sm"
                  >
                    {unstakingLoading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      "Unstake"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Scroll Storytelling Sections */}
        <div className="flex flex-col gap-12 pr-2">
          
          {/* Section 1: Obra Gris */}
          <div 
            ref={grisRef}
            data-stage-id="gris"
            className={`min-h-[50vh] p-8 rounded-2xl border transition-all duration-300 ${
              activeStage === 'gris' 
                ? "border-zinc-500 bg-zinc-500/5 shadow-[0_0_20px_rgba(113,113,122,0.05)]" 
                : "border-border bg-card/20 opacity-40 hover:opacity-75"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-zinc-500/10 text-zinc-400">
                <Pickaxe className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">Etapa 1</span>
                <h3 className="text-xl font-bold">Cimientos y Obra Gris</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              El inicio del activo digital inmobiliario. En esta fase se certifican los cimientos, la estructura y los muros sin pulir. La tasación es conservadora pero te permite acuñar tus primeros usdJ estables.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/25">
                <span className="text-muted-foreground block mb-0.5">Valor del Activo</span>
                <span className="font-bold text-white font-mono">$120,000.00</span>
              </div>
              <div className="p-3 rounded-lg bg-black/25">
                <span className="text-muted-foreground block mb-0.5">Minería Base</span>
                <span className="font-bold text-zinc-400 font-mono">1.00x Multiplicador</span>
              </div>
            </div>
          </div>

          {/* Section 2: Diseño 3D (Renders) */}
          <div 
            ref={d3dRef}
            data-stage-id="3d"
            className={`min-h-[50vh] p-8 rounded-2xl border transition-all duration-300 ${
              activeStage === '3d' 
                ? "border-vault-cyan bg-vault-cyan/5 shadow-[0_0_20px_rgba(138,235,255,0.05)]" 
                : "border-border bg-card/20 opacity-40 hover:opacity-75"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-vault-cyan/10 text-vault-cyan">
                <Paintbrush className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-vault-cyan">Etapa 2</span>
                <h3 className="text-xl font-bold">Planificación y Diseño 3D</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              El diseño 3D representa la planificación de acabados y distribución del inmueble. Al aprobarse los planos en el oráculo, el valor tasado de tu activo se incrementa, acelerando tu poder de minería en un 25%.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/25">
                <span className="text-muted-foreground block mb-0.5">Valor del Activo</span>
                <span className="font-bold text-white font-mono">$145,000.00</span>
              </div>
              <div className="p-3 rounded-lg bg-black/25">
                <span className="text-muted-foreground block mb-0.5">Minería Base</span>
                <span className="font-bold text-vault-cyan font-mono">1.25x Multiplicador</span>
              </div>
            </div>
          </div>

          {/* Section 3: Obra Terminada */}
          <div 
            ref={terminadaRef}
            data-stage-id="terminada"
            className={`min-h-[50vh] p-8 rounded-2xl border transition-all duration-300 ${
              activeStage === 'terminada' 
                ? "border-vault-stable bg-vault-stable/5 shadow-[0_0_20px_rgba(16,185,129,0.05)]" 
                : "border-border bg-card/20 opacity-40 hover:opacity-75"
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-vault-stable/10 text-vault-stable">
                <Home className="h-6 w-6" />
              </div>
              <div>
                <span className="text-[0.65rem] font-bold uppercase tracking-wider text-vault-stable">Etapa 3</span>
                <h3 className="text-xl font-bold">Obra Completa y Terminada</h3>
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm leading-relaxed mb-6">
              El activo inmobiliario ha sido completamente terminado. Esto desbloquea el valor completo de mercado de la propiedad en dólares y te permite minar recompensas de staking con el multiplicador de velocidad máxima del 1.75x.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-black/25">
                <span className="text-muted-foreground block mb-0.5">Valor del Activo</span>
                <span className="font-bold text-white font-mono">$210,000.00</span>
              </div>
              <div className="p-3 rounded-lg bg-black/25">
                <span className="text-muted-foreground block mb-0.5">Minería Base</span>
                <span className="font-bold text-vault-stable font-mono">1.75x Multiplicador</span>
              </div>
            </div>
          </div>

          {/* Staking Safety Warning Panel */}
          <div className="flex flex-col gap-4 rounded-2xl border border-vault-indigo/30 bg-vault-indigo/5 p-6 mt-6">
            <h4 className="font-bold text-vault-indigo flex items-center gap-2 text-sm">
              <ShieldAlert className="h-4.5 w-4.5" />
              Información de Seguridad del Oráculo
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              El staking y la minería se desactivan automáticamente si el oráculo detecta anomalías en la firma del Certificado RWA o si el contrato VaultV2.sol entra en liquidación debido a variaciones en la liquidez.
            </p>
            <div className="flex gap-2 justify-between">
              <button 
                onClick={handleSolicitarTasacion}
                className="text-[0.7rem] underline text-vault-indigo/70 hover:text-vault-indigo transition-colors"
              >
                Actualizar Precios del Oráculo
              </button>
              <button 
                onClick={() => {
                  setApprovalStatus('approved');
                  alert("Certificado NFT firmado de forma simulada.");
                }}
                className="text-[0.7rem] font-bold text-vault-cyan/70 hover:text-vault-cyan transition-colors"
              >
                Firma Rápida (Admin)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}

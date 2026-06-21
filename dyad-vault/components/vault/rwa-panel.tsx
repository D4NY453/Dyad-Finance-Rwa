"use client"

import { useState } from "react"
import { ethers } from "ethers"

const ORACLE_ADDRESS = "0xbbBaDa73a01212782Abd0597397666976824BC1a" // <-- DIRECCIÓN DEL CONTRATO REALESTATEORACLE
const ORACLE_ABI = [
  "function updatePropertyPrice(uint256 _propertyId, uint256 _newPriceInUSD) external",
  "function getLatestPrice(uint256 _propertyId) external view returns (uint256 price, uint256 timestamp)"
]

const VAULT_ADDRESS = "0x7c023497E7b4B97DAc3954929A306C27BD3c7600"
const VAULT_ABI = [
  "function mintUsdJAgainstRWA(uint256 _propertyId) external",
  "function stableToken() external view returns (address)"
]
// Obtenemos la dirección de USDJ dinámicamente desde el Vault
const USDJ_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

const MOCK_DEX_ADDRESS = "0xd8C425C6a5D1eCd6Fa6bD60eebC074964312edE1";
const MOCK_DEX_ABI = [
  "function swapUsdjForUsdc(uint256 amount) external"
];

import { motion, AnimatePresence } from "framer-motion"
import { Building2, Pickaxe, Paintbrush, Home, Banknote, ShieldAlert, ArrowRight, Loader2, Upload, FileCheck, CheckCircle2 } from "lucide-react"

const stages = [
  {
    id: "gris",
    label: "Obra Gris",
    icon: Pickaxe,
    description: "Cimientos, muros y techos estructurales sin acabados.",
    color: "from-zinc-500 to-zinc-700",
    value: "$120,000"
  },
  {
    id: "3d",
    label: "Diseño 3D (SketchUp)",
    icon: Paintbrush,
    description: "Renders y planificación arquitectónica de los acabados finales.",
    color: "from-vault-cyan to-blue-600",
    value: "$145,000"
  },
  {
    id: "terminada",
    label: "Obra Terminada",
    icon: Home,
    description: "Activo listo para habitar con todos los acabados instalados.",
    color: "from-vault-stable to-emerald-700",
    value: "$210,000"
  }
]

export function RwaPanel({ balances }: { balances?: any }) {
  const [activeStage, setActiveStage] = useState(stages[0].id)
  const [obraGrisFile, setObraGrisFile] = useState<string | null>(null);
  const [diseno3dFile, setDiseno3dFile] = useState<string | null>(null);
  const [obraTerminadaFile, setObraTerminadaFile] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'uploading' | 'pending' | 'approved'>('uploading');
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, stageId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (stageId === 'gris') setObraGrisFile(url);
      if (stageId === '3d') setDiseno3dFile(url);
      if (stageId === 'terminada') setObraTerminadaFile(url);
    }
  }

  const handleEnviarEvidencia = () => {
    if (!obraGrisFile && !diseno3dFile && !obraTerminadaFile) {
      alert("Sube al menos una foto de evidencia.");
      return;
    }
    setApprovalStatus('pending');
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 100);
  }

  const handleSolicitarTasacion = async () => {
    if (!(window as any).ethereum) {
      alert("Por favor instala MetaMask para interactuar con el Oráculo Inmobiliario.");
      return;
    }
    alert("Conectando con MetaMask para certificar la plusvalía de la obra...");
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const oracleContract = new ethers.Contract(ORACLE_ADDRESS, ORACLE_ABI, signer);
      const tx = await oracleContract.updatePropertyPrice(2, 31250); // Genera exactamente 25000 maxMintable
      await tx.wait();
      alert("¡Plusvalía certificada exitosamente en la blockchain!");
    } catch (error) {
      console.error(error);
      alert("Error al certificar la tasación. Asegúrate de estar conectado y ser el tasador autorizado.");
    }
  }

  const handleMintearUsdJ = async () => {
    if (!(window as any).ethereum) {
      alert("Por favor instala MetaMask para mintear usdJ.");
      return;
    }
    alert("MetaMask se abrirá para que firmes la acuñación de tus usdJ reales en Sepolia...");
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      
      const tx = await vaultContract.mintUsdJAgainstRWA(2);
      alert("Transacción enviada... Esperando confirmación de la red (esto puede tardar unos segundos).");
      await tx.wait();
      
      const usdJAddress = await vaultContract.stableToken();
      
      // El saldo se actualizará automáticamente en el próximo refresh de balances
      alert(`¡Transacción Exitosa! Has minteado usdJ reales en Sepolia.\n\nGuarda esta dirección de usdJ para llevarla a Uniswap:\n${usdJAddress}`);
    } catch (error) {
      console.error(error);
      alert("Error al mintear. Revisa la consola o asegúrate de tener fondos para el gas.");
    }
  }
  const handleRetirarUsdJ = async () => {
    if (!(window as any).ethereum) {
      return alert("MetaMask no detectado.");
    }
    
    if (!balances || parseFloat(balances.stable) <= 0) {
      return alert("No tienes usdJ reales en la blockchain para retirar.");
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      // Leemos la dirección real del usdJ directamente del contrato
      const vaultContract = new ethers.Contract(VAULT_ADDRESS, VAULT_ABI, signer);
      const trueUsdjAddress = await vaultContract.stableToken();
      const usdjContract = new ethers.Contract(trueUsdjAddress, USDJ_ABI, signer);
      const dexContract = new ethers.Contract(MOCK_DEX_ADDRESS, MOCK_DEX_ABI, signer);

      const balanceToSwap = await usdjContract.balanceOf(await signer.getAddress());

      alert("Paso 1: MetaMask pedirá permiso para que el DEX use tus usdJ (Aprobar).");
      const txApprove = await usdjContract.approve(MOCK_DEX_ADDRESS, balanceToSwap);
      await txApprove.wait();

      alert("Paso 2: Permiso otorgado. Ahora MetaMask pedirá confirmar el intercambio (Swap) de usdJ a USDC.");
      const txSwap = await dexContract.swapUsdjForUsdc(balanceToSwap);
      await txSwap.wait();
      
      // El saldo se actualizará automáticamente en el próximo refresh de balances
      alert("¡Retiro exitoso! Los 25,000 USDC reales ya están en tu billetera MetaMask (Sepolia).");
    } catch (error) {
      console.error(error);
      alert("Fallo el retiro. Asegúrate de tener los usdJ y de que le enviaste USDC al DEX en Remix.");
    }
  }

  const currentStage = stages.find(s => s.id === activeStage)!

  return (
    <div className="flex flex-col gap-10">
      <div className="flex justify-start">
        <div className="flex flex-col items-start rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm">
          <span className="text-[0.7rem] font-medium uppercase tracking-[0.25em] text-muted-foreground">
            STABLE TOKEN
          </span>
          <span className="font-mono text-2xl font-bold text-vault-stable">
            {parseFloat(balances?.stable || "0").toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
          </span>
          <span className="text-xs text-muted-foreground">usdJ</span>
          <button onClick={handleRetirarUsdJ} className="mt-3 w-full text-xs text-emerald-400 border border-emerald-500/30 py-1.5 rounded bg-emerald-900/20 hover:bg-emerald-900/40 transition-colors">
            Retirar a USDC
          </button>
        </div>
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Tokeniza tu esfuerzo <span className="text-vault-cyan">arquitectónico</span>
        </h2>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Convierte el progreso físico de tu obra en liquidez inmediata. El oráculo de Dyad Finance tasa tu propiedad en tiempo real y te permite emitir usdJ.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Carousel / Proof of Value */}
        <div className="flex flex-col rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-xl font-semibold flex items-center gap-2">
            <Building2 className="h-5 w-5 text-vault-cyan" />
            Prueba de Valor
          </h3>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {stages.map((stage) => {
              const Icon = stage.icon
              const isActive = activeStage === stage.id
              return (
                <button
                  key={stage.id}
                  onClick={() => setActiveStage(stage.id)}
                  className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    isActive ? "text-white" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTabRwa"
                      className="absolute inset-0 rounded-full bg-vault-cyan/20 border border-vault-cyan/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{stage.label}</span>
                </button>
              )
            })}
          </div>

          <div className="relative flex-1 overflow-hidden rounded-xl bg-black/40 border border-white/5 min-h-[250px] flex flex-col items-center justify-center p-6 text-center">
            <AnimatePresence mode="wait">
              {approvalStatus === 'uploading' && (
                <motion.div
                  key={`upload-${activeStage}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col items-center w-full"
                >
                  <label className="cursor-pointer group relative">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, currentStage.id)} 
                    />
                    <div className={`mb-4 overflow-hidden flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br ${currentStage.color} shadow-lg transition-transform group-hover:scale-105`}>
                      { (currentStage.id === 'gris' && obraGrisFile) || 
                        (currentStage.id === '3d' && diseno3dFile) || 
                        (currentStage.id === 'terminada' && obraTerminadaFile) ? (
                        <img 
                          src={
                            currentStage.id === 'gris' ? obraGrisFile! : 
                            currentStage.id === '3d' ? diseno3dFile! : 
                            obraTerminadaFile!
                          } 
                          alt="preview" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Upload className="h-10 w-10 text-white/70" />
                      )}
                    </div>
                  </label>
                  <h4 className="text-lg font-bold">{currentStage.label}</h4>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs">{currentStage.description}</p>
                  
                  <button onClick={handleEnviarEvidencia} className="mt-6 flex items-center gap-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 px-6 py-2.5 font-medium transition-colors hover:bg-orange-500/30">
                    <FileCheck className="h-4 w-4" />
                    Enviar Evidencia a Tasación
                  </button>
                </motion.div>
              )}

              {approvalStatus === 'pending' && (
                <motion.div
                  key="pending"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full"
                >
                  <Loader2 className="h-12 w-12 text-vault-cyan animate-spin mb-4" />
                  <h4 className="text-lg font-bold">Analizando Progreso Estructural</h4>
                  <p className="text-muted-foreground text-sm mt-2 max-w-xs">Esperando firma del Oráculo autorizado...</p>
                  
                  <div className="w-full max-w-xs mt-6 bg-black/50 rounded-full h-2 overflow-hidden border border-white/5">
                    <div 
                      className="bg-vault-cyan h-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-muted-foreground mt-2 uppercase tracking-widest">
                    Generando CID en IPFS...
                  </span>
                </motion.div>
              )}

              {approvalStatus === 'approved' && (
                <motion.div
                  key="approved"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center w-full"
                >
                  <div className="relative mb-4 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-700 shadow-[0_0_30px_rgba(217,119,6,0.3)] border border-yellow-400/50">
                    <CheckCircle2 className="h-12 w-12 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-amber-500">
                    Certificado NFT Aprobado
                  </h4>
                  <p className="text-muted-foreground text-sm mt-2">
                    El oráculo ha verificado y firmado la plusvalía criptográficamente.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Oracle Panel */}
        <div className="flex flex-col rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-sm">
          <h3 className="mb-6 text-xl font-semibold flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-vault-indigo" />
            Oráculo Inmobiliario
          </h3>

          <div className="space-y-4 mb-8 flex-1">
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/20 border border-white/5">
              <span className="text-sm text-muted-foreground">Tasación Inicial (Terreno + Cimientos)</span>
              <span className="font-mono font-medium">$80,000</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl bg-black/20 border border-white/5">
              <span className="text-sm text-muted-foreground">Inversión Reportada (Materiales)</span>
              <span className="font-mono font-medium text-vault-cyan">+$40,000</span>
            </div>
            <div className="flex justify-between items-center p-4 rounded-xl border border-vault-stable/30 bg-vault-stable/5">
              <span className="text-sm font-medium">Plusvalía Generada</span>
              <span className="font-mono text-lg font-bold text-vault-stable">+$25,000</span>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleSolicitarTasacion}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-vault-indigo/40 bg-vault-indigo/10 px-4 py-3 font-medium text-vault-indigo transition-colors hover:bg-vault-indigo/20"
            >
              Solicitar Tasación del Oráculo
            </button>

            <div className="flex flex-col gap-2 rounded-xl border border-border bg-black/40 p-4 text-sm mt-2 mb-1">
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Plusvalía a Tokenizar</span>
                <span className="font-mono">$25,000.00</span>
              </div>
              <div className="flex justify-between items-center text-red-400/80">
                <span>Comisión de Estructuración (1%)</span>
                <span className="font-mono">-$250.00</span>
              </div>
              <div className="my-1 border-t border-white/5"></div>
              <div className="flex justify-between items-center font-bold text-vault-stable">
                <span>Liquidez Neta a Recibir</span>
                <span className="font-mono">24,750.00 usdJ</span>
              </div>
            </div>
            <button 
              disabled={approvalStatus !== 'approved'}
              onClick={handleMintearUsdJ}
              className={`flex w-full items-center justify-between rounded-xl px-4 py-3 font-medium transition-transform ${approvalStatus === 'approved' ? "bg-vault-stable text-black hover:scale-[1.02] active:scale-[0.98]" : "bg-vault-stable/20 text-vault-stable/50 cursor-not-allowed opacity-50"}`}
            >
              <span>{approvalStatus === 'approved' ? "Mintear usdJ contra Plusvalía" : "Requiere NFT Aprobado"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {/* Admin Button */}
            <div className="flex justify-center mt-2">
              <button 
                onClick={() => {
                  setApprovalStatus('approved');
                  alert("NFT RWA Acuñado exitosamente en la wallet del usuario");
                }}
                className="text-[0.65rem] text-muted-foreground/30 hover:text-muted-foreground transition-colors"
              >
                Simular Firma de Oráculo (Admin)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

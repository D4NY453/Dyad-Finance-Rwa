"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion"
import { Rocket, ShieldCheck, TrendingUp, AlertTriangle, Wallet, Coins, Home, Layers, ArrowDown } from "lucide-react"
import { useVault } from "@/hooks/use-vault"
import { Navbar } from "./navbar-panel"
import { BalancePanel } from "./balance-panel"
import { ActionCard } from "./action-card"
import { ToastStack } from "./toast-stack"
import { RwaPanel } from "./rwa-panel"
import { PortfolioPanel } from "./portfolio-panel"
import { SwapPanel } from "./swap-panel"

export function Dyad() {
  const {
    account,
    connecting,
    wrongNetwork,
    balances,
    loading,
    refreshing,
    toasts,
    connectWallet,
    disconnect,
    switchToSepolia,
    loadBalances,
    runAction,
    dismissToast,
  } = useVault()

  const connected = Boolean(account)
  
  // Tema Claro/Oscuro y Canvas
  const [isDark, setIsDark] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [images, setImages] = useState<HTMLImageElement[]>([])
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [currentFrame, setCurrentFrame] = useState(0)

  // Escuchar cambios en la clase .dark del html
  useEffect(() => {
    if (!document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('light')) {
      document.documentElement.classList.add('dark')
    }
    
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'))
    }
    
    checkDark()
    
    const observer = new MutationObserver(checkDark)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    
    return () => observer.disconnect()
  }, [])

  // Carga de la secuencia de 51 imágenes (ajustado para navegadores móviles con fail-safe de red)
  useEffect(() => {
    const loadedImages: HTMLImageElement[] = []
    let loadedCount = 0
    const totalFrames = 51

    for (let i = 1; i <= totalFrames; i++) {
      const img = new Image()
      let settled = false

      const handleImageSettle = () => {
        if (settled) return
        settled = true
        loadedCount++
        setLoadingProgress(Math.round((loadedCount / totalFrames) * 100))
        if (loadedCount === totalFrames) {
          setImages(loadedImages)
          setImagesLoaded(true)
        }
      }
      
      // Asignar los controladores de evento ANTES de definir el .src
      img.onload = handleImageSettle
      img.onerror = handleImageSettle

      // Fail-safe de 800ms: Si el navegador de tu celular congela la petición debido a la
      // congestión del Wi-Fi al descargar 51 imágenes en paralelo desde el servidor de desarrollo,
      // forzamos el avance de carga para evitar que la pantalla se quede en 0% indefinidamente.
      setTimeout(handleImageSettle, 800)
      
      const frameNum = String(i).padStart(3, "0")
      img.src = `/frames/ezgif-frame-${frameNum}.jpg`
      loadedImages.push(img)
    }
  }, [])

  // Framer Motion useScroll vinculando el progreso del scroll del documento
  const { scrollYProgress } = useScroll()

  // Escuchar el cambio en scrollYProgress y mapearlo a los frames de la animación (0 a 50)
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!imagesLoaded || images.length === 0) return
    const totalFrames = 51
    // Mapea el progreso (0 -> 1) al índice del frame (0 -> 50)
    const frameIndex = Math.min(
      totalFrames - 1,
      Math.floor(latest * totalFrames)
    )
    setCurrentFrame(frameIndex)
  })

  // Función para dibujar los frames preservando la relación de aspecto e integrándose al fondo negro/blanco
  const drawImage = (img: HTMLImageElement) => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    ctx.scale(dpr, dpr)

    const cw = window.innerWidth
    const ch = window.innerHeight

    ctx.clearRect(0, 0, cw, ch)

    const imgW = img.width
    const imgH = img.height
    const imgRatio = imgW / imgH
    const canvasRatio = cw / ch

    let renderW = cw
    let renderH = ch
    let x = 0
    let y = 0

    // Relación de aspecto "contain" centrada para evitar deformaciones
    if (canvasRatio > imgRatio) {
      renderH = ch
      renderW = ch * imgRatio
      x = (cw - renderW) / 2
    } else {
      renderW = cw
      renderH = cw / imgRatio
      y = (ch - renderH) / 2
    }

    // Fondo negro o blanco sólido según el tema activo
    ctx.fillStyle = isDark ? "#000000" : "#ffffff"
    ctx.fillRect(0, 0, cw, ch)

    ctx.drawImage(img, x, y, renderW, renderH)
  }

  // Redibujar la imagen al cambiar el frame, el tamaño de la ventana o el tema
  useEffect(() => {
    if (imagesLoaded && images[currentFrame]) {
      drawImage(images[currentFrame])
    }
  }, [currentFrame, imagesLoaded, images, isDark])

  useEffect(() => {
    const handleResize = () => {
      if (imagesLoaded && images[currentFrame]) {
        drawImage(images[currentFrame])
      }
    }
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentFrame, imagesLoaded, images, isDark])

  return (
    <div className="relative bg-black text-foreground">
      {/* Preloader de Imágenes */}
      <AnimatePresence>
        {!imagesLoaded && (
          <motion.div 
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-16 w-16 border-t-2 border-vault-cyan rounded-full mb-6"
            />
            <h2 className="text-xl font-bold tracking-[0.25em] text-white/90">DYAD ENGINE</h2>
            <p className="text-sm text-white/40 mt-2 font-mono">{loadingProgress}% CARGANDO...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas Fijo en Segundo Plano con filtro dinámico de inversión para modo claro */}
      <canvas 
        ref={canvasRef}
        className={`fixed inset-0 w-full h-full z-0 pointer-events-none transition-all duration-300 ${
          isDark ? "bg-black invert-0" : "bg-white invert hue-rotate-180"
        }`}
        style={{ display: imagesLoaded ? 'block' : 'none' }}
      />

      {/* Navbar General */}
      <Navbar
        account={account}
        connecting={connecting}
        onConnect={connectWallet}
        onDisconnect={disconnect}
      />

      {/* Scrollable Overlay Sections (500vh de altura total para scroll extendido) */}
      <div className="relative z-10 w-full min-h-[500vh] overflow-visible">
        
        {/* SECCIÓN 1: HERO / 0% SCROLL */}
        <section className="min-h-screen flex flex-col justify-center items-center relative px-4 overflow-hidden">
          {/* Fondo de cabecera con letras separadas en los extremos (estilo editorial de lujo) */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center px-4 sm:px-10 md:px-16 pointer-events-none select-none z-10 w-full">
            <motion.h1 
              initial={{ opacity: 0, x: -150 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[11rem] font-light tracking-[0.1em] bg-gradient-to-r from-zinc-500 via-zinc-100 to-zinc-600 bg-clip-text text-transparent uppercase drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            >
              DYAD
            </motion.h1>
            <motion.h1 
              initial={{ opacity: 0, x: 150 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-7xl md:text-[8rem] lg:text-[11rem] font-light tracking-[0.1em] bg-gradient-to-r from-zinc-600 via-zinc-100 to-zinc-500 bg-clip-text text-transparent uppercase drop-shadow-[0_4px_20px_rgba(255,255,255,0.15)]"
            >
              FINANCE
            </motion.h1>
          </div>

          {/* Texto de descripción posicionado al fondo para dejar el token ETH totalmente limpio en el centro */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center max-w-xl px-4 z-20 pointer-events-none select-none"
          >
            <p className="text-xs sm:text-sm md:text-base leading-relaxed text-white/50 text-pretty font-light tracking-wide">
              El protocolo de estabilidad descentralizado que redefine la eficiencia de capital mediante el staking de colateral cripto y activos reales RWA.
            </p>
          </motion.div>
          
          {/* Indicador de scroll */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40 z-20">
            <span className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white">Hacia Abajo</span>
            <ArrowDown className="h-4 w-4 animate-bounce text-white" />
          </div>
        </section>

        {/* SECCIÓN 2: CRYPTO VAULT / 30% SCROLL */}
        <section className="min-h-screen flex flex-col justify-center relative px-4 py-20">
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto"
          >
            {/* Banner de red incorrecta reubicado al inicio de las operaciones */}
            {wrongNetwork && (
              <div className="mb-8 flex flex-col items-center justify-between gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 px-5 py-4 sm:flex-row">
                <span className="text-sm text-foreground flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Red incorrecta. Cambia a Sepolia para operar.
                </span>
                <button onClick={switchToSepolia} className="rounded-full border border-destructive/40 bg-destructive/20 px-4 py-1.5 text-sm font-medium">
                  Cambiar a Sepolia
                </button>
              </div>
            )}

            {/* Panel de balances reubicado arriba de las tarjetas de acuñación */}
            {connected && (
              <div className="mb-12">
                <BalancePanel balances={balances} refreshing={refreshing} connected={connected} onRefresh={loadBalances} />
              </div>
            )}

            <div className="mb-10 max-w-md">
              <h2 className="text-3xl font-extrabold tracking-tighter text-white/90">
                Acuñación Cripto L1
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed text-sm">
                A medida que el activo se descompone, el colateral se divide. Emite usdJ estable o jETH apalancado y gestiona tu exposición de forma autónoma.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <ActionCard
                title="Entrar a la bóveda"
                description="Deposita ETH para acuñar usdJ y jETH automáticamente."
                placeholder="0.0 ETH"
                cta="Depositar ETH"
                loadingLabel="Procesando..."
                accent="cyan"
                icon={<Rocket className="h-5 w-5" />}
                loading={loading.deposit}
                disabled={!connected}
                maxValue={balances.eth}
                maxSymbol="ETH"
                onSubmit={(amount) => runAction("deposit", amount)}
              />
              <ActionCard
                title="Retiro seguro"
                description="Canjea tus usdJ y la bóveda te devolverá su valor en ETH."
                placeholder="0.0 usdJ"
                cta="Canjear usdJ"
                loadingLabel="Procesando..."
                accent="stable"
                icon={<ShieldCheck className="h-5 w-5" />}
                loading={loading.redeemStable}
                disabled={!connected}
                maxValue={balances.stable}
                maxSymbol="usdJ"
                onSubmit={(amount) => runAction("redeemStable", amount)}
              />
              <ActionCard
                title="Retiro apalancado"
                description="Canjea jETH para capturar las ganancias del ETH sobrante."
                placeholder="0.0 jETH"
                cta="Canjear jETH"
                loadingLabel="Procesando..."
                accent="indigo"
                icon={<TrendingUp className="h-5 w-5" />}
                loading={loading.redeemVolatile}
                disabled={!connected}
                maxValue={balances.volatile}
                maxSymbol="jETH"
                onSubmit={(amount) => runAction("redeemVolatile", amount)}
              />
            </div>
          </motion.div>
        </section>

        {/* SECCIÓN 3: RWA VAULT & MINING / 60% SCROLL */}
        <section className="min-h-screen flex flex-col justify-center relative px-4 py-20">
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto"
          >
            <div className="mb-10 text-right ml-auto max-w-md">
              <h2 className="text-3xl font-extrabold tracking-tighter text-white/90">
                Activos Reales (RWA)
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed text-sm">
                La estructura completamente expandida revela sus componentes internos. Sincroniza la tasación física y bloquea tus NFTs de construcción para minar recompensas.
              </p>
            </div>

            <RwaPanel balances={balances} onRefresh={loadBalances} />
          </motion.div>
        </section>

        {/* SECCIÓN 4: SWAP & PORTFOLIO / 80% SCROLL */}
        <section className="min-h-screen flex flex-col justify-center relative px-4 py-20">
          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mx-auto"
          >
            <div className="mb-10 text-center max-w-lg mx-auto">
              <h2 className="text-3xl font-extrabold tracking-tighter text-white/90">
                Swap e Información de Cuenta
              </h2>
              <p className="mt-4 text-white/60 leading-relaxed text-sm">
                El producto se vuelve a ensamblar de forma suave. Gestiona tus tokens, realiza intercambios instantáneos y visualiza tu portafolio.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                <h3 className="text-md font-semibold text-white/80 mb-4">Intercambio Instantáneo</h3>
                <SwapPanel balances={balances} onRefresh={loadBalances} />
              </div>
              
              <div className="rounded-2xl border border-white/10 bg-black/60 p-6 backdrop-blur-md h-full shadow-[0_0_15px_rgba(0,0,0,0.4)]">
                <h3 className="text-md font-semibold text-white/80 mb-4">Composición de Cartera</h3>
                <PortfolioPanel balances={balances} />
              </div>
            </div>
          </motion.div>
        </section>

        {/* SECCIÓN 5: VISTA FINAL LIMPIA / 100% SCROLL */}
        <section className="min-h-screen flex flex-col justify-between items-center relative px-4 py-20 bg-gradient-to-t from-black via-transparent to-transparent">
          {/* Espaciador superior */}
          <div />

          <motion.div 
            initial={{ opacity: 0, x: 100 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, amount: 0.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center max-w-md mx-auto z-10"
          >
            <h2 className="text-3xl font-extrabold tracking-widest text-white/90 uppercase">
              Asegura tu Estabilidad
            </h2>
            <p className="mt-4 text-white/60 leading-relaxed text-sm">
              Tu viaje de minería y acuñación está listo. Desplázate hacia arriba para operar o empieza hoy mismo.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-8 rounded-full border border-vault-cyan/40 bg-vault-cyan/10 px-8 py-3.5 font-bold text-vault-cyan transition-all hover:bg-vault-cyan/20 hover:shadow-[0_0_20px_-4px_var(--vault-cyan)]"
            >
              VOLVER AL INICIO
            </button>
          </motion.div>

          <div className="text-center opacity-40 text-xs tracking-widest uppercase font-mono z-10">
            © 2026 Dyad Finance Inc. — Todos los derechos reservados.
          </div>
        </section>

      </div>

      {/* Toast Notificaciones */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}

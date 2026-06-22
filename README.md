# 🏗️ Dyad Finance RWA (Real World Assets) 

 Dyad Finance: Una "díada" en sociología y matemáticas es algo que consiste en dos elementos fuertemente vinculados. 
 Token A Estable y Token B  Volátil siempre suman 1 ETH


# ¿De qué trata este proyecto?

1. El Problema Actual: Riesgo de Liquidación El modelo tradicional de stablecoins respaldadas por criptomonedas
(como DAl de MakerDAO) funciona mediante Posiciones de Deuda Colateralizada (CDP): Depositas tu ETH como garantía (colateral).Pides prestados tokens estables (dólares) contra ese ETH. El riesgo: Si el precio de ETH cae repentinamente y se acerca al valor de lo que pediste prestado, un contrato inteligente liquida (vende a la fuerza) tu ETH para pagar la deuda. Esto puede causar pérdidas masivas para el usuario y, en caidas extremas del mercado, puede desestabilizar todo el sistema.


Basados esta fuente  https://ethresear.ch/t/building-index-tracking-assets-on-top-of-options-instead-of-debt/25036



2. La Nueva ldea: División del Colateral (Tranching) Funciona asi: Depositas 1 ETH en un contrato inteligente y, en lugar de pedir un préstamo, el sistema "divide" el valor de ese ETH en dos tokens distintos: Token A (EI Estable): Reclama un valor fijo en dólares del ETH depositado (por ejemplo,$3,000). Este token actua como tu stablecoin. Token B
 (EI Volátil/Alcista): Reclama todo el valor restante del ETH.

# ¿Qué pasa cuando el precio cambia?

Si ETH sube a $4,000: EI Token A sigue valiendo $3,000 (es estable).
El Token B absorbe toda la ganancia  y ahora vale $1,000.


Si ETH baja a $3,500: El Token A sigue valiendo $3,000. El Token B baja a $500.
Si ETH se desploma a $2,500: Como no hay deuda, no hay liquidación. El Token B
pasa a valer $0 y el token A absorbe la pérdida, pasa a valer $2,500 (es decir,
pierde ligeramente su paridad con el dolar).


Cambiar deriva de precios por seguridad 

en escenarios de caidas catastróficas, la stablecoin (Token A) podria perder temporalmente su valor exacto de
$1.00 (deriva de precio). Sin embargo, a cambio de esta pequeña imperfección, el sistema gana
una seguridad  inmensa: No requiere oráculos de precios constantes (los cuales son vulnerables a hackeos).
No hay liquidaciones forzadas, evitando que los usuarios pierdan su capital de forma abrupta por la volatilidad a corto
plazo. El sistema es autosuficiente, ya que los dos tokens siempre sumarán exactamente 1 ETH, manteniendo la
contabilidad perfecta en todo momento.


Este enfoque busca un dinero estable más resiliente, eliminando el pánico de las liquidaciones que
tanto afecta a los usuarios durante los mercados bajistas.


Si ETH cae un 60% de golpe, ¿cómo evitas la espiral de la muerte que destruyó a Terra/Luna?"

A diferencia de Terra, Lunar Vault no imprime tokens de la nada para mantener una paridad algorítmica, ni dependemos de un token de gobernanza. Nuestra bóveda tiene una contabilidad exacta y estricta. Si ETH cae un 60%, el vETH absorbe el golpe primero y llega a cero. Si la caída continúa, el usdJ simplemente pierde su paridad (peg) y pasa a valer, por ejemplo, 0.80 centavos. No hay liquidaciones forzadas ni ventas en cascada en los DEX. El sistema entra en modo de hibernación segura hasta que el precio de ETH se recupere


# ¿Qué pasa si el Oráculo de Chainlink falla o es manipulado (Flash Loan Attack)?"

El contrato Vault consulta la función latestRoundData() de Chainlink. Para llevar esto a producción en Arbitrum, implementaremos un Circuit Breaker (interruptor de emergencia). Si el oráculo devuelve un precio que varía más de un 20% respecto a la última actualización, o si el updatedAt tiene más de 2 horas de antigüedad, las funciones de depósito y retiro se pausan automáticamente para evitar arbitrajes maliciosos o ataques de préstamos flash.


# ¿cómo solucionas la liquidez inicial? Nadie va a querer el vETH si no hay usdJ emitido."

Es el clásico problema del huevo y la gallina en DeFi. La estrategia es aprovechar la infraestructura de Arbitrum. Lanzaremos un fondo de liquidez (Pool) concentrado en Uniswap V3 o Camelot DEX (usdJ/USDC). Usaremos una parte de los fondos de la tesorería del protocolo para garantizar liquidez profunda en ese par. Además, los primeros usuarios que acuñen vETH recibirán incentivos (Yield Farming, Airdrops) para compensar el riesgo de ser los primeros en adoptar el tramo volátil."


# ¿Qué busca? 

Guardar su dinero sin que pierda valor por la volatilidad de las criptomonedas.

# ¿Por qué usaría tu plataforma en lugar de comprar USDT o USDC? 

Porque el usdJ es totalmente descentralizado, transparente y respaldado directamente por Ethereum, sin depender de bancos tradicionales ni empresas centralizadas.

esta plataforma existe para atender a dos tipos de personas al mismo tiempo:

1. El Ahorrador (El que usa usdJ)

# ¿Qué busca? 

Guardar su dinero sin que pierda valor por la volatilidad de las criptomonedas.

# ¿Por qué usaría tu plataforma en lugar de comprar USDT o USDC?

Porque el usdJ es totalmente descentralizado, transparente y respaldado directamente por Ethereum, sin depender de bancos tradicionales ni empresas centralizadas.

2. El Inversor/Traders (El que usa vETH)

esta plataforma es una herramienta de apalancamiento sin riesgo de liquidación.

# ¿Qué busca? 

Multiplicar sus ganancias si el precio de Ethereum sube.

# ¿Por qué usaría tu plataforma en lugar de ir a Binance y operar con margen? 

los exchanges tradicionales o protocolos de préstamos, si el mercado cae repentinamente, te liquidan (te quitan todo tu dinero). En esta  plataforma, el usuario simplemente espera a que el mercado se recupere, conservando sus tokens intactos.

En resumen: Es un mercado descentralizado que toma un activo volátil (ETH) y lo empaqueta en dos productos distintos: uno diseñado para la estabilidad absoluta y otro diseñado para el alto rendimiento.


Este código Maneja la creación de tokens de forma segura, lee el precio en tiempo real y ejecuta las matemáticas de división sin generar posiciones de deuda.


se dice que EF Necesita demostrar, en producción, que la coordinación autónoma a gran escala es posible.

Dyad Finance 

tiene la arquitectura perfecta para responder a ese desafío. No se trata solo de tener un contrato inteligente aislado o un bot de chat; se trata de que múltiples sistemas (IA y Blockchain) hablen entre sí para mover dinero real en el mundo físico sin que un humano tenga que presionar un botón


## 💻 Instalación Local

1. Clona este repositorio:
```bash
git clone https://github.com/D4NY453/dyad-finance-rwa.git
```
2. Entra a la carpeta de la aplicación:
```bash
cd UniswapV4/dyad-vault
```
3. Instala las dependencias:
```bash
npm install
```
4. Corre el servidor de desarrollo:
```bash
npm run dev
```
5. Abre `http://localhost:3000` en tu navegador. Necesitarás tener MetaMask instalado y configurado en la red **Sepolia**.

---

*Proyecto creado para Hackathon. Los contratos de esta rama están desplegados actualmente en la red de pruebas Sepolia.*




## Visiones



#   RWA

El Oráculo Inmobiliario de Dyad Finance

 soluciona el problema de la iliquidez de los activos del mundo real. Si un usuario tokeniza su propiedad, nuestro contrato RealEstateOracle almacena su valor avalado por peritos. Si el usuario realiza mejoras estructurales a la propiedad, el tasador actualiza el oráculo. Inmediatamente, la Bóveda de Dyad Finance lee este nuevo precio y permite al usuario emitir más dólares estables (usdJ) contra esa nueva plusvalía, obteniendo liquidez para sus próximos proyectos de construcción sin tocar un banco

La Arquitectura del Oráculo RWA

Para que el sistema sea confiable y no centralizado, no podemos dejar que el dueño de la casa dicte su propio precio. Necesitamos un modelo de Consenso de Tasadores Autorizados.

Los Tasadores (Appraisers): Son billeteras autorizadas que pertenecen a empresas de tasación reales, peritos inmobiliarios o un comité del protocolo.

El Proceso: Cuando la propiedad mejora estructuralmente, se suben los comprobantes o los videos render del antes y el después a un sistema descentralizado (como IPFS). Los tasadores evalúan la propiedad y envían la nueva valoración al contrato inteligente.




## 🛠️ Arquitectura Técnica

El proyecto está dividido principalmente en la carpeta `/dyad-vault`, que contiene todo el ecosistema de Smart Contracts y el Frontend:

### 1. Smart Contracts (Solidity)
Ubicados en `dyad-vault/contracts/`:
* **`VaultV2.sol`**:
 Recibe colateral (Cripto o Bienes Raíces) y emite dos tokens: el token estable (`usdJ`) y el token volátil (`jETH`) que absorbe el riesgo del mercado. Adicionalmente cobra un **1% de comisión de estructuración** directo a la Tesorería.
* **`RWACertificate.sol`**: Un contrato NFT (ERC-721) que actúa como el certificado inmutable de tasación de la propiedad. Solo puede ser emitido por oráculos autorizados.
* **`RealEstateOracle.sol`**: Oráculo encargado de tasar la plusvalía física de los inmuebles.
* **`MockUSDC.sol` & `MockDex.sol`**: Una simulación de liquidez de mercado para permitir a los usuarios intercambiar instantáneamente sus `usdJ` a `USDC` o `ETH` real de Sepolia.

### 2. Frontend (React + Next.js)
Ubicado en `dyad-vault/components/vault/`:
* **Interfaz Drag & Drop (IPFS simulado)**: Permite a los arquitectos subir fotos de su progreso físico.
* **Sistema de Trazabilidad RWA**: Muestra el desglose transparente de la plusvalía y los fees generados.
* **Insta-Swap UI**: Interfaz de un solo clic para intercambiar divisas al instante.



## Implementacion IA 


1. Oráculo de Visión Computacional (IA Visual)
El cuello de botella de cualquier plataforma RWA es que depende de un humano (el tasador) para mirar las fotos y aprobar la transacción.

La Implementación: Integramos un modelo de visión por computadora (como GPT-4 Vision o un modelo entrenado). Cuando el contratista sube el render 3D de SketchUp y la foto de la obra terminada, la IA los compara.

El Beneficio: La IA verifica automáticamente si las dimensiones coinciden y es capaz de detectar los acabados (identifica si en la pared hay estuco real, y si en el suelo hay porcelanato o piedra sinterizada). Si el grado de coincidencia entre el 3D y la realidad es superior al 90%, la IA pre-aprueba la tasación y recomienda la firma del contrato inteligente, reduciendo los tiempos de espera de días a segundos.

2. Agente Cuantitativo Macro-Económico (IA de Riesgo)
En DeFi, los mercados globales y la inflación de los materiales de construcción cambian todos los días. Un protocolo robusto necesita un analista de mercado trabajando 24/7.

La Implementación: Desplegar un agente de IA especializado como analista de investigación de mercado macroeconómico y cuantitativo, conectado directamente a los contratos de Dyad Finance.

El Beneficio: Este agente audita la volatilidad del ETH y el precio internacional de los materiales de construcción (como el acero, perfiles o cemento). Con base en esta data cuantitativa, el agente ajusta dinámicamente los "Límites de Deuda" (Debt Ceilings) de las bóvedas L1 o sugiere modificar la comisión de estructuración del 1% para proteger la paridad del usdJ. Es tu propio banco central automatizado.

3. Asistente de "Expediente de Obra" por Voz (IA Procesamiento de Lenguaje)
En la obra, un constructor o instalador de drywall tiene las manos sucias y no tiene tiempo para escribir un informe detallado en su celular para llenar los metadatos del NFT.

La Implementación: Un botón de micrófono en la DApp. El constructor solo presiona y dice: "Terminamos la fase 2. Se instalaron 50 metros de porcelanato italiano 60x60, muros de drywall con aislamiento acústico y luces LED empotradas."

El Beneficio: Un modelo de IA (como Whisper) transcribe el audio, extrae las palabras clave y redacta automáticamente el archivo JSON de metadatos con viñetas técnicas perfectas. Luego, esto se sube a IPFS para ser el TokenURI del NFT. Cero fricción para el usuario.

4. Optimización de Bóveda Predictiva (IA para el Usuario)
El modelo de tramos (Tranching) separa el ETH en estable (usdJ) y volátil (vETH). A veces, el usuario no sabe cuánto porcentaje tener de cada uno.

La Implementación: Un asesor de IA integrado en el panel "Mi Bóveda". El usuario le indica el cronograma de su obra (ej. "No necesito comprar más materiales hasta dentro de 3 meses").

El Beneficio: La IA evalúa la tendencia del mercado cripto. Si prevé un mercado alcista (Bull Market), le recomienda al usuario mantener una mayor parte de su capital en vETH para ganar apalancamiento, y solo cambiar a usdJ la semana exacta en la que el camión de la distribuidora de materiales deba ser pagado.

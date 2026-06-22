# 🏗️ Dyad Finance RWA (Real World Assets)

> **DeFi para la Construcción:** Tokeniza tu esfuerzo arquitectónico. Convierte el progreso físico de tu obra en liquidez inmediata.

## 📖 ¿De qué trata este proyecto?

La industria de la construcción y los bienes raíces sufre de un problema masivo de **iliquidez**. Los desarrolladores bloquean millones de dólares en cemento y ladrillos, y para obtener más capital, dependen de bancos lentos y burocráticos.

**Dyad Finance RWA** es un ecosistema DeFi (Finanzas Descentralizadas) que soluciona esto permitiendo a los constructores subir evidencia de su progreso físico (ej. Obra Gris terminada) para que un Oráculo descentralizado lo certifique mediante un **NFT ERC-721**. Una vez certificado, nuestra **Bóveda (VaultV2)** usa ese NFT como colateral para emitir dólares digitales (`usdJ`), dándole liquidez inmediata al constructor sin pasar por un banco.

---

## 🛠️ Arquitectura Técnica

El proyecto está dividido principalmente en la carpeta `/dyad-vault`, que contiene todo el ecosistema de Smart Contracts y el Frontend:

### 1. Smart Contracts (Solidity)
Ubicados en `dyad-vault/contracts/`:
* **`VaultV2.sol`**: El corazón del protocolo. Recibe colateral (Cripto o Bienes Raíces) y emite dos tokens: el token estable (`usdJ`) y el token volátil (`jETH`) que absorbe el riesgo del mercado. Adicionalmente cobra un **1% de comisión de estructuración** directo a la Tesorería.
* **`RWACertificate.sol`**: Un contrato NFT (ERC-721) que actúa como el certificado inmutable de tasación de la propiedad. Solo puede ser emitido por oráculos autorizados.
* **`RealEstateOracle.sol`**: Oráculo encargado de tasar la plusvalía física de los inmuebles.
* **`MockUSDC.sol` & `MockDex.sol`**: Una simulación de liquidez de mercado para permitir a los usuarios intercambiar instantáneamente sus `usdJ` a `USDC` o `ETH` real de Sepolia.

### 2. Frontend (React + Next.js)
Ubicado en `dyad-vault/components/vault/`:
* **Interfaz Drag & Drop (IPFS simulado)**: Permite a los arquitectos subir fotos de su progreso físico.
* **Sistema de Trazabilidad RWA**: Muestra el desglose transparente de la plusvalía y los fees generados.
* **Insta-Swap UI**: Interfaz de un solo clic inspirada en Relay.link para intercambiar divisas al instante.

---

## 🚀 Flujo de Usuario (Cómo probarlo)

1. **Prueba de Valor**: El constructor entra a la plataforma y sube la foto de su obra.
2. **Aprobación RWA**: El archivo simula subirse a IPFS. El administrador (Oráculo) aprueba la foto, minteando un NFT Dorado en la billetera del usuario.
3. **Minteo**: El botón verde se desbloquea, permitiendo extraer (mintear) `usdJ` contra el valor tasado de la propiedad, menos un 1% de comisión matemática.
4. **Insta-Swap**: En la pestaña "⚡ Swap", el constructor intercambia sus `usdJ` recién impresos por `USDC` o `Ethereum`, llevándose dinero real al bolsillo.

---

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

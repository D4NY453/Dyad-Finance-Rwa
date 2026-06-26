# Product Requirement Document (PRD): Dyad Vault V2

* **Versión:** 1.0
* **Fecha:** 2026-06-26
* **Rol Responsable:** [agency-product-manager](file:///C:/Users/Jose/.gemini/config/skills/agency-product-manager/SKILL.md)
* **Estado:** Propuesto para Revisión

---

## 1. Introducción y Objetivos
Dyad Vault V2 es un protocolo de moneda estable sintética descentralizada que emite el token `usdJ` (estable) y el token `vETH` (volátil/apalancado). El protocolo busca mejorar la eficiencia del capital permitiendo a los usuarios acuñar activos estables contra dos tipos de colaterales dentro del contrato [VaultV2.sol](file:///c:/Users/Jose/Documents/UniswapV4/dyad-vault/contracts/VaultV2.sol):
1. **Colateral Cripto (Capa 1):** Depósitos directos en ETH.
2. **Colateral RWA (Activos del Mundo Real):** Certificados de propiedad inmobiliaria tokenizados en formato ERC-721 ([RWACertificate.sol](file:///c:/Users/Jose/Documents/UniswapV4/dyad-vault/contracts/RWACertificate.sol)).

---

## 2. Roles y Actores Clave
* **Acuñador de Stablecoin (Minter):** Usuarios que depositan ETH o bloquean certificados RWA para obtener liquidez en `usdJ` (manteniendo una exposición al dólar).
* **Buscador de Apalancamiento (vETH Holder):** Usuarios que buscan una exposición apalancada al precio de ETH mediante la acumulación de tokens `vETH`.
* **Propietarios de Certificados RWA:** Inversores inmobiliarios que poseen tokens NFT que representan inmuebles físicos y desean extraer liquidez de su plusvalía sin vender el inmueble.

---

## 3. Especificaciones Funcionales (Versión Actual)

### 3.1 Flujo de Depósito y Acuñación Cripto (L1)
* **Entrada:** Depósito de ETH por parte del usuario.
* **Proceso:**
  1. Se consulta el feed de precios Chainlink (`priceFeed`) para obtener el precio de ETH en USD (18 decimales).
  2. Se calcula el valor equivalente en dólares del depósito.
  3. Se acuñan `usdJ` por el 100% de ese valor en dólares al depositante.
  4. Se acuñan tokens `vETH` equivalentes en una proporción de 1:1 respecto al ETH depositado.
* **Contrato Origen:** `VaultV2.sol -> deposit()`

### 3.2 Flujo de Acuñación RWA
* **Requisito:** El usuario debe poseer el NFT correspondiente en [RWACertificate.sol](file:///c:/Users/Jose/Documents/UniswapV4/dyad-vault/contracts/RWACertificate.sol).
* **Proceso:**
  1. Se consulta el precio de la propiedad a través de `realEstateOracle.getLatestPrice(propertyId)`.
  2. Se valida que los datos no tengan una antigüedad mayor a 7 días.
  3. Se calcula el límite máximo de acuñación (LTV de un **80%** del precio de la propiedad).
  4. Se calcula la deuda ya extraída contra esa propiedad mediante `usdJMintedAgainstProperty`.
  5. Se deduce una **tarifa (fee) del 1%** sobre el neto a acuñar que se envía a la billetera de tesorería (`treasuryWallet`).
  6. Se acuñan los `usdJ` restantes al propietario del certificado RWA.
* **Contrato Origen:** `VaultV2.sol -> mintUsdJAgainstRWA()`

---

## 4. Requisitos de Seguridad (Mejoras Mandatorias)

Para que el sistema sea viable en producción, la versión actual de [VaultV2.sol](file:///c:/Users/Jose/Documents/UniswapV4/dyad-vault/contracts/VaultV2.sol) debe implementar mejoras inmediatas de seguridad.

### 4.1 Requisito 1: Mitigación de Dilución y Acuñación Infinita de `vETH`
* **Problema de la versión actual:** La función `redeemStable()` quema los stables (`usdJ`) pero permite que el usuario conserve los `vETH` que se le entregaron gratis, posibilitando bucles de lavado de liquidez para inflar la tenencia de `vETH`.
* **Requisito del Producto:**
  * Al redimir `usdJ` mediante `redeemStable()`, el contrato **debe quemar proporcionalmente** los tokens `vETH` en posesión del usuario.
  * Si el usuario no tiene suficientes `vETH` para quemar (porque los vendió o transfirió), se debe bloquear la redención de stables o forzar la recompra de los tokens `vETH` necesarios.
  * *Alternativa de diseño:* Cambiar a un modelo CDP (Collateralized Debt Position) clásico donde los colaterales y la deuda se rastrean de manera unificada en una sola estructura por cuenta.

### 4.2 Requisito 2: Introducción de Ratio de Colateralización Máxima (LTV < 100% en Crypto)
* **Problema de la versión actual:** Acuñar estables por el 100% del valor de ETH significa que ante la más mínima fluctuación a la baja en el mercado, el protocolo se vuelve insolvente y bloquea los retiros.
* **Requisito del Producto:**
  * Reducir el LTV de los depósitos de ETH a un máximo del **75%** (o un valor similar configurable).
  * Si un usuario deposita 1 ETH ($3,000 USD), solo podrá acuñar hasta 2,250 `usdJ`.
  * Definir un mecanismo de liquidación automático o penalización para cuentas cuyo ratio de colateralización caiga por debajo del 110% en momentos de alta volatilidad.

### 4.3 Requisito 3: Protección contra Deslizamiento de Precios (Slippage)
* **Problema de la versión actual:** Las transacciones de redención en la mempool son vulnerables a ataques de sandwich o a fluctuaciones abruptas del feed de Chainlink.
* **Requisito del Producto:**
  * Añadir un argumento `minEthExpected` en las funciones `redeemStable` y `redeemVolatile`.
  * La transacción debe revertirse automáticamente si el valor calculado de ETH a entregar es menor que el valor esperado establecido por el usuario.

---

## 5. Requisitos de la Interfaz de Usuario (UX/UI)
La dApp de Next.js deberá exponer de forma muy intuitiva estas mecánicas:
1. **Dashboard Unificado:** Sección para ver el Balance de `usdJ`, Balance de `vETH`, y Colateral total bloqueado (ETH + Propiedades).
2. **Monitoreo de Salud (Health Factor):** Indicador visual dinámico de color (verde/amarillo/rojo) que muestre el nivel de riesgo de insolvencia/liquidación del usuario basado en sus depósitos y deuda.
3. **Galería de Certificados RWA:** Interfaz tipo tarjeta (card) que muestre los NFTs que posee el usuario y permita acuñar plusvalía directamente desde la tarjeta.
4. **Historial de Oráculos:** Visualización de la última actualización de precios del oráculo inmobiliario y de Chainlink para dar transparencia al usuario.

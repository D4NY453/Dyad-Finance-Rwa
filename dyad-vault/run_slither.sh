#!/bin/bash
set -e
PATH="/root/.foundry/bin:/root/.local/bin:/usr/bin:/bin"
echo "PATH=$PATH"
which forge || true
/root/.foundry/bin/forge --version || true
which slither || true
/root/.local/bin/slither --version || true
cd /mnt/c/Users/Jose/Documents/UniswapV4/dyad-vault
/root/.local/bin/slither contracts/VaultV2.sol --compile-force-framework solc --solc /root/.local/bin/solc --solc-remaps "@openzeppelin=/mnt/c/Users/Jose/Documents/UniswapV4/dyad-vault/node_modules/@openzeppelin"

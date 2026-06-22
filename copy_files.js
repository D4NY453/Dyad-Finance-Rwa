const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  let entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    let srcPath = path.join(src, entry.name);
    let newName = entry.name.endsWith('.txt') ? entry.name.slice(0, -4) : entry.name;
    let destPath = path.join(dest, newName);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDir('C:\\Users\\Jose\\Desktop\\dyad', 'C:\\Users\\Jose\\Documents\\UniswapV4\\dyad-vault');

if (fs.existsSync('C:\\Users\\Jose\\Documents\\UniswapV4\\dyad-vault\\app\\global.ccs')) {
  fs.renameSync('C:\\Users\\Jose\\Documents\\UniswapV4\\dyad-vault\\app\\global.ccs', 'C:\\Users\\Jose\\Documents\\UniswapV4\\dyad-vault\\app\\globals.css');
}
console.log('Done copying and renaming files.');

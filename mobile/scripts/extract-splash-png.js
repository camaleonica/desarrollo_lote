const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, '../assets/svg/splash-gavel.svg');
const outPath = path.join(__dirname, '../assets/svg/splash-hand.png');
const svg = fs.readFileSync(svgPath, 'utf8');
const match = svg.match(/xlink:href="(data:image\/png;base64,[^"]+)"/);

if (!match) {
  console.error('PNG embebido no encontrado');
  process.exit(1);
}

const base64 = match[1].replace(/^data:image\/png;base64,/, '');
fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
console.log('Extracted', outPath, fs.statSync(outPath).size, 'bytes');

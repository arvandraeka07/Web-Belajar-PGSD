/* Merender aset SVG menjadi PNG untuk pembuatan video.
   Jalankan dengan NODE_PATH menuju folder node_modules yang memiliki sharp. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.resolve(__dirname, '..');
const outDir = path.join(__dirname, 'build', 'img');
const iconDir = path.join(outDir, 'icons');
fs.mkdirSync(iconDir, { recursive: true });

const jobs = [
  ['assets/images/mascot-huhu.svg', 'mascot.png', 800],
  ['assets/images/logo.svg', 'logo.png', 220],
  ['assets/images/illustration-membaca.svg', 'ill-membaca.png', 1100],
  ['assets/images/illustration-berhitung.svg', 'ill-berhitung.png', 1100],
  ['assets/images/illustration-tumbuhan.svg', 'ill-tumbuhan.png', 1100]
];

const icons = [
  '1F4DA', '1F4D5', '1F4DD', '1F4A1', '1F31F', '1F3C6', '1F680',
  '1F9E0', '1F3AF', '1F525', '1F9EA', '1F4A7', '1F31E', '1F331',
  '1F98B', '2705', '2600', '1F3AE', '1F4AA'
];

async function run() {
  for (const [src, name, width] of jobs) {
    await sharp(path.join(root, src))
      .resize({ width, fit: 'inside', withoutEnlargement: false })
      .png()
      .toFile(path.join(outDir, name));
    console.log('render', name);
  }
  for (const code of icons) {
    await sharp(path.join(root, 'assets', 'images', 'om-' + code + '.svg'))
      .resize({ width: 512, height: 512, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(path.join(iconDir, code + '.png'));
  }
  console.log('render', icons.length, 'icons');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

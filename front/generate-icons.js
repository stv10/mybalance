import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputFile = './public/favicon.svg';
const outputDir = './public';

async function generateIcons() {
  if (!fs.existsSync(inputFile)) {
    console.error('favicon.svg no encontrado!');
    process.exit(1);
  }

  const sizes = [192, 512];
  
  for (const size of sizes) {
    await sharp(inputFile)
      .resize(size, size)
      .toFile(path.join(outputDir, `pwa-${size}x${size}.png`));
    console.log(`Generado pwa-${size}x${size}.png`);
  }

  // Apple touch icon
  await sharp(inputFile)
    .resize(180, 180)
    .toFile(path.join(outputDir, `apple-touch-icon.png`));
  console.log(`Generado apple-touch-icon.png`);

  // Maskable icon (padding extra)
  await sharp(inputFile)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 } // Fondo blanco
    })
    .toFile(path.join(outputDir, `maskable-icon-512x512.png`));
  console.log(`Generado maskable-icon-512x512.png`);
}

generateIcons().catch(console.error);

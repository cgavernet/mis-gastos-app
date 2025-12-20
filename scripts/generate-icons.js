import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const publicDir = join(rootDir, 'public');
const svgPath = join(publicDir, 'icon.svg');

const svgBuffer = readFileSync(svgPath);

const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }
];

async function generateIcons() {
  for (const { name, size } of sizes) {
    const outputPath = join(publicDir, name);
    
    if (name.endsWith('.ico')) {
      // Para favicon.ico, generar PNG primero y luego convertir
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath.replace('.ico', '.png'));
      
      // En Windows, el .ico puede ser simplemente un PNG renombrado
      // o puedes usar una herramienta específica para ICO
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    } else {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
    }
    
    console.log(`✓ Generated ${name} (${size}x${size})`);
  }
  
  console.log('\n✓ All icons generated successfully!');
}

generateIcons().catch(console.error);






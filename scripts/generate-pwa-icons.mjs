import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(root, "..", "public");
const iconsDir = path.join(publicDir, "icons");

await mkdir(iconsDir, { recursive: true });

const targets = [
  { input: "pwa-192x192.svg", output: "icons/icon-192.png", size: 192 },
  { input: "pwa-192x192.svg", output: "icons/apple-touch-icon.png", size: 180 },
  { input: "pwa-192x192.svg", output: "icons/icon-512.png", size: 512 },
];

for (const { input, output, size } of targets) {
  const inputPath = path.join(publicDir, input);
  const outputPath = path.join(publicDir, output);
  await sharp(inputPath).resize(size, size).png({ compressionLevel: 9 }).toFile(outputPath);
  console.log(`Wrote ${output}`);
}

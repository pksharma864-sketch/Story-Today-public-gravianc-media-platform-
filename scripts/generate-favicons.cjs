const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateFaviconSuite() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const originFaviconPath = '/tmp/origin_icons/favicon.ico';
  const localBackupFavicon = path.join(process.cwd(), 'public', 'origin_favicon.ico');

  // If origin favicon is not cached in /tmp, save or fetch it
  if (!fs.existsSync(originFaviconPath) && fs.existsSync(localBackupFavicon)) {
    fs.copyFileSync(localBackupFavicon, originFaviconPath);
  }

  if (fs.existsSync(originFaviconPath) && !fs.existsSync(localBackupFavicon)) {
    fs.copyFileSync(originFaviconPath, localBackupFavicon);
  }

  // 1. Extract 48x48 PNG from origin favicon.ico
  const tmpRaw = '/tmp/origin_fav_extracted.png';
  if (fs.existsSync(originFaviconPath)) {
    execSync(`convert "${originFaviconPath}" "${tmpRaw}"`);
  } else if (fs.existsSync('/tmp/origin_favicon.png')) {
    fs.copyFileSync('/tmp/origin_favicon.png', tmpRaw);
  } else {
    console.error('No origin favicon found!');
    return;
  }

  // 2. Clean background to pure #FFFFFF white
  const tmpClean = '/tmp/origin_cleaned_bg.png';
  execSync(`convert "${tmpRaw}" -fuzz 5% -fill white -opaque white "${tmpClean}"`);

  // 3. Shift by +1px for safe border padding so circular mask never clips the letters
  const icon48 = path.join(publicDir, 'favicon-48x48.png');
  execSync(`convert "${tmpClean}" +repage -page +1+0 -background white -flatten -repage 48x48+0+0 "${icon48}"`);
  execSync(`convert "${icon48}" -repage 48x48+0+0 "${icon48}"`);

  // 4. Generate 32x32 and 16x16
  const icon32 = path.join(publicDir, 'favicon-32x32.png');
  const icon16 = path.join(publicDir, 'favicon-16x16.png');
  execSync(`convert "${icon48}" -filter Lanczos -resize 32x32 -repage 32x32+0+0 "${icon32}"`);
  execSync(`convert "${icon48}" -filter Lanczos -resize 16x16 -repage 16x16+0+0 "${icon16}"`);

  // 5. Generate high-resolution multiples of 48px
  const icon96 = path.join(publicDir, 'favicon-96x96.png');
  const icon192 = path.join(publicDir, 'favicon-192x192.png');
  const icon512 = path.join(publicDir, 'favicon-512x512.png');
  const iconApple = path.join(publicDir, 'apple-touch-icon.png');

  execSync(`convert "${icon48}" -filter Lanczos -resize 96x96 -repage 96x96+0+0 "${icon96}"`);
  execSync(`convert "${icon48}" -filter Lanczos -resize 192x192 -repage 192x192+0+0 "${icon192}"`);
  execSync(`convert "${icon48}" -filter Lanczos -resize 512x512 -repage 512x512+0+0 "${icon512}"`);
  execSync(`convert "${icon48}" -filter Lanczos -resize 180x180 -repage 180x180+0+0 "${iconApple}"`);

  // 6. Multi-resolution favicon.ico containing 16x16, 32x32, 48x48
  const faviconIco = path.join(publicDir, 'favicon.ico');
  execSync(`convert "${icon16}" "${icon32}" "${icon48}" "${faviconIco}"`);

  // 7. Fallback favicon.png
  const faviconPng = path.join(publicDir, 'favicon.png');
  fs.copyFileSync(icon48, faviconPng);

  // 8. Scalable SVG favicon
  const b64_512 = fs.readFileSync(icon512).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#FFFFFF"/>
  <image width="512" height="512" href="data:image/png;base64,${b64_512}" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

  console.log('Successfully generated complete favicon suite matching story-today.in:');
  console.log('- public/favicon.ico (Multi-size 16/32/48 ICO container)');
  console.log('- public/favicon-48x48.png (Google Search 48px baseline)');
  console.log('- public/favicon-96x96.png (Google Search 48x2 High-DPI)');
  console.log('- public/favicon-192x192.png (Google / PWA 48x4)');
  console.log('- public/favicon-512x512.png (512px High-Res Master)');
  console.log('- public/favicon-32x32.png (Standard browser tabs)');
  console.log('- public/favicon-16x16.png (Standard bookmark icon)');
  console.log('- public/favicon.png (48x48 Fallback)');
  console.log('- public/apple-touch-icon.png (180x180 iOS)');
  console.log('- public/favicon.svg (Scalable vector favicon)');
}

generateFaviconSuite();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function generateFaviconSuite() {
  const publicDir = path.join(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // 1. Get logo source
  let logoBuffer = null;
  const settingsFile = path.join(process.cwd(), 'settings.json'); // if any
  const logoPngPath = path.join(publicDir, 'logo.png');
  const logoSvgPath = path.join(publicDir, 'logo.svg');

  // Check if we can get it from /tmp/custom_logo.png or public/logo.png
  if (fs.existsSync('/tmp/custom_logo.png')) {
    logoBuffer = fs.readFileSync('/tmp/custom_logo.png');
  } else if (fs.existsSync(logoPngPath)) {
    logoBuffer = fs.readFileSync(logoPngPath);
  } else if (fs.existsSync(logoSvgPath)) {
    const svgStr = fs.readFileSync(logoSvgPath, 'utf-8');
    const match = svgStr.match(/href="data:image\/png;base64,([^"]+)"/);
    if (match) {
      logoBuffer = Buffer.from(match[1], 'base64');
    }
  }

  if (!logoBuffer) {
    console.error('No logo source found to generate favicons!');
    return;
  }

  const tmpSource = '/tmp/st_logo_source.png';
  fs.writeFileSync(tmpSource, logoBuffer);

  // 2. Clean and trim near-zero alpha artifact pixels
  const tmpTrimmed = '/tmp/st_logo_trimmed.png';
  execSync(`convert "${tmpSource}" -fuzz 2% -trim +repage "${tmpTrimmed}"`);

  const info = execSync(`identify -format "%w %h" "${tmpTrimmed}"`).toString().trim().split(' ');
  const width = parseInt(info[0]);
  const height = parseInt(info[1]);
  console.log(`Trimmed logo dimensions: ${width}x${height}`);

  // 3. Find the column boundary between 'Story' and 'Today'
  // Scan columns in the middle range (40% to 60% of width)
  const rawRgba = execSync(`convert "${tmpTrimmed}" -depth 8 rgba:-`, { maxBuffer: 20 * 1024 * 1024 });
  const colAlphaSum = new Array(width).fill(0);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const a = rawRgba[idx + 3];
      if (a > 30) colAlphaSum[x]++;
    }
  }

  const minSearchX = Math.floor(width * 0.35);
  const maxSearchX = Math.floor(width * 0.65);
  let minCol = 999999;
  let splitX = Math.floor(width * 0.46);

  for (let x = minSearchX; x < maxSearchX; x++) {
    if (colAlphaSum[x] < minCol) {
      minCol = colAlphaSum[x];
      splitX = x;
    }
  }
  console.log(`Word split point between Story and Today: x=${splitX}`);

  // 4. Crop 'Story' (left) and 'Today' (right)
  const storyCrop = `/tmp/st_part_story.png`;
  const todayCrop = `/tmp/st_part_today.png`;
  execSync(`convert "${tmpTrimmed}" -crop ${splitX}x${height}+0+0 -fuzz 2% -trim +repage "${storyCrop}"`);
  execSync(`convert "${tmpTrimmed}" -crop ${width - splitX}x${height}+${splitX}+0 -fuzz 2% -trim +repage "${todayCrop}"`);

  // 5. Scale both to 420px width for equal visual weight
  const story420 = `/tmp/st_story_420.png`;
  const today420 = `/tmp/st_today_420.png`;
  execSync(`convert "${storyCrop}" -resize 420x "${story420}"`);
  execSync(`convert "${todayCrop}" -resize 420x "${today420}"`);

  // 6. Stack them with 14px optical gap
  const storyWithGap = `/tmp/st_story_gap.png`;
  execSync(`convert "${story420}" -background none -splice 0x14 "${storyWithGap}"`);
  const stacked = `/tmp/st_stacked.png`;
  execSync(`convert "${storyWithGap}" "${today420}" -background none -gravity center -append "${stacked}"`);

  // 7. Place in 512x512 transparent canvas with safe-zone margin (max 420px so circle crop never clips)
  const icon512 = path.join(publicDir, 'favicon-512x512.png');
  execSync(`convert -size 512x512 xc:none "${stacked}" -resize 420x420 -gravity center -composite "${icon512}"`);

  // 8. Generate all standard and Google Search sizes
  const icon192 = path.join(publicDir, 'favicon-192x192.png');
  const icon96 = path.join(publicDir, 'favicon-96x96.png');
  const icon48 = path.join(publicDir, 'favicon-48x48.png');
  const icon32 = path.join(publicDir, 'favicon-32x32.png');
  const icon16 = path.join(publicDir, 'favicon-16x16.png');

  execSync(`convert "${icon512}" -filter Lanczos -resize 192x192 "${icon192}"`);
  execSync(`convert "${icon512}" -filter Lanczos -resize 96x96 "${icon96}"`);
  execSync(`convert "${icon512}" -filter Lanczos -resize 48x48 "${icon48}"`);
  execSync(`convert "${icon512}" -filter Lanczos -resize 32x32 "${icon32}"`);
  execSync(`convert "${icon512}" -filter Lanczos -resize 16x16 "${icon16}"`);

  // 9. Multi-resolution favicon.ico containing 16x16, 32x32, 48x48
  const faviconIco = path.join(publicDir, 'favicon.ico');
  execSync(`convert "${icon16}" "${icon32}" "${icon48}" "${faviconIco}"`);

  // 10. Apple Touch Icon (180x180, solid white background with centered logo for iOS)
  const appleTouchIcon = path.join(publicDir, 'apple-touch-icon.png');
  execSync(`convert -size 180x180 xc:white \\( "${icon512}" -resize 144x144 \\) -gravity center -composite "${appleTouchIcon}"`);

  // 11. Scalable SVG favicon
  const b64_512 = fs.readFileSync(icon512).toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" width="100%" height="100%">
  <image width="512" height="512" href="data:image/png;base64,${b64_512}" />
</svg>`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');

  console.log('Successfully generated complete favicon suite in /public:');
  console.log('- favicon-512x512.png');
  console.log('- favicon-192x192.png (48x4 multiple for Google / Android)');
  console.log('- favicon-96x96.png (48x2 multiple for Google High-DPI)');
  console.log('- favicon-48x48.png (Google Search primary target size)');
  console.log('- favicon-32x32.png (Browser tabs standard)');
  console.log('- favicon-16x16.png (Classic favicon)');
  console.log('- favicon.ico (Multi-size 16/32/48 bundle)');
  console.log('- apple-touch-icon.png (180x180 iOS)');
  console.log('- favicon.svg (Scalable vector)');
}

generateFaviconSuite();

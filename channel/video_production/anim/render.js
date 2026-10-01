// usage: node render.js stills out_dir t1,t2,...   |   node render.js video startFrame endFrame out.mp4
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const FPS = 30;
(async () => {
  const [mode, a1, a2, a3] = process.argv.slice(2);
  const exe = fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined;
  const browser = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files', '--disable-web-security', '--no-sandbox', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('PAGEERR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'index.html'));
  await page.evaluate(() => window.ready);
  if (mode === 'stills') {
    fs.mkdirSync(a1, { recursive: true });
    for (const ts of a2.split(',')) { const t = parseFloat(ts); await page.evaluate(([t, f]) => window.renderFrame(t, f), [t, Math.round(t * FPS)]); await page.locator('#c').screenshot({ path: path.join(a1, `still_${String(Math.round(t * 10)).padStart(4, '0')}.png`) }); }
  } else {
    const s = parseInt(a1), e = parseInt(a2);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '19', '-pix_fmt', 'yuv420p', a3], { stdio: ['pipe', 'inherit', 'inherit'] });
    const t0 = Date.now();
    for (let f = s; f < e; f++) {
      await page.evaluate(([t, f]) => window.renderFrame(t, f), [f / FPS, f]);
      const buf = await page.locator('#c').screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if ((f - s) % 150 === 0) console.log(`seg ${s}-${e}: frame ${f} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await browser.close();
})();

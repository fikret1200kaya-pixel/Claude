// ===== Main: asset loading + frame renderer =====
window.ready = (async () => {
  await document.fonts.load('400 100px "Bebas Neue"');
  await Promise.all([
    loadImg('logo', 'assets/logo.png'), loadImg('chair', 'assets/chair.png'), loadImg('offer', 'assets/offer.png'),
    loadImg('envelope', 'assets/envelope.png'), loadImg('closed', 'assets/closed.png'), loadImg('kodak', 'assets/kodak.png'),
    loadImg('hastings', 'assets/people/hastings.jpg'), loadImg('randolph', 'assets/people/randolph.jpg'), loadImg('icahn', 'assets/people/icahn.jpg'), loadImg('antioco', 'assets/people/antioco.jpg'),
  ]);
  initLook();
  window.ok = true;
})();
const FADE = .22;
window.renderFrame = function (t, frame) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  drawBG(t);
  for (const s of SCENES) {
    const ain = s.a <= 0 ? 1 : E.io(seg(t, s.a - FADE * .6, s.a + FADE));
    const aout = 1 - E.io(seg(t, s.b - FADE * .6, s.b + FADE));
    const al = Math.min(ain, aout); if (al <= 0.001) continue;
    ctx.save(); ctx.globalAlpha = al;
    const sc = 1 + .025 * (1 - ain); ctx.translate(W / 2, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
    s.fn(Math.max(t, s.a), s.a, s.b);
    ctx.restore();
  }
  drawOverlay(t, frame);
  // fade from/to black
  const fb = 1 - seg(t, 0, .6), fo = seg(t, DATA.T - .5, DATA.T + .3);
  const k = Math.max(fb, fo); if (k > 0) { ctx.fillStyle = `rgba(0,0,0,${k})`; ctx.fillRect(0, 0, W, H); }
};

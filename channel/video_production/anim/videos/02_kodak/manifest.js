window.VIDEO = {
  id: '02_kodak',
  bugFrom: 24,
  scripts: ['data.js', 'credits.js', 'scenes1.js', 'scenes2.js'],
  images: Object.assign({
    logo: 'assets/logo.png', proto: 'assets/proto.png', saw: 'assets/saw.png', factory_startup: 'assets/factory_startup.png', nokia: 'assets/nokia.jpg',
    eastman: 'assets/people/eastman.jpg', sasson: 'assets/people/sasson.jpg',
  }, Object.fromEntries(Array.from({ length: 15 }, (_, i) => { const k = 'k' + String(i + 1).padStart(2, '0'); return [k, `assets/kodak/${k}.jpg`]; }))),
};

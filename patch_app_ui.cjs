const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /<main className="flex-1 min-w-0 p-8 lg:p-16 overflow-y-auto">/,
  '<main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-10 xl:p-16 pb-24 md:pb-10 overflow-y-auto w-full max-w-[100vw]">'
);

// Add useEffect for Media Session API
const useEffectImport = code.indexOf('useEffect');
if (useEffectImport === -1) {
    code = code.replace("import React, { useState", "import React, { useState, useEffect");
}

const seoHookLocation = code.indexOf('const seo = getSeoInfo();');

const mediaSessionHook = `
  // Sync Media Session and Document Title
  useEffect(() => {
    if (isPlaying) {
      const trackTitle = currentTrack?.name || 'Audio Session';
      document.title = \`▶ \${trackTitle} - MasteringLocal.Pro\`;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: trackTitle,
          artist: 'MasteringLocal.Pro',
          album: 'Studio Editor',
          artwork: [
            { src: 'https://masteringlocal.pro/icon.png', sizes: '512x512', type: 'image/png' }
          ]
        });
        navigator.mediaSession.playbackState = 'playing';
      }
    } else {
      document.title = seo.title;
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
    }
  }, [isPlaying, currentTrack, seo.title]);
`;

code = code.slice(0, seoHookLocation) + mediaSessionHook + '\n  ' + code.slice(seoHookLocation);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app ui');

const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

if (!code.includes('isPlaying: boolean;')) {
    code = code.replace('hasAudio: boolean;', 'hasAudio: boolean;\n  isPlaying: boolean;');
}

if (!code.includes('isPlaying,')) {
    code = code.replace('hasAudio,', 'hasAudio,\n  isPlaying,');
}

const originalStatus = '<div className="hidden md:flex items-center gap-2">\n            <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] shadow-[0_0_8px_var(--accent-lime)]" />\n            <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">PROCESSING LOCAL</span>\n          </div>';

const newStatus = `{isPlaying ? (\n            <div className="flex items-center gap-2 px-3 py-1 bg-[#D4FF5C]/10 border border-[#D4FF5C]/30 rounded-full animate-pulse-slow">\n              <div className="flex items-center gap-0.5 h-3">\n                <div className="w-[2px] h-full bg-[#D4FF5C] animate-[bounce_1s_infinite_0ms]" />\n                <div className="w-[2px] h-2/3 bg-[#D4FF5C] animate-[bounce_1s_infinite_200ms]" />\n                <div className="w-[2px] h-full bg-[#D4FF5C] animate-[bounce_1s_infinite_400ms]" />\n              </div>\n              <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4FF5C] uppercase">PLAYING</span>\n            </div>\n          ) : (\n            <div className="hidden md:flex items-center gap-2">\n              <span className="w-2 h-2 rounded-full bg-[var(--accent-lime)] shadow-[0_0_8px_var(--accent-lime)]" />\n              <span className="text-[10px] font-mono tracking-widest text-[var(--text-secondary)] uppercase">PROCESSING LOCAL</span>\n            </div>\n          )}`;

code = code.replace(originalStatus, newStatus);

fs.writeFileSync('src/components/Header.tsx', code);
console.log('patched header playing');

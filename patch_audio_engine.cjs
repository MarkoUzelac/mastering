const fs = require('fs');
let code = fs.readFileSync('src/utils/audio-engine.ts', 'utf8');

if (!code.includes('export const audioEngineEvents')) {
  code = code.replace(
    /export class AudioMasteringEngine \{/,
    'export const audioEngineEvents = new EventTarget();\n\nexport class AudioMasteringEngine {'
  );
}

if (!code.includes('audioEngineEvents.dispatchEvent')) {
  code = code.replace(
    /this\.onTimeUpdateCallback\(currentTime, this\.audioBuffer\.duration\);/g,
    'this.onTimeUpdateCallback(currentTime, this.audioBuffer.duration);\n          audioEngineEvents.dispatchEvent(new CustomEvent("timeupdate", { detail: { currentTime, duration: this.audioBuffer.duration } }));'
  );

  code = code.replace(
    /this\.onMeterUpdateCallback\(meterData\);/g,
    'this.onMeterUpdateCallback(meterData);\n    audioEngineEvents.dispatchEvent(new CustomEvent("meterupdate", { detail: meterData }));'
  );
}

fs.writeFileSync('src/utils/audio-engine.ts', code);
console.log('patched audio engine events');

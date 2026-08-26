const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  /audioEngine\.setTimeUpdateCallback\(\(time, totalDuration\) => \{\n      setCurrentTime\(time\);\n      if \(totalDuration && totalDuration > 0\) setDuration\(totalDuration\);\n    \}\);/,
  'audioEngine.setTimeUpdateCallback((time, totalDuration) => {\n      // setCurrentTime(time); // THROTLED / REMOVED to prevent 60fps re-renders\n      if (totalDuration && totalDuration > 0) setDuration(totalDuration);\n    });'
);

code = code.replace(
  /audioEngine\.setMeterUpdateCallback\(\(meters\) => \{\n      setMeterData\(meters\);\n    \}\);/,
  'audioEngine.setMeterUpdateCallback((meters) => {\n      // setMeterData(meters); // THROTLED / REMOVED to prevent rapid re-renders\n    });'
);

fs.writeFileSync('src/App.tsx', code);
console.log('patched app state');

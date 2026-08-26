const fs = require('fs');
let code = fs.readFileSync('src/components/TransportBar.tsx', 'utf8');

if (!code.includes('import React, { useState, useEffect }')) {
  code = code.replace(
    /import React, \{ useState \} from 'react';/,
    "import React, { useState, useEffect } from 'react';"
  );
}

fs.writeFileSync('src/components/TransportBar.tsx', code);
console.log('patched transport react');

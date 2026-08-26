const fs = require('fs');
let code = fs.readFileSync('src/components/CookieConsentBanner.tsx', 'utf8');

code = code.replace(
  /Marketing \& Referrals/g,
  'Marketing & Advertising (Consent Mode v2)'
);
code = code.replace(
  /Measures referral attribution for partner campaigns\./g,
  'Enables ad_storage, ad_user_data, and ad_personalization for targeted advertising and conversion measurement.'
);
code = code.replace(
  /Anonymous Analytics/g,
  'Analytics Storage'
);
code = code.replace(
  /Allows aggregate telemetry on mastering rendering times and conversion performance without logging audio buffers\./g,
  'Enables analytics_storage to measure site usage and performance.'
);

fs.writeFileSync('src/components/CookieConsentBanner.tsx', code);
console.log('patched cookie');

const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCatchBlock = `    } catch (err: unknown) {
      console.error('[Stripe] Checkout Session Creation Failed:', err);
      // Fallback to simulated checkout if the price ID doesn't exist in this Stripe account
      if (err instanceof Error && err.message.includes('No such price')) {
        console.warn(\`[Stripe] Missing or invalid Stripe Price ID (\${priceId}). Falling back to simulated checkout.\`);
        // Let it fall through to the simulated checkout below
      } else {
        return res.status(500).json({
          error: 'Failed to create Stripe Checkout session. Please check Stripe configuration.',
          details: err instanceof Error ? err.message : String(err),
        });
      }
    }`;

const newCatchBlock = `    } catch (err: unknown) {
      // Fallback to simulated checkout if the price ID doesn't exist in this Stripe account
      if (err instanceof Error && err.message.includes('No such price')) {
        console.log(\`[Stripe Fallback] Missing or invalid Stripe Price ID (\${priceId}). Proceeding with simulated checkout for preview environment.\`);
        // Let it fall through to the simulated checkout below
      } else {
        console.error('[Stripe] Checkout Session Creation Failed:', err);
        return res.status(500).json({
          error: 'Failed to create Stripe Checkout session. Please check Stripe configuration.',
          details: err instanceof Error ? err.message : String(err),
        });
      }
    }`;

code = code.replace(oldCatchBlock, newCatchBlock);
fs.writeFileSync('server.ts', code);
console.log('patched server error log');

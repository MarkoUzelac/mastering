const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const oldCatchBlock = `    } catch (err: unknown) {
      console.error('[Stripe] Checkout Session Creation Failed:', err);
      let errorMsg = 'Failed to create Stripe Checkout session. Please check Stripe configuration.';
      if (err instanceof Error && err.message.includes('No such price')) {
        errorMsg = \`Missing or invalid Stripe Price ID. Please configure STRIPE_PRO_MONTHLY_PRICE_ID and STRIPE_PRO_YEARLY_PRICE_ID in your environment variables. (Tried to use: \${priceId})\`;
      }
      return res.status(500).json({
        error: errorMsg,
        details: err instanceof Error ? err.message : String(err),
      });
    }`;

const newCatchBlock = `    } catch (err: unknown) {
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

if (code.includes(oldCatchBlock)) {
    code = code.replace(oldCatchBlock, newCatchBlock);
    fs.writeFileSync('server.ts', code);
    console.log('patched successfully');
} else {
    console.log('could not find target code');
}

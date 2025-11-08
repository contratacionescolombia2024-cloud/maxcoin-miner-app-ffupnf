
# Payment Integration Guide for Maxcoin MXI App

## Overview

This guide explains how the payment integration system works in the Maxcoin MXI mining app. The app now supports multiple payment methods including:

- **Binance Pay** - Cryptocurrency payments via Binance
- **Coinbase Commerce** - Cryptocurrency payments via Coinbase
- **Skrill** - Digital wallet payments
- **Stripe** - Credit/Debit card payments

## Current Implementation (Demo Mode)

The current implementation is a **simulation** that demonstrates the user flow and interface. In production, you'll need to integrate with the actual payment provider APIs.

## File Structure

```
app/
├── purchase.tsx              # Purchase amount selection screen
├── payment-methods.tsx       # Payment method selection screen
contexts/
├── AuthContext.tsx          # Handles purchase completion and balance updates
i18n/
└── translations/
    ├── en.ts                # English translations
    ├── es.ts                # Spanish translations
    └── pt.ts                # Portuguese translations
```

## User Flow

1. User navigates to purchase screen
2. User enters desired MXI amount (10-10000 MXI)
3. User reviews purchase details and mining power increase
4. User clicks "Proceed to Payment"
5. User selects payment method (Binance, Coinbase, Skrill, or Stripe)
6. Payment is processed (currently simulated)
7. User balance and mining power are updated
8. User receives confirmation

## Production Implementation Guide

### 1. Binance Pay Integration

**Documentation:** https://developers.binance.com/docs/binance-pay/introduction

**Steps:**
- Create a Binance Merchant account
- Obtain API credentials (API Key, Secret Key)
- Implement server-side API calls to create orders
- Handle payment callbacks/webhooks

**Example Flow:**
```typescript
// Server-side (Node.js/Express)
const createBinanceOrder = async (amount, userId) => {
  const response = await fetch('https://bpay.binanceapi.com/binancepay/openapi/v2/order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'BinancePay-Timestamp': Date.now(),
      'BinancePay-Nonce': generateNonce(),
      'BinancePay-Certificate-SN': API_KEY,
      'BinancePay-Signature': generateSignature(),
    },
    body: JSON.stringify({
      env: {
        terminalType: 'APP'
      },
      merchantTradeNo: generateTradeNo(),
      orderAmount: calculateUSDAmount(amount),
      currency: 'USDT',
      goods: {
        goodsType: '02',
        goodsCategory: 'Z000',
        referenceGoodsId: 'MXI',
        goodsName: `${amount} MXI`,
      }
    })
  });
  return response.json();
};
```

### 2. Coinbase Commerce Integration

**Documentation:** https://commerce.coinbase.com/docs/

**Steps:**
- Create a Coinbase Commerce account
- Obtain API Key
- Create charges via API
- Handle webhook notifications

**Example Flow:**
```typescript
// Server-side
const createCoinbaseCharge = async (amount, userId) => {
  const response = await fetch('https://api.commerce.coinbase.com/charges', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': COINBASE_API_KEY,
      'X-CC-Version': '2018-03-22'
    },
    body: JSON.stringify({
      name: `${amount} MXI Purchase`,
      description: `Purchase ${amount} Maxcoin MXI`,
      pricing_type: 'fixed_price',
      local_price: {
        amount: calculateUSDAmount(amount),
        currency: 'USD'
      },
      metadata: {
        user_id: userId,
        mxi_amount: amount
      }
    })
  });
  return response.json();
};
```

### 3. Skrill Integration

**Documentation:** https://www.skrill.com/en/business/integration/

**Steps:**
- Create a Skrill Merchant account
- Obtain Merchant ID and Secret Word
- Implement Quick Checkout integration
- Handle status URL callbacks

**Example Flow:**
```typescript
// Server-side
const createSkrillPayment = async (amount, userId) => {
  const params = new URLSearchParams({
    pay_to_email: SKRILL_MERCHANT_EMAIL,
    transaction_id: generateTransactionId(),
    return_url: `${APP_URL}/payment-success`,
    cancel_url: `${APP_URL}/payment-cancel`,
    status_url: `${SERVER_URL}/skrill-webhook`,
    amount: calculateUSDAmount(amount),
    currency: 'USD',
    detail1_description: 'MXI Amount',
    detail1_text: amount.toString(),
    merchant_fields: `user_id,mxi_amount`,
    user_id: userId,
    mxi_amount: amount
  });
  
  return `https://pay.skrill.com?${params.toString()}`;
};
```

### 4. Stripe Integration

**Documentation:** https://stripe.com/docs/payments/accept-a-payment

**Required Package:** `@stripe/stripe-react-native`

**Installation:**
```bash
npx expo install @stripe/stripe-react-native
```

**Steps:**
- Create a Stripe account
- Obtain API keys (Publishable and Secret)
- Implement Payment Intent flow
- Use Stripe Payment Sheet in React Native

**Example Flow:**
```typescript
// Server-side - Create Payment Intent
const createPaymentIntent = async (amount, userId) => {
  const stripe = require('stripe')(STRIPE_SECRET_KEY);
  
  const paymentIntent = await stripe.paymentIntents.create({
    amount: calculateCentsAmount(amount), // Amount in cents
    currency: 'usd',
    metadata: {
      user_id: userId,
      mxi_amount: amount
    }
  });
  
  return {
    clientSecret: paymentIntent.client_secret
  };
};

// Client-side - React Native
import { useStripe } from '@stripe/stripe-react-native';

const processStripePayment = async () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // Get client secret from your server
  const { clientSecret } = await fetchPaymentIntent(amount);
  
  // Initialize payment sheet
  const { error: initError } = await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'Maxcoin MXI',
  });
  
  if (initError) {
    console.error('Error initializing payment sheet:', initError);
    return;
  }
  
  // Present payment sheet
  const { error: presentError } = await presentPaymentSheet();
  
  if (presentError) {
    console.error('Error presenting payment sheet:', presentError);
    return;
  }
  
  // Payment successful
  await purchaseMaxcoin(amount);
};
```

## Backend Requirements

For production, you'll need a backend server to:

1. **Securely store API credentials** - Never expose API keys in the mobile app
2. **Create payment orders/charges** - Generate payment requests via provider APIs
3. **Handle webhooks** - Receive payment status notifications
4. **Verify payments** - Confirm payment completion before crediting user accounts
5. **Update user balances** - Credit MXI to user accounts after successful payment
6. **Log transactions** - Keep records of all payment transactions

### Recommended Backend Stack

- **Node.js + Express** or **Python + Flask/FastAPI**
- **Database:** PostgreSQL or MongoDB
- **Hosting:** AWS, Google Cloud, or Heroku

### Example Backend Endpoints

```
POST /api/payments/binance/create-order
POST /api/payments/coinbase/create-charge
POST /api/payments/skrill/create-session
POST /api/payments/stripe/create-intent

POST /api/webhooks/binance
POST /api/webhooks/coinbase
POST /api/webhooks/skrill
POST /api/webhooks/stripe
```

## Security Considerations

1. **Never store API keys in the app** - Use environment variables on the server
2. **Validate all webhooks** - Verify signatures to prevent fraud
3. **Use HTTPS** - All API calls must use secure connections
4. **Implement rate limiting** - Prevent abuse of payment endpoints
5. **Log all transactions** - Maintain audit trail for compliance
6. **Verify payment amounts** - Always verify on the server side
7. **Handle edge cases** - Implement proper error handling and retries

## Testing

### Test Credentials

Each payment provider offers test/sandbox environments:

- **Binance Pay:** Use testnet environment
- **Coinbase Commerce:** Sandbox mode available
- **Skrill:** Test merchant account
- **Stripe:** Test mode with test cards

### Test Cards (Stripe)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0027 6000 3184
```

## Webhook Implementation

Example webhook handler (Node.js/Express):

```typescript
app.post('/api/webhooks/stripe', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );
    
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { user_id, mxi_amount } = paymentIntent.metadata;
      
      // Credit user account
      await creditUserAccount(user_id, parseFloat(mxi_amount));
      
      // Send confirmation notification
      await sendPaymentConfirmation(user_id, mxi_amount);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});
```

## Compliance & Regulations

When implementing real payment processing:

1. **PCI DSS Compliance** - Required for handling card data
2. **KYC/AML** - Know Your Customer and Anti-Money Laundering checks
3. **Terms of Service** - Clear terms for cryptocurrency purchases
4. **Privacy Policy** - Comply with GDPR, CCPA, etc.
5. **Tax Reporting** - Maintain records for tax purposes

## Support & Resources

- **Binance Pay:** https://developers.binance.com/docs/binance-pay
- **Coinbase Commerce:** https://commerce.coinbase.com/docs/
- **Skrill:** https://www.skrill.com/en/business/integration/
- **Stripe:** https://stripe.com/docs
- **Stripe React Native:** https://github.com/stripe/stripe-react-native

## Next Steps

1. Choose which payment methods to implement first
2. Create merchant accounts with chosen providers
3. Set up backend server infrastructure
4. Implement API integrations on the server
5. Update mobile app to call your backend APIs
6. Test thoroughly in sandbox/test environments
7. Implement webhook handlers
8. Add proper error handling and logging
9. Conduct security audit
10. Deploy to production

## Notes

- The current implementation is for demonstration purposes only
- Real payment processing requires proper backend infrastructure
- Always test thoroughly before going live
- Consider starting with one payment method and expanding gradually
- Ensure compliance with all relevant regulations in your jurisdiction


# Developer Notes - Payment Integration

## Implementation Status

✅ **Completed:**
- Payment method selection UI
- Multi-language support (EN, ES, PT)
- Purchase flow navigation
- Simulated payment processing
- Balance update logic
- Mining power calculation
- Referral commission distribution

⚠️ **Requires Production Implementation:**
- Actual payment provider API integration
- Backend server setup
- Webhook handlers
- Payment verification
- Transaction logging
- Error handling for real payments

## Code Architecture

### Payment Flow Components

1. **`app/purchase.tsx`**
   - Amount selection screen
   - Input validation
   - Mining power preview
   - Referral bonus calculation
   - Navigation to payment methods

2. **`app/payment-methods.tsx`**
   - Payment method selection
   - Order summary display
   - Payment processing simulation
   - Success/error handling

3. **`contexts/AuthContext.tsx`**
   - `purchaseMaxcoin()` function
   - Balance updates
   - Mining power calculation
   - 3-level referral commission distribution

### Key Functions

#### Purchase Flow
```typescript
// 1. User enters amount in purchase.tsx
handleProceedToPayment() {
  router.push({
    pathname: '/payment-methods',
    params: { amount: purchaseAmount.toString() }
  });
}

// 2. User selects payment method in payment-methods.tsx
handlePaymentMethodSelect(method: PaymentMethod) {
  setSelectedMethod(method);
}

// 3. Process payment (currently simulated)
handleProceedToPayment() {
  switch (selectedMethod) {
    case 'binance': await processBinancePayment(); break;
    case 'coinbase': await processCoinbasePayment(); break;
    case 'skrill': await processSkrillPayment(); break;
    case 'stripe': await processStripePayment(); break;
  }
}

// 4. Update user balance and mining power
await purchaseMaxcoin(purchaseAmount);
```

#### Mining Power Calculation
```typescript
// In AuthContext.tsx
const powerIncrease = 
  (totalPurchases / config.powerIncreaseThreshold) * 
  (config.powerIncreasePercent / 100);
  
users[userIndex].miningPower = 1 + powerIncrease;
```

#### Referral Commission Distribution
```typescript
// Level 1 (5% default)
if (users[userIndex].referredBy) {
  const level1Commission = amount * (config.level1Commission / 100);
  users[level1Index].balance += level1Commission;
  
  // Level 2 (2% default)
  if (users[level1Index].referredBy) {
    const level2Commission = amount * (config.level2Commission / 100);
    users[level2Index].balance += level2Commission;
    
    // Level 3 (1% default)
    if (users[level2Index].referredBy) {
      const level3Commission = amount * (config.level3Commission / 100);
      users[level3Index].balance += level3Commission;
    }
  }
}
```

## Translation Keys

All payment-related strings are in `i18n/translations/*.ts`:

```typescript
payment: {
  selectPaymentMethod: string,
  purchasingAmount: string,
  availableMethods: string,
  binanceDescription: string,
  coinbaseDescription: string,
  skrillDescription: string,
  stripeDescription: string,
  // ... more keys
}
```

## Styling

All styles use the centralized color system from `styles/commonStyles.ts`:

```typescript
colors: {
  primary: string,
  secondary: string,
  accent: string,
  success: string,
  danger: string,
  text: string,
  textSecondary: string,
  background: string,
  card: string,
  highlight: string,
}
```

## API Integration Points

### Where to Add Real Payment Processing

#### 1. Binance Pay
```typescript
// In payment-methods.tsx, replace:
const processBinancePayment = async () => {
  // TODO: Replace with actual Binance Pay API call
  const response = await fetch('YOUR_BACKEND_URL/api/payments/binance/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user?.id,
      amount: purchaseAmount,
      currency: 'USDT'
    })
  });
  
  const { orderUrl } = await response.json();
  
  // Open Binance Pay in browser or WebView
  await Linking.openURL(orderUrl);
  
  // Handle callback/webhook on your backend
};
```

#### 2. Coinbase Commerce
```typescript
const processCoinbasePayment = async () => {
  // TODO: Replace with actual Coinbase Commerce API call
  const response = await fetch('YOUR_BACKEND_URL/api/payments/coinbase/create-charge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user?.id,
      amount: purchaseAmount
    })
  });
  
  const { hostedUrl } = await response.json();
  await Linking.openURL(hostedUrl);
};
```

#### 3. Skrill
```typescript
const processSkrillPayment = async () => {
  // TODO: Replace with actual Skrill API call
  const response = await fetch('YOUR_BACKEND_URL/api/payments/skrill/create-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user?.id,
      amount: purchaseAmount
    })
  });
  
  const { paymentUrl } = await response.json();
  await Linking.openURL(paymentUrl);
};
```

#### 4. Stripe
```typescript
import { useStripe } from '@stripe/stripe-react-native';

const processStripePayment = async () => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  
  // TODO: Get client secret from your backend
  const response = await fetch('YOUR_BACKEND_URL/api/payments/stripe/create-intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: user?.id,
      amount: purchaseAmount
    })
  });
  
  const { clientSecret } = await response.json();
  
  await initPaymentSheet({
    paymentIntentClientSecret: clientSecret,
    merchantDisplayName: 'Maxcoin MXI',
  });
  
  const { error } = await presentPaymentSheet();
  
  if (!error) {
    // Payment successful
    await purchaseMaxcoin(purchaseAmount);
  }
};
```

## Backend Requirements

### Required Endpoints

```
POST /api/payments/binance/create-order
  Body: { userId, amount, currency }
  Returns: { orderUrl, orderId }

POST /api/payments/coinbase/create-charge
  Body: { userId, amount }
  Returns: { hostedUrl, chargeId }

POST /api/payments/skrill/create-session
  Body: { userId, amount }
  Returns: { paymentUrl, sessionId }

POST /api/payments/stripe/create-intent
  Body: { userId, amount }
  Returns: { clientSecret, paymentIntentId }

POST /api/webhooks/binance
  Body: Binance webhook payload
  
POST /api/webhooks/coinbase
  Body: Coinbase webhook payload
  
POST /api/webhooks/skrill
  Body: Skrill webhook payload
  
POST /api/webhooks/stripe
  Body: Stripe webhook payload
```

### Webhook Handler Template

```typescript
// Example webhook handler
app.post('/api/webhooks/:provider', async (req, res) => {
  const { provider } = req.params;
  
  // 1. Verify webhook signature
  const isValid = verifyWebhookSignature(provider, req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // 2. Extract payment data
  const { userId, amount, status, transactionId } = extractPaymentData(provider, req.body);
  
  // 3. Update database
  if (status === 'completed') {
    await db.transactions.create({
      userId,
      amount,
      provider,
      transactionId,
      status: 'completed',
      timestamp: new Date()
    });
    
    // 4. Credit user account
    await creditUserAccount(userId, amount);
    
    // 5. Send notification
    await sendPaymentConfirmation(userId, amount);
  }
  
  res.json({ received: true });
});
```

## Testing Checklist

- [ ] Test amount input validation
- [ ] Test quick amount buttons
- [ ] Test navigation flow
- [ ] Test payment method selection
- [ ] Test all 4 payment methods
- [ ] Test balance update
- [ ] Test mining power calculation
- [ ] Test referral commission distribution (3 levels)
- [ ] Test translations (EN, ES, PT)
- [ ] Test error handling
- [ ] Test with different user scenarios
- [ ] Test with edge cases (min/max amounts)

## Known Limitations

1. **No Real Payment Processing** - Currently simulated
2. **No Transaction History** - Not implemented yet
3. **No Payment Verification** - No backend verification
4. **No Refund System** - Not implemented
5. **No Payment Retry Logic** - Not implemented
6. **No Offline Support** - Requires internet connection

## Future Enhancements

- [ ] Add transaction history screen
- [ ] Implement payment status tracking
- [ ] Add payment receipt generation
- [ ] Implement refund system
- [ ] Add payment retry logic
- [ ] Add more payment methods (PayPal, Apple Pay, Google Pay)
- [ ] Implement payment analytics
- [ ] Add promotional codes/discounts
- [ ] Implement subscription model
- [ ] Add payment reminders

## Performance Considerations

- Payment method icons are loaded from IconSymbol (no external images)
- Minimal re-renders using proper state management
- Efficient navigation using Expo Router
- Optimized translations with i18n-js

## Security Notes

⚠️ **IMPORTANT:**
- Never store API keys in the mobile app
- Always validate payments on the server
- Use HTTPS for all API calls
- Implement proper authentication
- Validate webhook signatures
- Log all transactions
- Implement rate limiting
- Use secure storage for sensitive data

## Debugging Tips

```typescript
// Enable detailed logging
console.log('Payment method selected:', selectedMethod);
console.log('Purchase amount:', purchaseAmount);
console.log('User ID:', user?.id);
console.log('Mining power before:', user?.miningPower);
console.log('Mining power after:', newMiningPower);
```

## Contact & Support

For questions about the payment integration:
- Review PAYMENT_INTEGRATION_GUIDE.md
- Check provider documentation
- Test in sandbox environments first
- Implement proper error logging

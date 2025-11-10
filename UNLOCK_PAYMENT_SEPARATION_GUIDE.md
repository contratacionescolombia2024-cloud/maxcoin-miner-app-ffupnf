
# Unlock Payment Separation Guide

## Overview

The payment system has been restructured to separate the **100 USDT unlock payment** from **mining power purchases**. This provides clearer distinction between unlocking features and boosting mining capabilities.

## Payment Types

### 1. Unlock Payment (100 USDT)
- **Purpose**: One-time payment to unlock Mining and Lottery features
- **Cost**: 100 USDT (fixed)
- **What You Get**:
  - Access to Mining Panel
  - Access to Lottery (MXILUCKY)
  - MXI equivalent to 100 USDT added to balance
  - Permanent unlock (no expiration)
- **Screen**: `/unlock-payment`
- **Database Field**: `users.unlock_payment_made`

### 2. Mining Power Purchases
- **Purpose**: Increase mining rate and boost earnings
- **Cost**: Any amount in USDT
- **Effect**: 1% mining power increase per 10 USDT spent
- **Duration**: 30 days from purchase date
- **Screen**: `/purchase` → `/payment-methods`
- **Database Field**: `users.total_purchases`

### 3. Mining Package (100 USDT)
- **Purpose**: Rent mining access for 30 days
- **Cost**: 100 USDT per 30-day period
- **Requirement**: Must have made unlock payment first
- **Screen**: `/mining-access-purchase`
- **Context**: `MiningAccessContext`

## User Flow

### New User Journey

1. **Register & Login**
   - User creates account
   - Email verification required
   - `unlock_payment_made = false`

2. **Home Screen**
   - Sees prominent "Unlock All Features" card
   - Can view balance and basic info
   - Mining and Lottery are locked

3. **Make Unlock Payment**
   - Navigate to `/unlock-payment`
   - Pay 100 USDT via Binance Pay
   - Receive MXI equivalent
   - `unlock_payment_made = true`
   - Mining and Lottery features unlocked

4. **Access Mining Panel**
   - Now can access `/mining-panel`
   - Purchase mining package (100 USDT for 30 days)
   - Can boost mining power with additional USDT

5. **Access Lottery**
   - Now can access `/mxilucky`
   - Purchase lottery tickets with MXI
   - Participate in weekly draws

## Database Changes

### New Fields in `users` Table

```sql
-- Tracks the mandatory 100 USDT unlock payment
unlock_payment_made BOOLEAN DEFAULT FALSE

-- Records when unlock payment was made
unlock_payment_date TIMESTAMP WITH TIME ZONE
```

### Field Purposes

- `unlock_payment_made`: Controls access to Mining and Lottery features
- `has_first_purchase`: Tracks any purchase for referral system
- `total_purchases`: Sum of all mining power purchases (USDT)
- `has_mining_access`: Tracks if user has active mining package

## Code Changes

### AuthContext Updates

**New Function**: `recordUnlockPayment()`
- Sets `unlock_payment_made = true`
- Records `unlock_payment_date`
- Separate from `recordFirstPurchase()`

**Updated Interface**: `User`
- Added `unlockPaymentMade?: boolean`
- Added `unlockPaymentDate?: string`

### Screen Updates

#### `/unlock-payment` (NEW)
- Dedicated screen for 100 USDT unlock payment
- Shows benefits of unlocking
- Processes payment via Binance Pay
- Adds MXI to user balance
- Records unlock payment

#### `/mxilucky`
- Changed check from `hasFirstPurchase` to `unlockPaymentMade`
- Shows locked state if unlock payment not made
- Directs users to `/unlock-payment`

#### `/mining-panel`
- Changed check from `hasFirstPurchase` to `unlockPaymentMade`
- Shows locked state if unlock payment not made
- Directs users to `/unlock-payment`

#### `/payment-methods`
- Removed unlock logic
- Now only for mining power purchases
- Shows notice if unlock payment not made

#### `/(tabs)/(home)/index`
- Added unlock notice card if `unlockPaymentMade = false`
- Prominent call-to-action to make unlock payment

## Access Control Logic

### Before (Old System)
```typescript
// Mining and Lottery unlocked by first purchase >= 100 USDT
if (user.hasFirstPurchase) {
  // Allow access
}
```

### After (New System)
```typescript
// Mining and Lottery unlocked by dedicated unlock payment
if (user.unlockPaymentMade) {
  // Allow access to Mining and Lottery
}

// Mining power purchases are separate
if (usdAmount > 0) {
  // Increase mining power by 1% per 10 USDT
  // Valid for 30 days
}
```

## User Benefits

### Clarity
- Clear separation between unlock and power purchases
- Users understand what each payment does
- No confusion about feature access

### Flexibility
- Can unlock features without committing to mining package
- Can purchase mining power in any amount
- Mining package is separate 30-day rental

### Transparency
- One-time unlock payment is clearly stated
- Mining power purchases are ongoing
- All costs are upfront and clear

## Migration

Existing users with `total_purchases >= 100` are automatically migrated:
```sql
UPDATE users 
SET unlock_payment_made = TRUE, 
    unlock_payment_date = created_at
WHERE total_purchases >= 100 AND unlock_payment_made = FALSE;
```

## Testing Checklist

- [ ] New user cannot access Mining without unlock payment
- [ ] New user cannot access Lottery without unlock payment
- [ ] Unlock payment screen processes 100 USDT correctly
- [ ] Unlock payment adds MXI to balance
- [ ] Unlock payment sets `unlock_payment_made = true`
- [ ] Mining power purchases work independently
- [ ] Mining package purchase requires unlock payment first
- [ ] Home screen shows unlock notice when needed
- [ ] Existing users with purchases >= 100 USDT are migrated
- [ ] Referral system still tracks `hasFirstPurchase` correctly

## Summary

The payment system now has three distinct types:

1. **Unlock Payment** (100 USDT) - One-time, unlocks features
2. **Mining Power** (Any USDT) - Boosts mining rate, 30 days
3. **Mining Package** (100 USDT) - Rents mining access, 30 days

This separation provides clarity, flexibility, and better user experience.

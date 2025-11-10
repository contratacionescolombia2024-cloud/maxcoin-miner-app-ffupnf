
# Lottery Access Control Guide

## Overview
The MXILUCKY lottery feature is locked until users make their first purchase of at least 100 USDT. This ensures that only committed users can participate in the lottery system.

## Access Requirements

### Unlocking Lottery Access
Users must complete ONE of the following to unlock lottery features:

1. **Mining Access Purchase (100 USDT)**
   - Purchase the initial mining package for 100 USDT via Binance Pay
   - This unlocks BOTH mining and lottery features
   - Valid for 30 days (renewable)

2. **MXI Purchase (100 USDT minimum)**
   - Purchase at least 100 USDT worth of MXI via Binance Pay
   - This unlocks BOTH mining and lottery features
   - MXI can be used immediately for lottery tickets

## How It Works

### First Purchase Tracking
- The system tracks the `hasFirstPurchase` flag in the user's profile
- When a user makes a purchase of 100 USDT or more, this flag is set to `true`
- The flag is stored in the database (`public.users.has_first_purchase`)
- Once unlocked, access to lottery is permanent (not time-limited)

### Lottery Ticket Purchases
Once unlocked, users can:
- Purchase lottery tickets using MXI from their balance
- Each ticket costs 1 MXI (configurable by admin)
- Tickets are purchased for the next scheduled draw (every Friday at 20:00 UTC)
- Payments are deducted from the user's MXI balance

### Prize Distribution
- Prize pool is collected from all ticket sales
- 90% goes to winners, 10% to admin (configurable)
- 4 winners per draw with distribution:
  - 1st Place: 50% of prize pool
  - 2nd Place: 30% of prize pool
  - 3rd Place: 15% of prize pool
  - 4th Place: 5% of prize pool
- Winners receive MXI directly to their balance

## Implementation Details

### Database Schema
```sql
-- User table includes first purchase tracking
CREATE TABLE users (
  id UUID PRIMARY KEY,
  has_first_purchase BOOLEAN DEFAULT FALSE,
  -- other fields...
);
```

### Key Functions

#### Recording First Purchase
```typescript
// In AuthContext.tsx
const recordFirstPurchase = async (usdAmount: number) => {
  if (!user.hasFirstPurchase && usdAmount >= 100) {
    await supabase
      .from('users')
      .update({ has_first_purchase: true })
      .eq('id', user.id);
    
    console.log('First purchase recorded - Lottery unlocked');
  }
};
```

#### Checking Lottery Access
```typescript
// In mxilucky.tsx
if (!user?.hasFirstPurchase) {
  // Show locked screen with instructions
  return <LockedLotteryScreen />;
}
```

### Payment Flow Integration

#### MXI Purchase Flow
1. User selects USDT amount to purchase MXI
2. User proceeds to payment via Binance Pay
3. Payment is processed (simulated)
4. MXI is added to user's balance
5. `recordFirstPurchase(usdValue)` is called
6. If usdValue >= 100, lottery is unlocked

#### Mining Access Purchase Flow
1. User purchases mining access for 100 USDT
2. Payment is processed via Binance Pay
3. Mining access is granted for 30 days
4. `recordFirstPurchase(100)` is called
5. Lottery is unlocked

## User Experience

### Before First Purchase
- Lottery screen shows locked state with:
  - Lock icon
  - Clear explanation of requirements
  - "Purchase MXI Now" button
  - List of benefits after unlocking

### After First Purchase
- Full lottery interface is accessible
- Users can purchase tickets with MXI
- Users can view their tickets
- Users can see prize pool and draw information
- Users can track their winning probability

## Admin Configuration

Admins can configure lottery settings via the admin panel:
- Ticket price (default: 1 MXI)
- Minimum tickets for draw (default: 1000)
- Number of winners (default: 4)
- Prize pool percentage (default: 90%)
- Admin percentage (default: 10%)
- Draw day and time

## Security Considerations

1. **First Purchase Verification**
   - Flag is stored in database, not local storage
   - Cannot be manipulated by client
   - Verified on every lottery access attempt

2. **Balance Checks**
   - Ticket purchases verify sufficient MXI balance
   - Transactions are atomic to prevent race conditions
   - All purchases are logged in transaction history

3. **RLS Policies**
   - Row Level Security enabled on all tables
   - Users can only access their own data
   - Admin has elevated privileges

## Testing Checklist

- [ ] New user cannot access lottery before first purchase
- [ ] User can unlock lottery with 100 USDT MXI purchase
- [ ] User can unlock lottery with 100 USDT mining access purchase
- [ ] Lottery remains unlocked after first purchase
- [ ] Ticket purchases deduct MXI from balance
- [ ] Prize distribution works correctly
- [ ] Admin can configure lottery settings
- [ ] Locked screen shows correct information

## Future Enhancements

Potential improvements:
- Email notification when lottery is unlocked
- Push notification for draw results
- Lottery history and statistics
- Multiple lottery tiers with different ticket prices
- Bonus tickets for large purchases

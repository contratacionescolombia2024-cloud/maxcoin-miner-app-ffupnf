
# USDT Payment Integration Guide - Maxcoin MXI

## Overview
This guide documents the streamlined USDT payment system for the Maxcoin MXI mining platform. All payments are now processed exclusively through Binance Pay.

## Key Changes Implemented

### 1. Simplified Payment Flow
- **Removed**: Coinbase, Skrill, and PayPal payment options
- **Active**: Only Binance Pay is available for all transactions
- **Initial Package**: 100 USDT (unlocks Mining and Lottery features)
- **Mining Power Purchases**: Paid in USDT via Binance

### 2. Mining Access Purchase
- **Cost**: 100 USDT
- **Duration**: 30 days
- **Payment Method**: Binance Pay only
- **Benefits**:
  - Earn MXI through mining (0.00002 MXI/min base rate)
  - Increase mining power with USDT purchases
  - Earn referral commissions (3-level system)
  - Access to withdrawal system
  - 30-day mining power rental

### 3. Database Structure

#### Users Table
```sql
- id (uuid, primary key)
- username (text, unique)
- email (text, unique)
- email_verified (boolean, default: false)
- balance (numeric, default: 0)
- mining_power (numeric, default: 1)
- referral_code (text, unique)
- referred_by (uuid, foreign key to users)
- referral_earnings (numeric, default: 0)
- total_purchases (numeric, default: 0)
- unique_identifier (text, unique)
- is_blocked (boolean, default: false)
- has_mining_access (boolean, default: false)
- has_first_purchase (boolean, default: false)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Withdrawal Restrictions Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users, unique)
- purchased_amount (numeric, default: 0)
- mining_earnings (numeric, default: 0)
- commission_earnings (numeric, default: 0)
- last_withdrawal_date (timestamptz)
- withdrawal_count (integer, default: 0)
- can_withdraw_earnings (boolean, default: false)
- earnings_withdrawal_cycle_start (timestamptz)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Transactions Table
```sql
- id (uuid, primary key)
- transaction_id (text, unique)
- user_id (uuid, foreign key to users)
- type (text: 'transfer', 'purchase', 'mining', 'commission', 'withdrawal')
- amount (numeric)
- usd_value (numeric)
- from_user_id (uuid, foreign key to users)
- to_user_id (uuid, foreign key to users)
- from_identifier (text)
- to_identifier (text)
- commission (numeric)
- commission_rate (numeric)
- description (text)
- status (text: 'pending', 'completed', 'failed')
- platform (text)
- address (text)
- created_at (timestamptz)
```

#### Withdrawal Addresses Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- platform (text)
- address (text)
- created_at (timestamptz)
- updated_at (timestamptz)
```

#### Binance Withdrawals Table
```sql
- id (uuid, primary key)
- user_id (uuid, foreign key to users)
- transaction_id (uuid, foreign key to transactions)
- binance_order_id (text)
- amount (numeric)
- address (text)
- network (text, default: 'BSC')
- status (text: 'pending', 'processing', 'completed', 'failed')
- binance_response (jsonb)
- created_at (timestamptz)
- updated_at (timestamptz)
```

### 4. Admin User
- **Email**: contratacionescolombia2024@gmail.com
- **Username**: admin
- **Permissions**: Full access to all features
- **Status**: Email verified, mining access enabled, first purchase completed

### 5. User Registration Flow
1. User enters username, email, password, and optional referral code
2. System creates Supabase Auth account
3. Email verification link sent to user
4. User profile created in database with:
   - Unique referral code
   - Unique identifier (MXI-XXXXXX format)
   - Default balance: 0
   - Default mining power: 1
   - Mining access: false (until first purchase)
   - First purchase: false (until 100 USDT purchase)

### 6. First Purchase (100 USDT)
When a user makes their first purchase of at least 100 USDT:
- `has_first_purchase` flag set to true
- Mining features unlocked
- Lottery features unlocked
- User can now purchase mining access package

### 7. Mining Power Calculation
```javascript
Mining Power = 1 + (Total Purchases / 10) * 0.01
```
- Base mining power: 1x
- Increases with USDT purchases
- Formula: For every 10 USDT spent, mining power increases by 1%

### 8. Withdrawal System
Three categories of MXI:
1. **Purchased/Transferred MXI**: Always available for withdrawal
2. **Commission Earnings**: Immediately withdrawable
3. **Mining Earnings**: Restricted until requirements met
   - Requires 10 active referrals with purchases
   - Applies to first 5 withdrawals only

### 9. Payment Flow

#### MXI Purchase Flow
1. User navigates to Purchase screen
2. Enters USDT amount
3. System calculates MXI equivalent
4. User proceeds to Payment Methods screen
5. Only Binance Pay is shown as available
6. User confirms payment
7. System processes payment via Binance
8. MXI added to user balance
9. If first purchase ≥ 100 USDT, mining/lottery unlocked

#### Mining Access Purchase Flow
1. User navigates to Mining Panel
2. If no first purchase, shown locked screen
3. After first purchase, can buy mining access
4. Cost: 100 USDT via Binance Pay
5. Duration: 30 days
6. User confirms purchase
7. System processes payment
8. Mining access activated
9. User can start mining

### 10. Security Features
- Row Level Security (RLS) enabled on all tables
- Email verification required before login
- Blocked users cannot log in
- Admin-only access to configuration
- Secure password storage via Supabase Auth
- Transaction validation on server side

### 11. Edge Functions

#### transfer-mxi
Handles MXI transfers between users with commission distribution.

#### binance-withdraw
Processes withdrawals to Binance wallets with eligibility validation.

## Testing the System

### Test Admin Login
1. Email: contratacionescolombia2024@gmail.com
2. Password: (Set via Supabase Auth dashboard)
3. Admin has full access to all features

### Test New User Registration
1. Register with valid email
2. Verify email via link
3. Login with credentials
4. Make first purchase (100 USDT minimum)
5. Mining and Lottery features unlock
6. Purchase mining access package
7. Start mining

## Important Notes

- All payments are in USDT via Binance Pay
- Mining power rental is 30 days
- Base mining rate: 0.00002 MXI per minute
- Mining power increases with purchases
- Referral system: 3 levels (50%, 30%, 20%)
- First 5 withdrawals of mining earnings require 10 active referrals
- Commission earnings are always withdrawable
- Purchased MXI is always withdrawable

## Future Enhancements
- Real Binance API integration (currently simulated)
- Additional payment methods (if needed)
- Enhanced admin dashboard
- Automated mining calculations
- Real-time price updates
- Push notifications for transactions

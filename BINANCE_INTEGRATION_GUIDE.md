
# Binance Integration Guide for Maxcoin MXI

This guide explains how the Binance payment and withdrawal integration works in the Maxcoin MXI application.

## Overview

The application now supports:
- **Real-time MXI/USD exchange rates** from Binance
- **Database-backed MXI transfers** between users using unique referral codes
- **Binance withdrawals** through Supabase Edge Functions
- **Secure transaction tracking** with unique transaction IDs

## Architecture

### Database Schema

The application uses Supabase PostgreSQL with the following tables:

#### 1. `users` Table
Stores user profiles and balances:
- `id` (UUID): User ID (linked to Supabase Auth)
- `username` (TEXT): Unique username
- `email` (TEXT): User email
- `balance` (DECIMAL): Current MXI balance
- `referral_code` (TEXT): Unique referral code for receiving transfers
- `unique_identifier` (TEXT): Unique user identifier (MXI-XXXXX format)
- `has_first_purchase` (BOOLEAN): Tracks if user made 100 USDT purchase

#### 2. `transactions` Table
Records all transactions:
- `transaction_id` (TEXT): Unique transaction identifier
- `type` (TEXT): transfer, purchase, mining, commission, withdrawal
- `amount` (DECIMAL): Transaction amount
- `usd_value` (DECIMAL): USD value at time of transaction
- `from_user_id` / `to_user_id` (UUID): Sender and recipient
- `status` (TEXT): pending, completed, failed

#### 3. `withdrawal_restrictions` Table
Tracks withdrawal eligibility:
- `purchased_amount` (DECIMAL): Immediately withdrawable
- `commission_earnings` (DECIMAL): Immediately withdrawable
- `mining_earnings` (DECIMAL): Requires 10 active referrals

#### 4. `binance_withdrawals` Table
Tracks Binance withdrawal requests:
- `binance_order_id` (TEXT): Binance transaction ID
- `amount` (DECIMAL): Withdrawal amount
- `address` (TEXT): Recipient wallet address
- `network` (TEXT): Blockchain network (BSC)
- `status` (TEXT): pending, processing, completed, failed

### Edge Functions

#### 1. `transfer-mxi`
Handles MXI transfers between users:

**Endpoint:** `/functions/v1/transfer-mxi`

**Request:**
```json
{
  "recipientCode": "ABC123XYZ",
  "amount": 10.5,
  "usdValue": 525.0,
  "description": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "TXN-123456789",
  "amount": 10.5,
  "recipientReceives": 9.45,
  "commission": 1.05,
  "commissionRate": 10,
  "recipient": {
    "username": "john_doe",
    "uniqueIdentifier": "MXI-JO123ABC"
  },
  "commissions": [
    { "level": 1, "amount": 0.525, "user": "referrer1" },
    { "level": 2, "amount": 0.315, "user": "referrer2" },
    { "level": 3, "amount": 0.21, "user": "referrer3" }
  ]
}
```

**Features:**
- Validates sender balance
- Finds recipient by referral code
- Deducts 10% commission
- Distributes commissions to 3-level referral chain (50%, 30%, 20%)
- Updates withdrawal restrictions (received MXI is immediately withdrawable)
- Creates transaction records for all parties

#### 2. `binance-withdraw`
Processes withdrawals to Binance:

**Endpoint:** `/functions/v1/binance-withdraw`

**Request:**
```json
{
  "amount": 5.0,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "network": "BSC"
}
```

**Response:**
```json
{
  "success": true,
  "transactionId": "WTH-123456789",
  "binanceOrderId": "BINANCE-1234567890",
  "amount": 5.0,
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "network": "BSC",
  "status": "pending",
  "message": "Withdrawal initiated successfully. Processing time: 24-48 hours."
}
```

**Features:**
- Validates withdrawal eligibility
- Checks withdrawal restrictions
- Creates withdrawal record
- Updates user balance
- Tracks withdrawal in `binance_withdrawals` table
- Returns unique transaction ID

## User Flow

### MXI Transfer Flow

1. **User initiates transfer:**
   - Enters recipient's referral code
   - Specifies amount to send
   - Adds optional description

2. **System validates:**
   - Checks sender balance
   - Verifies recipient exists
   - Calculates commission (10%)
   - Shows preview with real-time USD value

3. **Transfer executes:**
   - Deducts from sender balance
   - Credits recipient (amount - commission)
   - Distributes commission to referral chain
   - Creates transaction records
   - Updates withdrawal restrictions

4. **Confirmation:**
   - Shows transaction ID
   - Displays amounts and USD values
   - Lists commission distribution

### Binance Withdrawal Flow

1. **User initiates withdrawal:**
   - Selects Binance platform
   - Enters withdrawal amount
   - Provides BSC wallet address

2. **System validates:**
   - Checks minimum amount (0.1 MXI)
   - Verifies sufficient balance
   - Checks withdrawal eligibility
   - Calculates network fee

3. **Withdrawal processes:**
   - Calls `binance-withdraw` Edge Function
   - Creates withdrawal record
   - Updates user balance
   - Updates withdrawal restrictions

4. **Confirmation:**
   - Shows transaction ID
   - Displays processing time (24-48 hours)
   - Provides tracking information

## Withdrawal Restrictions

The system implements three categories of MXI:

### 1. Purchased Amount (Immediately Withdrawable)
- MXI purchased with USDT
- MXI received from transfers
- No restrictions

### 2. Commission Earnings (Immediately Withdrawable)
- Earnings from referral commissions
- Earnings from transfer commissions
- No restrictions

### 3. Mining Earnings (Restricted)
- Earnings from mining activity
- Requires 10 active referrals with purchases
- Checked per withdrawal cycle

## Binance API Integration (Production)

For production deployment, you need to:

### 1. Get Binance API Credentials
- Create a Binance account
- Generate API Key and Secret
- Enable withdrawal permissions
- Whitelist IP addresses

### 2. Set Environment Variables
In Supabase Dashboard → Edge Functions → Secrets:
```
BINANCE_API_KEY=your_api_key_here
BINANCE_API_SECRET=your_api_secret_here
```

### 3. Implement Binance Withdraw API
Update `binance-withdraw` Edge Function to call:
```
POST https://api.binance.com/sapi/v1/capital/withdraw/apply
```

**Required Parameters:**
- `coin`: MXI
- `network`: BSC
- `address`: Recipient wallet address
- `amount`: Withdrawal amount
- `timestamp`: Current timestamp
- `signature`: HMAC SHA256 signature

### 4. Handle Binance Responses
- Success: Store `id` as `binance_order_id`
- Error: Update status to 'failed' and log error
- Pending: Poll status endpoint for updates

## Security Considerations

### 1. Row Level Security (RLS)
All tables have RLS policies:
- Users can only view/update their own data
- Transactions are visible to involved parties
- Admin access requires special permissions

### 2. Transaction Validation
- All amounts validated server-side
- Balance checks before deductions
- Atomic database operations
- Rollback on errors

### 3. API Security
- JWT authentication required
- Rate limiting on Edge Functions
- IP whitelisting for Binance API
- Encrypted API credentials

### 4. Withdrawal Security
- Minimum withdrawal amounts
- Address validation
- Confirmation emails
- Transaction tracking

## Testing

### Test MXI Transfer
1. Create two test users
2. Note their referral codes
3. Fund sender account
4. Execute transfer using recipient's code
5. Verify balances updated
6. Check transaction records
7. Verify commission distribution

### Test Binance Withdrawal
1. Create test user with balance
2. Enter test BSC address
3. Initiate withdrawal
4. Check `binance_withdrawals` table
5. Verify balance deducted
6. Check transaction status

## Monitoring

### Key Metrics to Track
- Total MXI transferred
- Total withdrawals processed
- Failed transactions
- Average processing time
- Commission distribution

### Database Queries

**Total transfers today:**
```sql
SELECT COUNT(*), SUM(amount)
FROM transactions
WHERE type = 'transfer'
AND created_at >= CURRENT_DATE;
```

**Pending withdrawals:**
```sql
SELECT *
FROM binance_withdrawals
WHERE status = 'pending'
ORDER BY created_at DESC;
```

**User withdrawal eligibility:**
```sql
SELECT u.username, wr.*
FROM users u
JOIN withdrawal_restrictions wr ON u.id = wr.user_id
WHERE wr.can_withdraw_earnings = false;
```

## Troubleshooting

### Transfer Failed
- Check sender balance
- Verify recipient referral code
- Check database connection
- Review Edge Function logs

### Withdrawal Failed
- Verify Binance API credentials
- Check withdrawal restrictions
- Validate wallet address format
- Review network selection (BSC)

### Commission Not Distributed
- Check referral chain exists
- Verify referrer accounts active
- Review transaction logs
- Check withdrawal_restrictions updates

## Future Enhancements

1. **Additional Platforms:**
   - Coinbase integration
   - Skrill integration
   - PayPal integration

2. **Advanced Features:**
   - Scheduled withdrawals
   - Batch transfers
   - Multi-currency support
   - Automatic exchange rate updates

3. **Analytics:**
   - Transaction dashboard
   - Withdrawal reports
   - Commission tracking
   - User activity metrics

## Support

For issues or questions:
- Check Edge Function logs in Supabase Dashboard
- Review database transaction records
- Contact: contratacionescolombia2024@gmail.com

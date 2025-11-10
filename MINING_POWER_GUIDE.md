
# Mining Power Purchase Guide

## Overview
The Maxcoin MXI mining system allows users to increase their mining power through USDT purchases. Mining power directly affects the rate at which users mine MXI tokens.

## Initial Mining Rate
- **Base Mining Rate**: 0.00002 MXI per minute
- **Initial Mining Power**: 1.0x (multiplier)
- **Effective Rate**: 0.00002 × 1.0 = 0.00002 MXI/minute

## Mining Power Upgrades

### How It Works
1. Users purchase MXI tokens using USDT
2. Each purchase increases their mining power multiplier
3. Mining power is calculated based on total purchases
4. Higher mining power = faster MXI mining rate

### Power Calculation Formula
```
Mining Power = 1 + (Total Purchases / Power Increase Threshold) × (Power Increase Percent / 100)
```

### Default Configuration
- **Power Increase Threshold**: 10 MXI
- **Power Increase Percent**: 1%
- **Example**: For every 10 MXI purchased, mining power increases by 1%

### Examples

#### Example 1: Small Purchase
- Purchase: 10 MXI
- Power Increase: (10 / 10) × (1 / 100) = 0.01
- New Mining Power: 1.0 + 0.01 = 1.01x
- New Mining Rate: 0.00002 × 1.01 = 0.00002020 MXI/minute

#### Example 2: Medium Purchase
- Purchase: 100 MXI
- Power Increase: (100 / 10) × (1 / 100) = 0.10
- New Mining Power: 1.0 + 0.10 = 1.10x
- New Mining Rate: 0.00002 × 1.10 = 0.00002200 MXI/minute

#### Example 3: Large Purchase
- Purchase: 1000 MXI
- Power Increase: (1000 / 10) × (1 / 100) = 1.00
- New Mining Power: 1.0 + 1.00 = 2.00x
- New Mining Rate: 0.00002 × 2.00 = 0.00004000 MXI/minute

## Purchase Limits
- **Minimum Purchase**: 0.02 MXI
- **Maximum Purchase**: 10,000 MXI per transaction
- **Quick Purchase Options**: 0.02, 0.2, 2.0, 200 MXI

## Mining Access Requirements

### First Purchase Requirement
- Users must make an initial purchase of **100 USDT** to unlock:
  - Mining features
  - Lottery features
  - Full platform access

### Mining Package
- **Cost**: 100 USDT
- **Duration**: 30 days (rental period)
- **Renewable**: Yes, can be renewed before expiry
- **Benefits**: Activates mining capability

## USDT to Mining Power Flow

### Step 1: Purchase MXI with USDT
1. User navigates to Purchase screen
2. Enters desired MXI amount
3. Selects payment method (Binance, etc.)
4. Completes USDT payment
5. Receives MXI tokens in balance

### Step 2: Mining Power Calculation
1. System calculates total purchases
2. Applies power increase formula
3. Updates user's mining power multiplier
4. New mining rate takes effect immediately

### Step 3: Mining Earnings
1. User's mining rate = Base Rate × Mining Power
2. Earnings accumulate per minute
3. Stored in user's balance
4. Subject to withdrawal restrictions

## Withdrawal System

### Available for Immediate Withdrawal
- **Purchased MXI**: Always available
- **Commission Earnings**: Always available

### Restricted Withdrawals
- **Mining Earnings**: Requires 10 active referrals with purchases
- **Applies to**: First 5 withdrawals only
- **After 5 withdrawals**: Mining earnings freely withdrawable

## Referral Commission Structure

### Commission Rates
- **Level 1**: 5% of purchase amount
- **Level 2**: 2% of purchase amount
- **Level 3**: 1% of purchase amount

### Example Commission Distribution
For a 100 MXI purchase:
- Level 1 Referrer: 5 MXI
- Level 2 Referrer: 2 MXI
- Level 3 Referrer: 1 MXI

## Admin Configuration

Administrators can adjust the following parameters:
- Mining rate per minute
- Minimum/maximum purchase amounts
- Power increase percentage
- Power increase threshold
- Commission rates (Level 1, 2, 3)

## Technical Implementation

### Database Tables
- `users`: Stores user data including mining_power
- `transactions`: Records all purchases and earnings
- `withdrawal_restrictions`: Tracks withdrawal eligibility
- `mining_access`: Manages 30-day rental periods

### Key Functions
- `purchaseMaxcoin()`: Processes MXI purchases
- `updateBalance()`: Updates user balance and restrictions
- `recordFirstPurchase()`: Unlocks mining/lottery features
- `canWithdrawAmount()`: Validates withdrawal eligibility

## Best Practices

### For Users
1. Start with the 100 USDT first purchase to unlock features
2. Purchase mining access (100 USDT) to activate mining
3. Make regular purchases to increase mining power
4. Build referral network for commission earnings
5. Monitor mining power and renewal dates

### For Administrators
1. Monitor mining rate to ensure sustainability
2. Adjust power increase parameters based on economics
3. Review withdrawal restrictions regularly
4. Track total mining output vs. purchases
5. Maintain balanced commission structure

## Security Considerations

### Purchase Validation
- All purchases validated server-side
- USDT payments processed through Binance API
- Transaction records immutable
- Balance updates atomic

### Withdrawal Protection
- RLS policies enforce user-specific access
- Withdrawal eligibility checked before processing
- Mining earnings restrictions prevent abuse
- Commission earnings immediately available

## Support and Troubleshooting

### Common Issues
1. **Mining not active**: Check if first purchase completed
2. **Low mining rate**: Increase mining power through purchases
3. **Cannot withdraw**: Verify withdrawal restrictions
4. **Access expired**: Renew 30-day mining package

### Contact Support
For issues with USDT purchases or mining power calculations, contact the admin team.

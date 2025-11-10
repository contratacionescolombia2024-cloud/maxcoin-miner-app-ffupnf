
# USDT Purchase System Update Guide

## Overview
This document describes the updated mining power purchase system that uses USDT payments with a 30-day validity period.

## Key Changes

### 1. Enhanced Login Error Messages
The login screen now provides detailed, actionable error messages to help users understand why login failed:

- **Email Not Verified**: Clear instructions to check inbox and verify email
- **Invalid Credentials**: Guidance on checking email spelling and password case-sensitivity
- **Account Blocked**: Contact information for support
- **Account Not Found**: Option to register or contact support
- **Connection Errors**: Instructions to check internet connection

### 2. Updated Mining Power Calculation
**New Formula**: 1% mining power increase per 10 USDT spent

**Example Calculations**:
- 10 USDT = +0.01x (1%) mining power
- 50 USDT = +0.05x (5%) mining power
- 100 USDT = +0.10x (10%) mining power
- 1,000 USDT = +1.00x (100%) mining power
- 10,000 USDT = +10.00x (1000%) mining power

**Formula**: `Mining Power Increase = (USDT Amount / 10) * 0.01`

### 3. Updated Quick Purchase Options
Changed from MXI amounts to USDT amounts:

**New Quick Options**:
- 1 USDT
- 5 USDT
- 10 USDT
- 100 USDT
- 1,000 USDT

### 4. Custom USDT Input
Users can now enter custom amounts:
- **Minimum**: 1 USDT
- **Maximum**: 10,000 USDT
- Real-time validation with error messages
- Clear min/max indicators

### 5. 30-Day Validity Period
All mining power purchases are now clearly marked as valid for 30 days:

**Key Points**:
- Mining power boost lasts 30 days from purchase date
- After 30 days, users can renew or purchase additional power
- Renewal reminders appear when 7 days or less remain
- Multiple purchases stack and all expire after 30 days

### 6. Updated UI Text
All references updated from "MXI purchase" to "USDT payment":
- Purchase screens show USDT amounts
- Payment method clearly states "Binance Pay - USDT"
- Duration warnings prominently displayed
- Mining panel shows USDT costs

## User Flow

### First-Time User
1. Register account and verify email
2. Make first purchase of at least 100 USDT to unlock mining
3. Purchase initial mining package (100 USDT for 30 days)
4. Optionally purchase additional mining power (1-10,000 USDT)
5. Start mining with boosted power for 30 days

### Returning User
1. Check days remaining on current mining access
2. Purchase additional mining power to boost rate (1-10,000 USDT)
3. Renew access when approaching expiration (7 days warning)
4. Continue mining with accumulated power

## Technical Implementation

### Configuration Updates
```typescript
const DEFAULT_CONFIG: MiningConfig = {
  miningRatePerMinute: 0.00002,
  minPurchase: 1, // 1 USDT minimum
  maxPurchase: 10000, // 10,000 USDT maximum
  powerIncreasePercent: 1, // 1% increase
  powerIncreaseThreshold: 10, // per 10 USDT
  level1Commission: 5,
  level2Commission: 2,
  level3Commission: 1,
};
```

### Mining Power Calculation
```typescript
const miningPowerIncrease = (usdtAmount / 10) * 0.01;
const newMiningPower = currentMiningPower + miningPowerIncrease;
```

### Validation Rules
```typescript
const minAmount = 1; // USDT
const maxAmount = 10000; // USDT
const isValidAmount = amount >= minAmount && amount <= maxAmount;
```

## Error Messages

### Login Errors
- **Email Not Verified**: "Your email address has not been verified yet. Please check your inbox (and spam folder) for the verification email..."
- **Invalid Credentials**: "The email or password you entered is incorrect. Please check: • Your email address is spelled correctly..."
- **Account Blocked**: "Your account has been blocked. Please contact support for assistance..."
- **Profile Not Found**: "Your account profile could not be found. This may happen if your account registration was not completed..."

### Purchase Errors
- **Below Minimum**: "Minimum purchase is 1 USDT"
- **Above Maximum**: "Maximum purchase is 10,000 USDT"
- **Invalid Input**: "Please enter a valid amount between 1 and 10,000 USDT"

## UI Components

### Purchase Screen
- USDT input field with dollar sign icon
- Quick select buttons (1, 5, 10, 100, 1000 USDT)
- Real-time power calculation display
- 30-day validity warning box
- Clear min/max limits

### Mining Panel
- Access status with days remaining
- Renewal button (appears at 7 days or less)
- Purchase mining power button with USDT label
- Clear 30-day period indicators

### Login Screen
- Enhanced error display with detailed messages
- Troubleshooting tips box
- Action buttons for common issues

## Best Practices

### For Users
1. Verify email immediately after registration
2. Start with smaller purchases to test the system
3. Monitor days remaining and renew before expiration
4. Use quick select buttons for common amounts
5. Read error messages carefully for troubleshooting

### For Administrators
1. Monitor user feedback on error messages
2. Track purchase patterns to optimize quick select amounts
3. Send renewal reminders at 7, 3, and 1 day marks
4. Provide clear support contact information
5. Document common issues and solutions

## Support Information

### Common Issues
1. **Cannot login**: Check email verification status
2. **Purchase not reflecting**: Wait for Binance Pay confirmation
3. **Mining power not increasing**: Check 30-day validity period
4. **Access expired**: Purchase renewal package

### Contact Support
- Email: contratacionescolombia2024@gmail.com
- Include: Username, email, and detailed issue description

## Future Enhancements

### Planned Features
1. Automatic renewal option
2. Purchase history with expiration dates
3. Email notifications for expiring access
4. Bulk purchase discounts
5. Loyalty rewards for long-term users

### Under Consideration
1. Flexible validity periods (7, 14, 30, 90 days)
2. Gift cards for mining power
3. Referral bonus multipliers
4. Seasonal promotions

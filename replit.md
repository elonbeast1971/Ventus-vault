# VentusVault - Trading Super App

## Overview
VentusVault is a world-class trading super-app built with Expo React Native. It combines gift card trading, cryptocurrency exchange (BTC, ETH, USDT, SOL), instant Naira payouts, bill payments, gamified rewards, and a referral system into one premium platform.

## Recent Changes
- **Feb 2026**: Initial MVP build with 5-tab navigation (Home, Trade, Bills, Rewards, Profile)
- Dark premium theme with gold (#D4A843) primary accent
- DM Sans font family for typography
- AsyncStorage for local data persistence
- Liquid glass tab support for iOS 26+
- VentusVault logo used as app icon

## Architecture
- **Frontend**: Expo Router with file-based routing, React Native
- **Backend**: Express.js + TypeScript (port 5000)
- **State**: AsyncStorage for persistence, React Query for API calls
- **Fonts**: DM Sans (400, 500, 600, 700)
- **Theme**: Dark mode with gold/green accents

### Key Files
- `app/(tabs)/` - Tab screens (index, trade, bills, rewards, profile)
- `lib/storage.ts` - AsyncStorage data layer
- `lib/crypto-data.ts` - Static crypto/gift card/bill data
- `constants/colors.ts` - Theme colors
- `ventusvault-definition.json` - Product definition & user stories

## User Preferences
- Dark premium aesthetic inspired by Binance/Coinbase
- Gold primary accent, green for positive values
- No emojis in the app
- Nigerian Naira (NGN) as primary currency

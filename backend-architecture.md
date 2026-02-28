# VentusVault Backend Architecture

## Overview
VentusVault uses a microservices-inspired architecture built with Node.js/TypeScript and Python.

## Services
1. **Auth Service (Node.js)**: Handles user registration, login, and JWT management.
2. **Wallet Service (Node.js)**: Manages user balances and currency accounts.
3. **Transaction Engine (Node.js)**: Processes trades, transfers, and P2P transactions.
4. **Rate Engine (Node.js)**: Fetches and provides real-time currency exchange rates.
5. **AI Suggestion Engine (Python)**: Analyzes market data to provide trading suggestions.
6. **Notification Service (Node.js)**: Handles SMS (Twilio) and WebSocket push notifications.

## Data Flow
- **Client** connects via **WebSocket** for real-time balance and rate updates.
- **REST API** used for transactional actions (login, trade, history).
- **Internal Communication**: Services communicate via internal APIs or a shared database (Drizzle/PostgreSQL).

## Service Diagram
```text
[ Frontend (Expo/React Native) ]
       |          ^
       | HTTP/WS  | Real-time Updates
       v          |
[ API Gateway / Express Server ]
       |
       +--- [ Auth Service ]
       +--- [ Wallet Service ]
       +--- [ Transaction Engine ]
       +--- [ Rate Engine ]
       +--- [ AI Suggestion Engine (Python) ]
       +--- [ Notification Service (SMS/WS) ]
```

## API Endpoints
- `POST /api/auth/login`: Authenticate user.
- `GET /api/wallet/balance`: Fetch current balance.
- `POST /api/trade/execute`: Execute a trade.
- `GET /api/history`: Fetch transaction history.
- `POST /api/ai/suggestion`: Get AI-powered trading advice.
- `POST /api/notifications/sms`: Trigger SMS notification.

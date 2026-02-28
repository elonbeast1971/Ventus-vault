# VentusVault

This repository contains the backend microservices and the Expo React Native frontend for the VentusVault fintech application.

## Quickstart

The following high‑level steps explain how to run the entire stack locally.

### 1. Backend Setup

1. `cd services/<service>` and run `npm install` (or `yarn install`) for each of the microservices.
2. Create `.env` files in each service directory using the corresponding `.env.example` files. Common variables include:
   - `JWT_SECRET`
   - `PAYSTACK_KEY` / `PAYSTACK_SECRET`
   - `FLUTTERWAVE_KEY` / `FLUTTERWAVE_SECRET`
   - `CCXT_EXCHANGE` / `CCXT_API_KEY` / `CCXT_SECRET`
   - Database connection strings (`DATABASE_URL` or similar for PostgreSQL/MySQL).
3. Run database migrations or seed scripts as needed (not yet implemented; placeholder).
4. Start services:
   ```bash
   # from workspace root, you can use docker-compose or run individually
   cd services/api-gateway && npm run dev
   cd ../auth-service && npm run dev
   # … etc.
   ```
   Default ports are in the service `index.js` files (3000+, 4000+, etc.).
5. Verify endpoints are reachable:
   - `GET /health`
   - `GET /api/rates/btc` on the rate service
   - `POST /api/auth/login` on auth service
   - etc.

> ⚠️ All backend services listen on an internal Docker network when using `docker-compose`; only the API gateway is exposed externally.

### 2. Frontend Setup

1. `cd frontend`
2. `npm install` or `yarn install`
3. Configure `.env` (create at `frontend/.env`) with values such as:
   ```env
   API_URL=http://localhost:3000
   ```
   pointing to the running API gateway.
4. Launch Expo:
   ```bash
   npx expo start
   ```
5. Open the project in Expo Go (Android/iOS) or a simulator and confirm that the splash screen, glass‑morphism UI, and placeholder screens load.

### 3. Linking Backend & Frontend

- Make sure the `API_URL` environment variable in the frontend points to the API gateway URL (`localhost` or deployed address).
- Test live data fetches (crypto rates, wallet balance, P2P trade listings) by modifying screens to hit real endpoints.
- Authentication flows should use JWTs returned by the auth service; see `frontend/lib/AuthStorage.js` for helpers.

### 4. Error Prevention and Stability

**Backend**

- Each service includes error handling middleware; log errors with `pino` or your preferred logger.
- Provide fallbacks for external API failures (exchange rates, payment providers).
- Audit and request‑id middleware are in place for tracing.

**Frontend**

- All network calls should be wrapped in `try/catch` and show loading/error states.
- Consider using caching and offline patterns for network reliability.
- Protect tokens with `expo-secure-store` and validate biometric helpers in `frontend/components/BiometricAuth.js`.

### 5. Final Verification

- Create and run automated tests (unit, integration, e2e) using Jest/Detox or similar.
- Ensure the app builds and runs on both Android and iOS devices without crashes.
- Verify real‑time updates work via WebSocket (notification service) or polling.

---

For more detailed architecture documentation, see the `docs/` folder.

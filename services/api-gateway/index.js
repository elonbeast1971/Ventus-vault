const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const app = express();

app.use(requestId);
app.use(helmet());
app.use(rateLimit({ windowMs: 60000, max: 200 }));
app.use(express.json());

// IP / geolocation check
const geoip = require('geoip-lite');
app.use((req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {};
  const blocked = (process.env.BLOCKED_COUNTRIES || '').split(',');
  req.log = logger.child({ reqId: req.id, ip, country: geo.country });
  if (blocked.includes(geo.country)) {
    req.log.warn('request from blocked country', { country: geo.country });
    return res.status(403).json({ success: false, error: 'Forbidden', code: 'GEO_BLOCK' });
  }
  next();
});

const verifyJWT = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth) {
    req.log.warn('missing authorization header');
    return res.status(401).json({ success: false, error: 'Unauthorized', code: 'UNAUTH' });
  }
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = payload;
    next();
  } catch (e) {
    req.log.warn({ err: e }, 'jwt verification failed');
    return res.status(401).json({ success: false, error: 'Invalid token', code: 'UNAUTH' });
  }
};

const proxyOptions = (target) => ({
  target,
  changeOrigin: true,
  pathRewrite: (path, req) => path.replace(/^\/api/, ''),
});

// Local stub for token refresh to help frontend development when auth service isn't running.
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      req.log && req.log.warn('missing refresh token');
      return res.status(400).json({ success: false, error: 'Missing refresh token', code: 'NO_REFRESH' });
    }

    // In dev mode return a signed access token and a new mock refresh token.
    const payload = { sub: 'dev-user', iat: Math.floor(Date.now() / 1000) };
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '15m' });
    const newRefresh = `mock-refresh-${Date.now()}`;

    return res.json({ success: true, data: { accessToken, refreshToken: newRefresh } });
  } catch (err) {
    req.log && req.log.error({ err }, 'refresh stub error');
    return res.status(500).json({ success: false, error: 'Refresh failed', code: 'REFRESH_ERROR' });
  }
});

// Proxy remaining API routes to their upstream services
app.use('/api/auth', createProxyMiddleware(proxyOptions(process.env.AUTH_URL || 'http://localhost:3001')));
app.use('/api/wallet', verifyJWT, createProxyMiddleware(proxyOptions(process.env.WALLET_URL || 'http://localhost:3002')));
app.use('/api/trade', verifyJWT, createProxyMiddleware(proxyOptions(process.env.TX_URL || 'http://localhost:3003')));
app.use('/api/p2p', verifyJWT, createProxyMiddleware(proxyOptions(process.env.TX_URL || 'http://localhost:3003')));
app.use('/api/history', verifyJWT, createProxyMiddleware(proxyOptions(process.env.TX_URL || 'http://localhost:3003')));
app.use('/api/rate', createProxyMiddleware(proxyOptions(process.env.RATE_URL || 'http://localhost:3004')));
app.use('/api/ai', verifyJWT, createProxyMiddleware(proxyOptions(process.env.AI_URL || 'http://localhost:3005')));
app.use('/api/notifications', verifyJWT, createProxyMiddleware(proxyOptions(process.env.NOTIF_URL || 'http://localhost:3006')));

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'gateway' } }));

app.use((err, req, res, next) => {
  req.log.error({ err }, 'gateway error');
  res.status(500).json({ success: false, error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API Gateway listening on ${port}`));

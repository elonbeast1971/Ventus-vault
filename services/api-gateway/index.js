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

app.use('/api/auth', proxyOptions(process.env.AUTH_URL || 'http://localhost:3001'));
app.use('/api/wallet', verifyJWT, proxyOptions(process.env.WALLET_URL || 'http://localhost:3002'));
app.use('/api/trade', verifyJWT, proxyOptions(process.env.TX_URL || 'http://localhost:3003'));
app.use('/api/p2p', verifyJWT, proxyOptions(process.env.TX_URL || 'http://localhost:3003'));
app.use('/api/history', verifyJWT, proxyOptions(process.env.TX_URL || 'http://localhost:3003'));
app.use('/api/rate', proxyOptions(process.env.RATE_URL || 'http://localhost:3004'));
app.use('/api/ai', verifyJWT, proxyOptions(process.env.AI_URL || 'http://localhost:3005'));
app.use('/api/notifications', verifyJWT, proxyOptions(process.env.NOTIF_URL || 'http://localhost:3006'));

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'gateway' } }));

app.use((err, req, res, next) => {
  req.log.error({ err }, 'gateway error');
  res.status(500).json({ success: false, error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API Gateway listening on ${port}`));

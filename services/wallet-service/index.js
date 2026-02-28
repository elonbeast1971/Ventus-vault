const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const { createClient } = require('redis');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

app.use(requestId);
app.use(helmet());
app.use(rateLimit({ windowMs: 60000, max: 100 }));
app.use(express.json());
app.use((req, res, next) => {
  req.log = logger.child({ reqId: req.id });
  next();
});

// Redis publisher for events
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisClient = createClient({ url: redisUrl });
redisClient.connect().catch((err) => logger.error(err, 'redis connection error'));

async function emitEvent(event) {
  try {
    await redisClient.publish('events', JSON.stringify(event));
  } catch (err) {
    logger.error({ err }, 'failed to publish event');
  }
}

function sendError(res, message, code = 'UNKNOWN_ERROR', status = 400) {
  return res.status(status).json({ success: false, error: message, code });
}

function audit(event, details) {
  logger.info({ audit: event, details }, 'audit log');
}

function sendSuccess(res, data = {}) {
  return res.json({ success: true, data });
}

app.get('/wallet/balance', (req, res) => {
  // placeholder logic; would normally inspect req.user
  req.log.info('balance request');
  audit('BALANCE_CHECK', { /* userId, etc */ });
  // example event (commented) -- emitEvent({ type: 'balanceUpdate', data: {} });
  return sendSuccess(res, { balance: '0.00', currency: 'USD' });
});

// example of pushing an event to notification service (REST)
// function emitBalanceUpdate(userId, balance) {
//   // could use axios to POST to http://notification-service:3006/events
// }

app.get('/health', (req, res) => sendSuccess(res, { status: 'ok', service: 'wallet' }));

const port = process.env.PORT || 3002;
app.listen(port, () => console.log(`Wallet service listening on ${port}`));

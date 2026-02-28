const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const Joi = require('joi');
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

// Redis publisher
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisClient = createClient({ url: redisUrl });
redisClient.connect().catch((err) => logger.error(err, 'redis connection error'));

async function emitEvent(event) {
  try {
    await redisClient.publish('events', JSON.stringify(event));
  } catch (err) {
    logger.error({ err }, 'publish failed');
  }
}

function sendError(res, message, code = 'UNKNOWN_ERROR', status = 400) {
  return res.status(status).json({ success: false, error: message, code });
}

// simple audit logger stub - could write to dedicated file or service
function audit(event, details) {
  logger.info({ audit: event, details }, 'audit log');
}

function sendSuccess(res, data = {}) {
  return res.json({ success: true, data });
}

const tradeSchema = Joi.object({
  pair: Joi.string().required(),
  amount: Joi.number().required(),
  side: Joi.string().valid('buy', 'sell').required(),
});

const p2pSchema = Joi.object({
  recipientId: Joi.string().required(),
  amount: Joi.number().required(),
});

app.post('/trade/execute', (req, res) => {
  const { error, value } = tradeSchema.validate(req.body);
  if (error) {
    req.log.warn({ err: error }, 'validation failed');
    return sendError(res, error.message, 'VALIDATION_ERROR', 422);
  }

  req.log.info({ trade: value }, 'execute trade');
  audit('TRADE_EXECUTED', value);
  // emit event after success
  // emitEvent({ type: 'tradeExecuted', data: { txId: 'mock-tx-123' } });
  return sendSuccess(res, { status: 'success', txId: 'mock-tx-123' });
});

app.post('/p2p/transfer', (req, res) => {
  const { error, value } = p2pSchema.validate(req.body);
  if (error) {
    req.log.warn({ err: error }, 'validation failed');
    return sendError(res, error.message, 'VALIDATION_ERROR', 422);
  }

  req.log.info({ transfer: value }, 'p2p transfer');
  audit('P2P_INITIATED', value);
  // escrow record creation placeholder
  // e.g. createEscrow({ sender: req.user.id, ... })
  // emitEvent({ type: 'p2pQueued', data: {} });
  return sendSuccess(res, { status: 'queued', transferId: 'p2p-mock-001' });
});

// escrow management
app.post('/p2p/escrow/release', (req, res) => {
  // logic to release funds from escrow after conditions met
  return sendSuccess(res, { status: 'released' });
});

app.post('/p2p/escrow/cancel', (req, res) => {
  // logic to cancel escrow and refund
  return sendSuccess(res, { status: 'cancelled' });
});

app.get('/health', (req, res) => sendSuccess(res, { status: 'ok', service: 'transaction' }));

const port = process.env.PORT || 3003;
app.listen(port, () => console.log(`Transaction service listening on ${port}`));

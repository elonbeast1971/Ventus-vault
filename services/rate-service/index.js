const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const Joi = require('joi');

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

function sendError(res, message, code = 'UNKNOWN_ERROR', status = 400) {
  return res.status(status).json({ success: false, error: message, code });
}

function sendSuccess(res, data = {}) {
  return res.json({ success: true, data });
}

const rateSchema = Joi.object({
  pair: Joi.string().required(),
});

app.get('/rate', async (req, res) => {
  const { error, value } = rateSchema.validate(req.query);
  if (error) {
    req.log.warn({ err: error }, 'validation failed');
    return sendError(res, error.message, 'VALIDATION_ERROR', 422);
  }
  req.log.info({ pair: value.pair }, 'rate request');

  // using CCXT to fetch from a crypto exchange (placeholder)
  try {
    const ccxt = require('ccxt');
    const exchange = new ccxt.binance();
    const ticker = await exchange.fetchTicker(value.pair);
    return sendSuccess(res, { rate: ticker.last });
  } catch (err) {
    req.log.warn({ err }, 'ccxt fetch failed, falling back to cache');
    // fallback: perhaps return cached value from Redis or a default
    return sendSuccess(res, { rate: null });
  }
});

app.get('/health', (req, res) => sendSuccess(res, { status: 'ok', service: 'rate' }));

// global error handler
app.use((err, req, res, next) => {
  req.log.error({ err }, 'unhandled error');
  sendError(res, 'Internal Server Error', 'INTERNAL_ERROR', 500);
});

const port = process.env.PORT || 3004;
app.listen(port, () => console.log(`Rate service listening on ${port}`));

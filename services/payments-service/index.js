const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const Joi = require('joi');
const axios = require('axios');

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

const payoutSchema = Joi.object({
  userId: Joi.string().required(),
  amount: Joi.number().required(),
  currency: Joi.string().valid('NGN').required(),
  provider: Joi.string().valid('paystack','flutterwave').required(),
});

// Naira payout endpoint
app.post('/payments/naira-payout', async (req, res) => {
  const { error, value } = payoutSchema.validate(req.body);
  if (error) {
    req.log.warn({ err: error }, 'validation failed');
    return sendError(res, error.message, 'VALIDATION_ERROR', 422);
  }

  // placeholder: choose provider and call their API
  try {
    req.log.info({ payout: value }, 'naira payout requested');
    // e.g. axios.post(paystackUrl, {...}) or flutterwave
    return sendSuccess(res, { status: 'queued' });
  } catch (err) {
    req.log.error({ err }, 'provider call failed');
    // fallback: queue for retry / store in DB
    return sendError(res, 'provider unavailable', 'PROVIDER_ERROR', 503);
  }
});

app.get('/health', (req, res) => sendSuccess(res, { status: 'ok', service: 'payments' }));

app.use((err, req, res, next) => {
  req.log.error({ err }, 'unhandled error');
  sendError(res, 'Internal Server Error', 'INTERNAL_ERROR', 500);
});

const port = process.env.PORT || 3007;
app.listen(port, () => logger.info(`Payments service listening on ${port}`));

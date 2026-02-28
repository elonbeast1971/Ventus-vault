const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const Joi = require('joi');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const app = express();

// security & instrumentation
app.use(requestId);
app.use(helmet());
app.use(
  rateLimit({ windowMs: 60000, max: 100 })
);
app.use(express.json());

// attach logger per request
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

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// create JWT helper
const jwt = require('jsonwebtoken');
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
}

// public login endpoint
app.post('/auth/login', (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    req.log.warn({ err: error }, 'validation failed');
    return sendError(res, error.message, 'VALIDATION_ERROR', 422);
  }

  // placeholder authentication logic
  req.log.info({ email: value.email }, 'login attempt');
  const token = generateToken({ email: value.email });
  return sendSuccess(res, { token });
});

// biometric login (stub)
app.post('/auth/biometric-login', (req, res) => {
  // body would contain biometric token/feature vector
  req.log.info('biometric login attempt');
  // placeholder success -> issue JWT
  const token = generateToken({ biometric: true });
  return sendSuccess(res, { token });
});

// 2FA endpoints
app.post('/auth/2fa/enable', (req, res) => {
  // would register user for 2FA (TOTP, SMS, etc)
  req.log.info('2FA enabled for user');
  return sendSuccess(res, { enabled: true });
});

app.post('/auth/2fa/verify', (req, res) => {
  const { code } = req.body;
  // verify code stub
  if (code === '123456') {
    const token = generateToken({ twoFactor: true });
    return sendSuccess(res, { token });
  }
  return sendError(res, 'Invalid code', '2FA_FAILED', 401);
});

// health check
app.get('/health', (req, res) =>
  sendSuccess(res, { status: 'ok', service: 'auth' }),
);

// global error handler
app.use((err, req, res, next) => {
  req.log.error({ err }, 'unhandled error');
  sendError(res, 'Internal Server Error', 'INTERNAL_ERROR', 500);
});

const port = process.env.PORT || 3001;
app.listen(port, () => logger.info(`Auth service listening on ${port}`));

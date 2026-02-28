const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestId = require('express-request-id')();
const pino = require('pino');
const { createClient } = require('redis');
const http = require('http');
const { Server } = require('socket.io');

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

// Redis subscriber for events
const redisUrl = process.env.REDIS_URL || 'redis://redis:6379';
const redisClient = createClient({ url: redisUrl });
redisClient.connect().catch((err) => logger.error(err, 'redis connection error'));
redisClient.subscribe('events', (message) => {
  try {
    const event = JSON.parse(message);
    io.emit('event', event);
    logger.info({ event }, 'relayed event to websocket clients');
  } catch (err) {
    logger.error({ err, message }, 'failed to parse event message');
  }
});

// HTTP interface for SMS sending
app.post('/notifications/sms', (req, res) => {
  const { to, message } = req.body;
  req.log.info({ to }, 'sms request');
  // provider call placeholder
  // e.g. twilioClient.messages.create(...)
  return res.json({ success: true, data: { status: 'sent' } });
});

// legacy direct event posting (still works but services should publish to Redis)
app.post('/events', (req, res) => {
  const event = req.body;
  io.emit('event', event);
  req.log.info({ event }, 'received direct event');
  return res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ success: true, data: { status: 'ok', service: 'notification' } }));

// global error handler
app.use((err, req, res, next) => {
  req.log.error({ err }, 'unhandled error');
  res.status(500).json({ success: false, error: 'Internal Server Error', code: 'INTERNAL_ERROR' });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('client connected to notifications');
  socket.on('disconnect', () => console.log('client disconnected'));
});

const port = process.env.PORT || 3006;
server.listen(port, () => console.log(`Notification service listening on ${port}`));

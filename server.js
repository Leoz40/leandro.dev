const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(compression());

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: isProd ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  next();
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisicoes. Tente novamente em 15 minutos.' },
});
app.use('/api/', limiter);

app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  next();
});

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: isProd ? '7d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

const contactValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).escape(),
  body('email').trim().isEmail().normalizeEmail().isLength({ max: 100 }),
  body('message').trim().isLength({ min: 1, max: 1000 }).escape(),
];

app.post('/api/contact', contactValidation, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Dados invalidos. Verifique os campos.' });
  }

  const { name, email, message } = req.body;

  console.log(`[CONTACT] Nome: ${name}, Email: ${email}, Mensagem: ${message.substring(0, 50)}...`);

  res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Ambiente: ${isProd ? 'producao' : 'desenvolvimento'}`);
});

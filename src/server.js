/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

/** Express server bootstrap for SylvaWatt AI distributed green compute network. */
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { config: defaultConfig } = require('./config');
const { SessionStore } = require('./lib/auth');
const { Store } = require('./store');
const { TelemetryService } = require('./services/telemetry');
const { createApiRouter } = require('./routes/api');

function securityHeaders(_req, res, next) {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'",
  });
  next();
}

function createApp({ config = defaultConfig, store, telemetry, fetchImpl } = {}) {
  const db = store || new Store(config.dataDir);
  const tel = telemetry || new TelemetryService(config.telemetry, fetchImpl);
  const sessions = new SessionStore({ ttlMs: config.auth.sessionTtlHours * 3600 * 1000 });

  const app = express();
  app.disable('x-powered-by');
  app.use(securityHeaders);
  app.use((req, res, next) => {
    req.requestId = crypto.randomBytes(6).toString('hex');
    res.set('X-Request-Id', req.requestId);
    next();
  });
  app.use(express.json({ limit: '200kb' }));

  app.use('/api', createApiRouter({ config, store: db, telemetry: tel, sessions }));

  app.use(express.static(path.join(config.rootDir, 'public'), {
    index: 'index.html',
    maxAge: '1h',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
    },
  }));

  app.use((req, res) => {
    res.status(404);
    if (req.accepts(['html', 'json']) === 'html') {
      return res.sendFile(path.join(config.rootDir, 'public', 'index.html'));
    }
    return res.json({ error: 'Not found' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
    if (res.headersSent) return undefined;
    return res.status(500).json({ error: 'Internal server error', requestId: req.requestId });
  });

  return { app, store: db, telemetry: tel, sessions };
}

function start(config = defaultConfig) {
  const { app } = createApp({ config });
  const server = app.listen(config.port, config.host, () => {
    console.log(`[SylvaWatt AI v${config.version}] Listening on http://${config.host}:${config.port} (mode=${config.dataMode})`);
  });
  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  return server;
}

if (require.main === module) {
  start();
}

module.exports = { createApp, start };

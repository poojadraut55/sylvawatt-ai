/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

/** Centralized runtime configuration for SylvaWatt AI. */
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..');

function loadConfig(env = process.env) {
  return Object.freeze({
    appName: 'SylvaWatt AI',
    version: '0.1.0',
    rootDir: ROOT_DIR,
    dataDir: path.resolve(env.SW_DATA_DIR || path.join(ROOT_DIR, 'data')),
    port: Number(env.PORT || 8792),
    host: env.HOST || '127.0.0.1',
    env: env.NODE_ENV || 'development',
    dataMode: (env.SW_DATA_MODE || 'demo').toLowerCase(),
    telemetry: {
      mode: (env.SW_TELEMETRY_MODE || 'auto').toLowerCase(),
      aiosMonitorPath: env.SW_AIOS_MONITOR_PATH || '',
      aiosBenchmarkPath: env.SW_AIOS_BENCHMARK_PATH || '',
      ollamaBaseUrl: (env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, ''),
      cacheTtlMs: 4000,
    },
    economics: {
      brokerageFeePct: Number(env.SW_BROKERAGE_FEE_PCT || 12),
      defaultKwhRateUsd: Number(env.SW_DEFAULT_KWH_RATE_USD || 0.14),
      waterLitersPerGpuHour: Number(env.SW_WATER_SAVED_LITERS_PER_GPU_HR || 2.45),
      coolingKwhSavedPerGpuHour: 0.24,
      co2KgSavedPerGpuHour: 0.19,
    },
    auth: {
      sessionTtlHours: Number(env.SW_SESSION_TTL_HOURS || 24),
      cookieName: 'sw_session',
    },
  });
}

module.exports = {
  loadConfig,
  config: loadConfig(),
};

/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { loadConfig } = require('../src/config');
const { createApp } = require('../src/server');
const { calculateNodeEconomics, simulateUpgrades } = require('../src/services/economics');

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sylvawatt-test-'));
}

async function startTestServer() {
  const dataDir = makeTempDir();
  const cfg = loadConfig({
    SW_DATA_DIR: dataDir,
    SW_TELEMETRY_MODE: 'simulated',
    SW_DATA_MODE: 'demo',
    PORT: '0',
  });
  const { app } = createApp({ config: cfg });
  const server = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const addr = server.address();
  return {
    baseUrl: `http://127.0.0.1:${addr.port}`,
    dataDir,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

test('Economics: net profit beats electricity and tracks fresh water saved', () => {
  const eco = calculateNodeEconomics({
    tierId: 'rtx-4090-24gb',
    ramGb: 64,
    maxUtilizationPct: 70,
    hoursPerDay: 12,
    electricityRateUsd: 0.14,
  });
  assert.ok(eco.netMonthlyProfitUsd > 200, 'RTX 4090 should earn net profit > $200/mo');
  assert.ok(eco.ecoImpact.waterSavedLitersMonth > 500, 'Should save >500L water/month');

  const sim = simulateUpgrades(
    { tierId: 'm4-16gb', ramGb: 16, maxUtilizationPct: 68, hoursPerDay: 11, electricityRateUsd: 0.14 },
    ['ram-32gb', 'security-mesh'],
  );
  assert.ok(sim.upgraded.powerScore > sim.baseline.powerScore, 'Upgrades boost Power Score');
  assert.ok(sim.upgraded.incrementalMonthlyGainUsd > 0, 'Upgrades increase monthly net earnings');
  assert.ok(sim.upgraded.paybackMonths > 0, 'Payback months computed');
});

test('Full E2E API Flow: Login -> Telemetry -> Controls -> Accept Job -> Wallet -> Marketplace Ads', async () => {
  const srv = await startTestServer();
  try {
    // 1. Health & ownership check
    const health = await fetch(`${srv.baseUrl}/api/health`).then((r) => r.json());
    assert.equal(health.status, 'ok');
    assert.equal(health.owner, 'DevOps Invent Private Limited');

    // 2. Login as demo provider
    const loginRes = await fetch(`${srv.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'provider@sylvawatt.io', password: 'demo123' }),
    });
    assert.equal(loginRes.status, 200);
    const { token, user } = await loginRes.json();
    assert.equal(user.role, 'provider');
    const authHdr = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

    // 3. Telemetry live
    const tel = await fetch(`${srv.baseUrl}/api/telemetry/live`).then((r) => r.json());
    assert.equal(tel.telemetry.nodeStatus, 'EARNING_GREEN_MESH');

    // 4. Human Safety Control: simulate gaming pause
    await fetch(`${srv.baseUrl}/api/node/controls`, {
      method: 'POST',
      headers: authHdr,
      body: JSON.stringify({ simulateGamingPause: true, maxUtilizationPct: 60, thermalCutoffC: 72 }),
    });
    const pausedTel = await fetch(`${srv.baseUrl}/api/telemetry/live`).then((r) => r.json());
    assert.equal(pausedTel.telemetry.nodeStatus, 'PAUSED_FOR_GAMING');
    assert.equal(pausedTel.telemetry.safetyGuard.allocatableComputePct, 0);

    // Job acceptance must fail cleanly while paused by human override
    const blockedJobRes = await fetch(`${srv.baseUrl}/api/jobs/job_nordic_70b/accept`, {
      method: 'POST',
      headers: authHdr,
      body: '{}',
    });
    assert.equal(blockedJobRes.status, 409);

    // Resume node
    await fetch(`${srv.baseUrl}/api/node/controls`, {
      method: 'POST',
      headers: authHdr,
      body: JSON.stringify({ simulateGamingPause: false, nodeActive: true }),
    });

    // 5. Accept enterprise job -> earns money & saves fresh water
    const acceptRes = await fetch(`${srv.baseUrl}/api/jobs/job_nordic_70b/accept`, {
      method: 'POST',
      headers: authHdr,
      body: '{}',
    });
    assert.equal(acceptRes.status, 200);
    const acceptData = await acceptRes.json();
    assert.ok(acceptData.providerPayoutUsd > 0);
    assert.ok(acceptData.ecoTotals.nodeWaterSavedLiters > 894.6);

    // 6. Marketplace & Ad Monetization
    const mktRes = await fetch(`${srv.baseUrl}/api/marketplace/catalog`).then((r) => r.json());
    assert.ok(mktRes.items.length >= 4);
    const clickRes = await fetch(`${srv.baseUrl}/api/marketplace/affiliate-click`, {
      method: 'POST',
      headers: authHdr,
      body: JSON.stringify({ itemId: 'mkt_sec_shield' }),
    }).then((r) => r.json());
    assert.equal(clickRes.tracked, true);

    // 7. Viral AI Character Reels API & publish queue
    const reelsRes = await fetch(`${srv.baseUrl}/api/viral-reels`).then((r) => r.json());
    assert.equal(reelsRes.characters.length, 3);
    assert.ok(reelsRes.reels.length >= 3);
    const queueRes = await fetch(`${srv.baseUrl}/api/viral-reels/queue`, {
      method: 'POST',
      headers: authHdr,
      body: JSON.stringify({ reelId: reelsRes.reels[0].id }),
    }).then((r) => r.json());
    assert.equal(queueRes.queued, true);
  } finally {
    await srv.close();
    fs.rmSync(srv.dataDir, { recursive: true, force: true });
  }
});

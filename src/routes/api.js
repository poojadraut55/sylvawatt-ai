/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

/** REST API Router for SylvaWatt AI distributed compute, telemetry, economics & marketplace. */
const express = require('express');
const crypto = require('node:crypto');
const { verifyPassword, parseCookies } = require('../lib/auth');
const { HARDWARE_TIERS, UPGRADE_MODULES, calculateNodeEconomics, simulateUpgrades } = require('../services/economics');

function createApiRouter({ config, store, telemetry, sessions }) {
  const router = express.Router();

  // Attach user if session cookie is valid
  router.use((req, _res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies[config.auth.cookieName] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    const sess = sessions.get(token);
    if (sess) {
      req.user = store.findUserById(sess.userId);
      req.sessionToken = token;
    }
    next();
  });

  function requireAuth(req, res, next) {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    return next();
  }

  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      app: config.appName,
      version: config.version,
      dataMode: config.dataMode,
      owner: 'DevOps Invent Private Limited',
      license: 'DevOps Invent Non-Commercial Open-Source License (Commercial & Enterprise Use Prohibited Without License)',
      waterMission: 'Protecting fresh water by shifting AI inference from hyper-scale cooling towers to human-controlled idle consumer hardware.',
    });
  });

  // ── Authentication & Demo Role Onboarding ───────────────────────────────
  router.post('/auth/login', (req, res) => {
    const { email, password } = req.body || {};
    const user = store.findUserByEmail(email);
    if (!user || !verifyPassword(password || '', user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = sessions.create(user.id);
    res.setHeader('Set-Cookie', `${config.auth.cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${config.auth.sessionTtlHours * 3600}`);
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        walletBalanceUsd: user.walletBalanceUsd,
        nodeName: user.nodeName || user.company,
      },
    });
  });

  router.post('/auth/logout', (req, res) => {
    if (req.sessionToken) sessions.revoke(req.sessionToken);
    res.setHeader('Set-Cookie', `${config.auth.cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  });

  router.get('/auth/me', (req, res) => {
    if (!req.user) return res.status(401).json({ authenticated: false });
    return res.json({
      authenticated: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        walletBalanceUsd: req.user.walletBalanceUsd,
        nodeName: req.user.nodeName || req.user.company,
      },
    });
  });

  // ── Telemetry & System Utilization (Reusing AI-OS System Intelligence) ───
  router.get('/telemetry/live', async (_req, res) => {
    const data = await telemetry.getLiveTelemetry(store.data.nodeControls);
    res.json({
      telemetry: data,
      controls: store.data.nodeControls,
    });
  });

  router.post('/telemetry/benchmark', requireAuth, async (_req, res) => {
    const result = await telemetry.runQuickBenchmark();
    store.data.securityAuditLog.unshift({
      id: `sec_${crypto.randomBytes(4).toString('hex')}`,
      event: 'HARDWARE_BENCHMARK_COMPLETED',
      detail: `Compute Score ${result.computeScore}/100 · Est ${result.estimatedTokensPerSec} tok/s (${result.telemetrySource})`,
      severity: 'PASS',
      timestamp: new Date().toISOString(),
    });
    store.data.securityAuditLog = store.data.securityAuditLog.slice(0, 20);
    store.save();
    res.json(result);
  });

  // ── Human-First Safety Controls ──────────────────────────────────────────
  router.post('/node/controls', requireAuth, (req, res) => {
    const body = req.body || {};
    const c = store.data.nodeControls;

    if (typeof body.nodeActive === 'boolean') c.nodeActive = body.nodeActive;
    if (body.maxUtilizationPct !== undefined) c.maxUtilizationPct = Math.max(10, Math.min(90, Number(body.maxUtilizationPct)));
    if (body.thermalCutoffC !== undefined) c.thermalCutoffC = Math.max(58, Math.min(85, Number(body.thermalCutoffC)));
    if (typeof body.autoPauseOnGaming === 'boolean') c.autoPauseOnGaming = body.autoPauseOnGaming;
    if (typeof body.simulateGamingPause === 'boolean') c.simulateGamingPause = body.simulateGamingPause;
    if (body.scheduleMode) c.scheduleMode = String(body.scheduleMode);
    if (body.tierId && HARDWARE_TIERS[body.tierId]) c.tierId = body.tierId;
    if (body.ramGb !== undefined) c.ramGb = Math.max(8, Math.min(512, Number(body.ramGb)));
    if (body.hoursPerDay !== undefined) c.hoursPerDay = Math.max(1, Math.min(24, Number(body.hoursPerDay)));
    if (body.electricityRateUsd !== undefined) c.electricityRateUsd = Math.max(0.02, Math.min(0.8, Number(body.electricityRateUsd)));
    if (body.approvedWorkloads && typeof body.approvedWorkloads === 'object') {
      c.approvedWorkloads = {
        encryptedInference: Boolean(body.approvedWorkloads.encryptedInference),
        loraMicroTuning: Boolean(body.approvedWorkloads.loraMicroTuning),
        zeroRetentionVision: Boolean(body.approvedWorkloads.zeroRetentionVision),
      };
    }

    store.data.securityAuditLog.unshift({
      id: `sec_${crypto.randomBytes(4).toString('hex')}`,
      event: 'HUMAN_CONTROL_UPDATED',
      detail: `Human set Max Cap ${c.maxUtilizationPct}%, Thermal Cutoff ${c.thermalCutoffC}°C, Active=${c.nodeActive}, GamingPause=${c.simulateGamingPause}`,
      severity: 'PASS',
      timestamp: new Date().toISOString(),
    });
    store.data.securityAuditLog = store.data.securityAuditLog.slice(0, 20);
    store.save();
    res.json({ controls: c });
  });

  // ── Economics, Net Profit & Hardware Upgrade Advisor ─────────────────────
  router.get('/economics/tiers', (_req, res) => {
    res.json({
      tiers: Object.values(HARDWARE_TIERS),
      upgrades: Object.values(UPGRADE_MODULES),
    });
  });

  router.post('/economics/calculate', (req, res) => {
    const c = store.data.nodeControls;
    const input = {
      tierId: req.body?.tierId || c.tierId,
      ramGb: Number(req.body?.ramGb ?? c.ramGb),
      maxUtilizationPct: Number(req.body?.maxUtilizationPct ?? c.maxUtilizationPct),
      hoursPerDay: Number(req.body?.hoursPerDay ?? c.hoursPerDay),
      electricityRateUsd: Number(req.body?.electricityRateUsd ?? c.electricityRateUsd),
      brokerageFeePct: config.economics.brokerageFeePct,
      waterLitersPerGpuHour: config.economics.waterLitersPerGpuHour,
      coolingKwhSavedPerGpuHour: config.economics.coolingKwhSavedPerGpuHour,
      co2KgSavedPerGpuHour: config.economics.co2KgSavedPerGpuHour,
    };
    const result = calculateNodeEconomics(input);
    res.json(result);
  });

  router.post('/economics/upgrade-sim', (req, res) => {
    const c = store.data.nodeControls;
    const baseInput = {
      tierId: req.body?.tierId || c.tierId,
      ramGb: Number(req.body?.ramGb ?? c.ramGb),
      maxUtilizationPct: Number(req.body?.maxUtilizationPct ?? c.maxUtilizationPct),
      hoursPerDay: Number(req.body?.hoursPerDay ?? c.hoursPerDay),
      electricityRateUsd: Number(req.body?.electricityRateUsd ?? c.electricityRateUsd),
      brokerageFeePct: config.economics.brokerageFeePct,
      waterLitersPerGpuHour: config.economics.waterLitersPerGpuHour,
      coolingKwhSavedPerGpuHour: config.economics.coolingKwhSavedPerGpuHour,
      co2KgSavedPerGpuHour: config.economics.co2KgSavedPerGpuHour,
    };
    const selectedUpgrades = Array.isArray(req.body?.upgrades) ? req.body.upgrades : [];
    const sim = simulateUpgrades(baseInput, selectedUpgrades);
    res.json(sim);
  });

  // ── Enterprise ↔ Home Node Compute Marketplace ───────────────────────────
  router.get('/jobs', (_req, res) => {
    res.json({ jobs: store.data.jobs });
  });

  router.post('/jobs', requireAuth, (req, res) => {
    const { title, company, workloadType, minVramGb, payoutPerHourUsd, estimatedHours } = req.body || {};
    if (!title || String(title).trim().length < 4) {
      return res.status(400).json({ error: 'Job title must be at least 4 characters' });
    }
    const hrs = Math.max(0.5, Math.min(240, Number(estimatedHours || 4)));
    const waterLiters = Number((hrs * config.economics.waterLitersPerGpuHour).toFixed(1));
    const co2Kg = Number((hrs * config.economics.co2KgSavedPerGpuHour).toFixed(2));

    const newJob = {
      id: `job_${crypto.randomBytes(4).toString('hex')}`,
      company: String(company || req.user.company || req.user.name).slice(0, 60),
      title: String(title).trim().slice(0, 120),
      workloadType: workloadType || 'encryptedInference',
      minVramGb: Math.max(4, Number(minVramGb || 8)),
      payoutPerHourUsd: Math.max(0.25, Number(payoutPerHourUsd || 0.85)),
      estimatedHours: hrs,
      waterSavedLiters: waterLiters,
      co2SavedKg: co2Kg,
      securityTier: 'Zero-Retention Sandbox Container',
      status: 'OPEN',
      completedBy: null,
      createdAt: new Date().toISOString(),
    };
    store.data.jobs.unshift(newJob);
    store.save();
    return res.status(201).json({ job: newJob });
  });

  router.post('/jobs/:id/accept', requireAuth, (req, res) => {
    const job = store.data.jobs.find((j) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Workload job not found' });
    if (job.status === 'COMPLETED') return res.status(409).json({ error: 'Job already completed' });

    const c = store.data.nodeControls;
    if (!c.nodeActive || c.simulateGamingPause) {
      return res.status(409).json({ error: 'Node is currently paused by human override. Resume node to execute workloads.' });
    }

    const gross = job.payoutPerHourUsd * job.estimatedHours;
    const fee = gross * (config.economics.brokerageFeePct / 100);
    const providerNet = Number((gross - fee).toFixed(2));

    job.status = 'COMPLETED';
    job.completedBy = req.user.email;
    job.completedAt = new Date().toISOString();

    req.user.walletBalanceUsd = Number((req.user.walletBalanceUsd + providerNet).toFixed(2));
    store.data.revenueLedger.brokerageFeesEarnedUsd = Number((store.data.revenueLedger.brokerageFeesEarnedUsd + fee).toFixed(2));

    store.data.ecoTotals.nodeWaterSavedLiters = Number((store.data.ecoTotals.nodeWaterSavedLiters + job.waterSavedLiters).toFixed(1));
    store.data.ecoTotals.globalWaterSavedLiters = Number((store.data.ecoTotals.globalWaterSavedLiters + job.waterSavedLiters).toFixed(1));
    store.data.ecoTotals.nodeCo2SavedKg = Number((store.data.ecoTotals.nodeCo2SavedKg + job.co2SavedKg).toFixed(1));
    store.data.ecoTotals.globalCo2SavedKg = Number((store.data.ecoTotals.globalCo2SavedKg + job.co2SavedKg).toFixed(1));
    const kwhSaved = Number((job.estimatedHours * config.economics.coolingKwhSavedPerGpuHour).toFixed(1));
    store.data.ecoTotals.nodeCoolingKwhSaved = Number((store.data.ecoTotals.nodeCoolingKwhSaved + kwhSaved).toFixed(1));
    store.data.ecoTotals.globalCoolingKwhSaved = Number((store.data.ecoTotals.globalCoolingKwhSaved + kwhSaved).toFixed(1));

    store.data.walletTransactions.unshift({
      id: `tx_${crypto.randomBytes(4).toString('hex')}`,
      type: 'JOB_PAYOUT',
      description: `Executed '${job.title}' (${job.estimatedHours}h · Net after 12% brokerage)`,
      amountUsd: providerNet,
      waterSavedLiters: job.waterSavedLiters,
      createdAt: new Date().toISOString(),
    });
    store.data.securityAuditLog.unshift({
      id: `sec_${crypto.randomBytes(4).toString('hex')}`,
      event: 'WORKLOAD_SANDBOX_COMPLETED',
      detail: `Executed job ${job.id} inside ephemeral container · Saved ${job.waterSavedLiters}L water · Earned $${providerNet}`,
      severity: 'PASS',
      timestamp: new Date().toISOString(),
    });
    store.save();

    return res.json({
      job,
      providerPayoutUsd: providerNet,
      brokerageFeeUsd: Number(fee.toFixed(2)),
      walletBalanceUsd: req.user.walletBalanceUsd,
      ecoTotals: store.data.ecoTotals,
    });
  });

  // ── Water Scarcity & Eco-Movement Impact ─────────────────────────────────
  router.get('/eco/impact', (_req, res) => {
    res.json({
      ecoTotals: store.data.ecoTotals,
      waterComparison: {
        hyperscaleLitersPerGpuHr: config.economics.waterLitersPerGpuHour,
        sylvawattLitersPerGpuHr: 0.0,
        explanation: 'Hyperscale AI data centers consume massive quantities of potable fresh water in evaporative cooling towers. SylvaWatt shifts inference to ambiently cooled consumer hardware already sitting idle at home.',
      },
    });
  });

  // ── Hardware, Cybersecurity Marketplace & Ad Monetization ────────────────
  router.get('/marketplace/catalog', (_req, res) => {
    // Track lightweight non-invasive impression telemetry on sponsor cards
    store.data.sponsorAds.forEach((ad) => {
      ad.impressions += 1;
    });
    store.save();
    res.json({
      items: store.data.marketplaceItems,
      sponsorAds: store.data.sponsorAds,
    });
  });

  router.post('/marketplace/affiliate-click', (req, res) => {
    const { itemId, adId } = req.body || {};
    if (itemId) {
      const item = store.data.marketplaceItems.find((m) => m.id === itemId);
      if (!item) return res.status(404).json({ error: 'Marketplace item not found' });
      const estCommission = Number(((item.priceUsd * item.affiliatePct) / 100).toFixed(2));
      store.data.revenueLedger.affiliateCommissionsUsd = Number((store.data.revenueLedger.affiliateCommissionsUsd + estCommission * 0.25).toFixed(2));
      store.save();
      return res.json({
        tracked: true,
        item: item.title,
        partnerTier: item.vendor,
        projectedCommissionUsd: estCommission,
        message: `Verified partner referral tracked for '${item.title}'. Hardware/security protection ready to provision.`,
      });
    }
    if (adId) {
      const ad = store.data.sponsorAds.find((a) => a.id === adId);
      if (!ad) return res.status(404).json({ error: 'Sponsor ad not found' });
      ad.clicks += 1;
      store.data.revenueLedger.sponsorAdRevenueUsd = Number((store.data.revenueLedger.sponsorAdRevenueUsd + 0.45).toFixed(2));
      store.save();
      return res.json({ tracked: true, sponsor: ad.sponsor, adRevenueUpdated: store.data.revenueLedger.sponsorAdRevenueUsd });
    }
    return res.status(400).json({ error: 'Provide itemId or adId' });
  });

  router.get('/revenue/overview', (_req, res) => {
    const r = store.data.revenueLedger;
    const total = Number((r.brokerageFeesEarnedUsd + r.affiliateCommissionsUsd + r.sponsorAdRevenueUsd + r.selfHostedLicensesUsd).toFixed(2));
    res.json({
      revenueLedger: r,
      totalPlatformRevenueUsd: total,
      sponsorAds: store.data.sponsorAds,
      licenseModel: 'DevOps Invent Source-Available Dual License (Free Personal/Home Node · Paid Commercial/Enterprise Operator)',
    });
  });

  // ── Wallet, Payouts & Security Audit ─────────────────────────────────────
  router.get('/wallet', requireAuth, (req, res) => {
    res.json({
      balanceUsd: req.user.walletBalanceUsd,
      transactions: store.data.walletTransactions,
      securityAuditLog: store.data.securityAuditLog,
    });
  });

  router.post('/wallet/payout', requireAuth, (req, res) => {
    const amount = Number(req.body?.amountUsd || 0);
    const method = String(req.body?.method || 'Stripe Express Payout');
    if (amount <= 0 || amount > req.user.walletBalanceUsd) {
      return res.status(400).json({ error: 'Invalid payout amount' });
    }
    req.user.walletBalanceUsd = Number((req.user.walletBalanceUsd - amount).toFixed(2));
    const tx = {
      id: `tx_${crypto.randomBytes(4).toString('hex')}`,
      type: 'PAYOUT_WITHDRAWAL',
      description: `Demo withdrawal via ${method}`,
      amountUsd: -amount,
      waterSavedLiters: 0,
      createdAt: new Date().toISOString(),
    };
    store.data.walletTransactions.unshift(tx);
    store.save();
    return res.json({ balanceUsd: req.user.walletBalanceUsd, transaction: tx });
  });

  // ── 60-Second Self-Hosted Installer Finalizer ────────────────────────────
  router.post('/install/complete', (req, res) => {
    const { operatorEmail, brokeragePct, dataMode } = req.body || {};
    store.data.meta.installed = true;
    store.data.meta.installedAt = new Date().toISOString();
    if (operatorEmail) store.data.meta.operatorEmail = String(operatorEmail);
    if (brokeragePct !== undefined) store.data.meta.brokeragePct = Number(brokeragePct);
    if (dataMode) store.data.meta.dataMode = String(dataMode);
    store.save();
    res.json({ ok: true, meta: store.data.meta });
  });

  router.use((_req, res) => res.status(404).json({ error: 'API route not found' }));
  return router;
}

module.exports = { createApiRouter };

/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

/**
 * Atomic JSON persistence store for SylvaWatt AI.
 * Handles demo seed state (zero real secrets), enterprise jobs, node controls,
 * hardware/security marketplace items, sponsor ads, and water-scarcity ledger.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { hashPassword } = require('./lib/auth');

function seedInitialData() {
  const demoHash = hashPassword('demo123');
  return {
    meta: {
      installed: true,
      version: '0.1.0',
      licenseTier: 'Non-Commercial Community / Evaluation',
      owner: 'DevOps Invent Private Limited',
      createdAt: new Date().toISOString(),
    },
    users: [
      {
        id: 'usr_provider_1',
        email: 'provider@sylvawatt.io',
        name: 'Alex Morgan (Home Node)',
        role: 'provider',
        passwordHash: demoHash,
        walletBalanceUsd: 142.85,
        nodeName: 'Home-Workstation-01',
      },
      {
        id: 'usr_ent_1',
        email: 'enterprise@acme-ai.io',
        name: 'NordicFin AI Engineering',
        role: 'enterprise',
        passwordHash: demoHash,
        walletBalanceUsd: 2450.00,
        company: 'NordicFin AI Labs',
      },
      {
        id: 'usr_admin_1',
        email: 'admin@sylvawatt.io',
        name: 'Network Operator Admin',
        role: 'admin',
        passwordHash: demoHash,
        walletBalanceUsd: 8940.50,
        company: 'DevOps Invent Operator',
      },
    ],
    nodeControls: {
      nodeActive: true,
      maxUtilizationPct: 68,
      thermalCutoffC: 74,
      autoPauseOnGaming: true,
      simulateGamingPause: false,
      scheduleMode: 'idle_and_night',
      tierId: 'm4-16gb',
      ramGb: 16,
      hoursPerDay: 11,
      electricityRateUsd: 0.14,
      approvedWorkloads: {
        encryptedInference: true,
        loraMicroTuning: true,
        zeroRetentionVision: false,
      },
      humanOverrideLocked: true,
      firewallMode: 'Zero-Trust Container Sandbox (No LAN Access)',
    },
    ecoTotals: {
      globalActiveNodes: 14820,
      globalWaterSavedLiters: 1842910.4,
      globalCoolingKwhSaved: 180540.2,
      globalCo2SavedKg: 142900.8,
      nodeWaterSavedLiters: 894.6,
      nodeCoolingKwhSaved: 87.6,
      nodeCo2SavedKg: 69.3,
    },
    jobs: [
      {
        id: 'job_nordic_70b',
        company: 'NordicFin AI Labs',
        title: 'Encrypted Financial Document Inference (14B–32B Shard)',
        workloadType: 'encryptedInference',
        minVramGb: 12,
        payoutPerHourUsd: 0.92,
        estimatedHours: 4.0,
        waterSavedLiters: 9.8,
        co2SavedKg: 0.76,
        securityTier: 'Zero-Retention TLS + Container Sandbox',
        status: 'OPEN',
        completedBy: null,
        createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
      },
      {
        id: 'job_medleaf_rag',
        company: 'MedLeaf Open Research',
        title: 'De-Identified Medical Literature Embeddings Batch',
        workloadType: 'encryptedInference',
        minVramGb: 8,
        payoutPerHourUsd: 0.68,
        estimatedHours: 3.5,
        waterSavedLiters: 8.6,
        co2SavedKg: 0.66,
        securityTier: 'Ephemeral RAM-Only Execution',
        status: 'OPEN',
        completedBy: null,
        createdAt: new Date(Date.now() - 7200 * 1000).toISOString(),
      },
      {
        id: 'job_cleangrid_climate',
        company: 'GeoClimate Alliance',
        title: 'Watershed Drought Prediction Transformer Inference',
        workloadType: 'loraMicroTuning',
        minVramGb: 16,
        payoutPerHourUsd: 1.24,
        estimatedHours: 6.0,
        waterSavedLiters: 14.7,
        co2SavedKg: 1.14,
        securityTier: 'Signed Checksum + Zero Egress',
        status: 'OPEN',
        completedBy: null,
        createdAt: new Date(Date.now() - 1800 * 1000).toISOString(),
      },
      {
        id: 'job_indie_vision',
        company: 'PixelCraft Open Studio',
        title: 'AI Frame Upscaling & Restoration Micro-Batch',
        workloadType: 'zeroRetentionVision',
        minVramGb: 12,
        payoutPerHourUsd: 0.85,
        estimatedHours: 2.5,
        waterSavedLiters: 6.1,
        co2SavedKg: 0.48,
        securityTier: 'Isolated Sandbox Container',
        status: 'OPEN',
        completedBy: null,
        createdAt: new Date(Date.now() - 900 * 1000).toISOString(),
      },
    ],
    marketplaceItems: [
      {
        id: 'mkt_sec_shield',
        category: 'security',
        title: 'SylvaWatt Zero-Trust Container & LAN Firewall Shield',
        vendor: 'DevOps Invent Security Pack',
        priceUsd: 29,
        billing: 'one-time / add-on',
        affiliatePct: 100,
        powerBoostNote: 'Qualifies your node for FinTech/Health premium jobs (+22% hourly rates)',
        description: 'Hardware-level WireGuard mesh, strict outbound egress filtering, and automatic RAM wipe after every AI shard.',
        partnerUrl: '#marketplace-bundle-security',
        badge: 'MOST POPULAR SECURITY',
      },
      {
        id: 'mkt_sec_safdo',
        category: 'security',
        title: 'Safdo AI Data Privacy & Antivirus Mesh Guard',
        vendor: 'Safdo Security Partner',
        priceUsd: 49,
        billing: 'annual license',
        affiliatePct: 25,
        powerBoostNote: 'Blocks internet port scans & unauthorized telemetry while node earns 24/7',
        description: 'Continuous zero-day socket protection, encrypted payload verification, and home router anomaly alerts.',
        partnerUrl: '#marketplace-safdo-guard',
        badge: 'NETWORK PROTECTION',
      },
      {
        id: 'mkt_hw_ram64',
        category: 'hardware',
        title: '64GB Low-Voltage DDR5 Memory Upgrade Kit',
        vendor: 'Hardware Partner Marketplace',
        priceUsd: 169,
        billing: 'hardware',
        affiliatePct: 6,
        powerBoostNote: '+$48/mo net profit boost · Payback in ~3.5 months',
        description: 'Expands context length to 32K+ tokens so your workstation qualifies for high-paying 32B/70B enterprise sharding.',
        partnerUrl: '#marketplace-hw-ram',
        badge: 'FASTEST ROI',
      },
      {
        id: 'mkt_hw_rtx4090',
        category: 'hardware',
        title: 'RTX 4090 24GB Eco-Tuned Workstation GPU',
        vendor: 'Verified Hardware Partner',
        priceUsd: 1599,
        billing: 'hardware',
        affiliatePct: 5,
        powerBoostNote: '+$185/mo net profit boost at 70% undervolt eco-profile',
        description: 'Run power-capped at 70% TDP for peak tokens/watt efficiency and near-zero thermal wear.',
        partnerUrl: '#marketplace-hw-gpu',
        badge: 'MAX EARNINGS',
      },
      {
        id: 'mkt_hw_ups',
        category: 'hardware',
        title: 'Pure Sine-Wave Smart UPS + Wattage Meter',
        vendor: 'GreenGrid Hardware Partner',
        priceUsd: 149,
        billing: 'hardware',
        affiliatePct: 8,
        powerBoostNote: 'Protects GPU against voltage spikes & logs verified green kWh telemetry',
        description: 'Prevents sudden brownouts during active enterprise inference jobs and feeds real-time wattage to SylvaWatt.',
        partnerUrl: '#marketplace-hw-ups',
        badge: 'HARDWARE GUARD',
      },
    ],
    sponsorAds: [
      {
        id: 'ad_green_solar',
        sponsor: 'NordicEco Power',
        headline: 'Switch to 100% Hydro/Wind Home Tariff & Boost Node Net Profit by 28%',
        ctaText: 'Check Off-Peak Green Rates',
        cpmUsd: 14.5,
        impressions: 12480,
        clicks: 418,
      },
      {
        id: 'ad_safdo_vpn',
        sponsor: 'DevOps Invent Security',
        headline: 'Protect Your Home Network From Internet Threats While Your PC Earns',
        ctaText: 'Enable Zero-Trust Firewall',
        cpmUsd: 18.0,
        impressions: 9840,
        clicks: 512,
      },
    ],
    revenueLedger: {
      brokerageFeesEarnedUsd: 1842.60,
      affiliateCommissionsUsd: 624.40,
      sponsorAdRevenueUsd: 492.15,
      selfHostedLicensesUsd: 1470.00,
    },
    walletTransactions: [
      {
        id: 'tx_101',
        type: 'JOB_PAYOUT',
        description: 'Completed NordicFin 14B Inference Shard (4.0 hrs · Net after 12% fee)',
        amountUsd: 3.24,
        waterSavedLiters: 9.8,
        createdAt: new Date(Date.now() - 86400 * 1000).toISOString(),
      },
      {
        id: 'tx_102',
        type: 'JOB_PAYOUT',
        description: 'Completed GeoClimate Drought Model Batch (6.0 hrs)',
        amountUsd: 6.55,
        waterSavedLiters: 14.7,
        createdAt: new Date(Date.now() - 43200 * 1000).toISOString(),
      },
    ],
    securityAuditLog: [
      {
        id: 'sec_1',
        event: 'SANDBOX_CONTAINER_VERIFIED',
        detail: 'Workload SHA-256 matched; zero outbound LAN socket attempts blocked.',
        severity: 'PASS',
        timestamp: new Date(Date.now() - 1200 * 1000).toISOString(),
      },
      {
        id: 'sec_2',
        event: 'HUMAN_THERMAL_CAP_ENFORCED',
        detail: 'Thermal cutoff verified at 74°C; hardware running in Nominal state.',
        severity: 'PASS',
        timestamp: new Date(Date.now() - 600 * 1000).toISOString(),
      },
    ],
  };
}

class Store {
  constructor(dataDir) {
    this.dataDir = dataDir;
    fs.mkdirSync(this.dataDir, { recursive: true });
    this.filePath = path.join(this.dataDir, 'sylvawatt-store.json');
    this.data = this.load();
  }

  load() {
    if (!fs.existsSync(this.filePath)) {
      const initial = seedInitialData();
      this.save(initial);
      return initial;
    }
    try {
      return JSON.parse(fs.readFileSync(this.filePath, 'utf8'));
    } catch {
      const initial = seedInitialData();
      this.save(initial);
      return initial;
    }
  }

  save(nextData = this.data) {
    this.data = nextData;
    const tmp = `${this.filePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    fs.renameSync(tmp, this.filePath);
  }

  findUserByEmail(email) {
    const clean = String(email || '').trim().toLowerCase();
    return this.data.users.find((u) => u.email.toLowerCase() === clean) || null;
  }

  findUserById(id) {
    return this.data.users.find((u) => u.id === id) || null;
  }
}

module.exports = { Store };

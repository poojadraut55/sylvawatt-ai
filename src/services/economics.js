/*
 * Author: DevOps Invent Private Limited
 * Copyright 2026 DevOps Invent Private Limited. All rights reserved.
 */
'use strict';

/**
 * SylvaWatt Economics, Water-Scarcity Offset & Hardware Upgrade ROI Engine.
 * Calibrated transparently to prove net profitability after local power costs
 * and quantify fresh water saved versus hyperscale evaporative data centers.
 */

const HARDWARE_TIERS = Object.freeze({
  'm4-16gb': {
    id: 'm4-16gb',
    label: 'Apple Silicon M4 (16GB Unified)',
    vramGb: 16,
    baseWatts: 38,
    grossRatePerHr: 0.42,
    powerScore: 62,
    unlockedModelTier: '14B Quantized Inference & Voice',
  },
  'm4-pro-48gb': {
    id: 'm4-pro-48gb',
    label: 'Apple M4 Pro / Max (48GB+ Unified)',
    vramGb: 48,
    baseWatts: 68,
    grossRatePerHr: 0.96,
    powerScore: 86,
    unlockedModelTier: '32B–70B Enterprise Shards',
  },
  'rtx-3070-8gb': {
    id: 'rtx-3070-8gb',
    label: 'NVIDIA RTX 3070 (8GB VRAM)',
    vramGb: 8,
    baseWatts: 185,
    grossRatePerHr: 0.38,
    powerScore: 54,
    unlockedModelTier: '7B–8B Fast Chat & Embeddings',
  },
  'rtx-4070-ti-12gb': {
    id: 'rtx-4070-ti-12gb',
    label: 'NVIDIA RTX 4070 Ti (12GB VRAM)',
    vramGb: 12,
    baseWatts: 220,
    grossRatePerHr: 0.64,
    powerScore: 73,
    unlockedModelTier: '14B–22B Coding & RAG Pipelines',
  },
  'rtx-4090-24gb': {
    id: 'rtx-4090-24gb',
    label: 'NVIDIA RTX 4090 Workstation (24GB VRAM + 64GB RAM)',
    vramGb: 24,
    baseWatts: 315,
    grossRatePerHr: 1.38,
    powerScore: 95,
    unlockedModelTier: '70B Enterprise Batch + LoRA Fine-Tuning',
  },
});

const UPGRADE_MODULES = Object.freeze({
  'ram-32gb': {
    id: 'ram-32gb',
    label: '+32GB High-Speed DDR5 / Memory Pool',
    hardwareCostUsd: 115,
    scoreBoost: 11,
    rateMultiplier: 1.24,
    extraWatts: 8,
    unlockNote: 'Unlocks larger context windows (32K) for Enterprise RAG jobs.',
  },
  'gpu-rtx4090': {
    id: 'gpu-rtx4090',
    label: 'Upgrade GPU to RTX 4090 / Dual-Node Accelerator',
    hardwareCostUsd: 1490,
    scoreBoost: 28,
    rateMultiplier: 2.35,
    extraWatts: 95,
    unlockNote: 'Unlocks Tier-1 Enterprise 70B inference & priority overnight batches.',
  },
  'cooling-ups': {
    id: 'cooling-ups',
    label: 'Liquid Cooling + Smart UPS Surge Shield',
    hardwareCostUsd: 180,
    scoreBoost: 7,
    rateMultiplier: 1.15,
    extraWatts: 5,
    unlockNote: 'Raises safe thermal duty cycle from 65% to 82% without GPU throttling.',
  },
  'security-mesh': {
    id: 'security-mesh',
    label: 'Zero-Trust WireGuard + Container Firewall Pack',
    hardwareCostUsd: 79,
    scoreBoost: 8,
    rateMultiplier: 1.22,
    extraWatts: 0,
    unlockNote: 'Qualifies node for HIPAA/FinTech zero-data-retention premium bounties.',
  },
});

function calculateNodeEconomics({
  tierId = 'm4-16gb',
  ramGb = 16,
  maxUtilizationPct = 70,
  hoursPerDay = 10,
  electricityRateUsd = 0.14,
  brokerageFeePct = 12,
  waterLitersPerGpuHour = 2.45,
  coolingKwhSavedPerGpuHour = 0.24,
  co2KgSavedPerGpuHour = 0.19,
} = {}) {
  const tier = HARDWARE_TIERS[tierId] || HARDWARE_TIERS['m4-16gb'];
  const utilFactor = Math.max(0.1, Math.min(0.95, Number(maxUtilizationPct) / 100));
  const hrsPerMonth = Math.max(1, Math.min(24, Number(hoursPerDay))) * 30;
  const ramBonusMultiplier = ramGb >= 64 ? 1.25 : ramGb >= 32 ? 1.12 : 1.0;

  const effectiveGrossHr = tier.grossRatePerHr * (0.45 + utilFactor * 0.72) * ramBonusMultiplier;
  const grossMonthlyUsd = effectiveGrossHr * hrsPerMonth;
  const platformFeeUsd = grossMonthlyUsd * (brokerageFeePct / 100);
  const providerPayoutUsd = grossMonthlyUsd - platformFeeUsd;

  const activeWatts = tier.baseWatts * (0.35 + utilFactor * 0.65);
  const monthlyKwh = (activeWatts * hrsPerMonth) / 1000;
  const electricityCostUsd = monthlyKwh * Math.max(0.01, Number(electricityRateUsd));

  // Net profit directly answers "does it beat electricity cost?"
  const netMonthlyProfitUsd = providerPayoutUsd - electricityCostUsd;
  const profitMarginPct = providerPayoutUsd > 0
    ? Math.max(0, (netMonthlyProfitUsd / providerPayoutUsd) * 100)
    : 0;

  // Environmental impact vs hyperscale evaporative cooling data centers
  const effectiveComputeHours = hrsPerMonth * utilFactor;
  const waterSavedLiters = effectiveComputeHours * waterLitersPerGpuHour;
  const waterSavedGallons = waterSavedLiters * 0.264172;
  const coolingKwhSaved = effectiveComputeHours * coolingKwhSavedPerGpuHour;
  const co2SavedKg = effectiveComputeHours * co2KgSavedPerGpuHour;

  const powerScore = Math.min(99, Math.round(tier.powerScore + (ramGb >= 32 ? 6 : 0) + (utilFactor >= 0.7 ? 4 : 0)));

  return {
    tier: tier.label,
    tierId: tier.id,
    powerScore,
    unlockedModelTier: tier.unlockedModelTier,
    effectiveHourlyGrossUsd: Number(effectiveGrossHr.toFixed(2)),
    monthlyHours: Math.round(hrsPerMonth),
    grossMonthlyUsd: Number(grossMonthlyUsd.toFixed(2)),
    platformFeePct: brokerageFeePct,
    platformFeeUsd: Number(platformFeeUsd.toFixed(2)),
    providerPayoutUsd: Number(providerPayoutUsd.toFixed(2)),
    electricityCostUsd: Number(electricityCostUsd.toFixed(2)),
    netMonthlyProfitUsd: Number(netMonthlyProfitUsd.toFixed(2)),
    netProfitMarginPct: Number(profitMarginPct.toFixed(1)),
    activeWatts: Math.round(activeWatts),
    ecoImpact: {
      waterSavedLitersMonth: Number(waterSavedLiters.toFixed(1)),
      waterSavedGallonsMonth: Number(waterSavedGallons.toFixed(1)),
      coolingKwhSavedMonth: Number(coolingKwhSaved.toFixed(1)),
      co2SavedKgMonth: Number(co2SavedKg.toFixed(1)),
    },
  };
}

function simulateUpgrades(baseInput = {}, selectedUpgrades = []) {
  const baseline = calculateNodeEconomics(baseInput);
  let rateMultiplier = 1;
  let scoreBoost = 0;
  let totalUpgradeCostUsd = 0;
  let extraWatts = 0;
  const applied = [];

  for (const uid of selectedUpgrades) {
    const mod = UPGRADE_MODULES[uid];
    if (!mod) continue;
    rateMultiplier *= mod.rateMultiplier;
    scoreBoost += mod.scoreBoost;
    totalUpgradeCostUsd += mod.hardwareCostUsd;
    extraWatts += mod.extraWatts;
    applied.push(mod);
  }

  const boostedGross = baseline.grossMonthlyUsd * rateMultiplier;
  const boostedFee = boostedGross * (baseline.platformFeePct / 100);
  const boostedPayout = boostedGross - boostedFee;
  const extraKwh = (extraWatts * baseline.monthlyHours) / 1000;
  const boostedPowerCost = baseline.electricityCostUsd + extraKwh * Number(baseInput.electricityRateUsd || 0.14);
  const boostedNet = boostedPayout - boostedPowerCost;
  const incrementalMonthlyGainUsd = Math.max(0, boostedNet - baseline.netMonthlyProfitUsd);
  const paybackMonths = incrementalMonthlyGainUsd > 0 && totalUpgradeCostUsd > 0
    ? Number((totalUpgradeCostUsd / incrementalMonthlyGainUsd).toFixed(1))
    : 0;

  return {
    baseline,
    upgraded: {
      powerScore: Math.min(100, baseline.powerScore + scoreBoost),
      grossMonthlyUsd: Number(boostedGross.toFixed(2)),
      providerPayoutUsd: Number(boostedPayout.toFixed(2)),
      electricityCostUsd: Number(boostedPowerCost.toFixed(2)),
      netMonthlyProfitUsd: Number(boostedNet.toFixed(2)),
      incrementalMonthlyGainUsd: Number(incrementalMonthlyGainUsd.toFixed(2)),
      totalUpgradeCostUsd,
      paybackMonths,
      appliedUpgrades: applied,
    },
  };
}

module.exports = {
  HARDWARE_TIERS,
  UPGRADE_MODULES,
  calculateNodeEconomics,
  simulateUpgrades,
};

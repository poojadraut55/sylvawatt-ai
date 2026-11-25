/* SylvaWatt AI Frontend Controller — strictly CSP-compliant, zero inline scripts */
'use strict';

const state = {
  user: null,
  controls: null,
  telemetry: null,
  tiers: [],
  upgrades: [],
  selectedUpgrades: new Set(['ram-32gb', 'security-mesh']),
  mktFilter: 'all',
  marketplaceItems: [],
  sponsorAds: [],
  pollTimer: null,
};

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 3200);
}

async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'same-origin',
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function setLoggedIn(user) {
  state.user = user;
  document.getElementById('login-view').classList.add('hidden');
  document.getElementById('app-shell').classList.remove('hidden');
  document.getElementById('user-name-label').textContent = user.name;
  document.getElementById('user-role-badge').textContent = user.role;
  document.getElementById('kpi-wallet').textContent = `$${Number(user.walletBalanceUsd || 0).toFixed(2)}`;
  refreshAllData();
  if (!state.pollTimer) {
    state.pollTimer = setInterval(loadTelemetryAndKpis, 5000);
  }
}

function setLoggedOut() {
  state.user = null;
  if (state.pollTimer) {
    clearInterval(state.pollTimer);
    state.pollTimer = null;
  }
  document.getElementById('app-shell').classList.add('hidden');
  document.getElementById('login-view').classList.remove('hidden');
}

async function loginWith(email, password) {
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const data = await api('api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setLoggedIn(data.user);
    showToast(`Signed in as ${data.user.name}`);
  } catch (err) {
    errEl.textContent = err.message;
  }
}

async function loadTelemetryAndKpis() {
  try {
    const [telRes, econRes, ecoRes] = await Promise.all([
      api('api/telemetry/live'),
      api('api/economics/calculate', { method: 'POST', body: '{}' }),
      api('api/eco/impact'),
    ]);
    state.telemetry = telRes.telemetry;
    state.controls = telRes.controls;

    // Update top status
    const st = telRes.telemetry.nodeStatus;
    const pill = document.getElementById('node-status-pill');
    pill.textContent = st;
    pill.className = `badge ${st === 'EARNING_GREEN_MESH' ? 'green' : st === 'PAUSED_FOR_GAMING' ? 'amber' : 'red'}`;

    document.getElementById('toggle-node-btn').textContent = telRes.controls.nodeActive ? '⏸ Pause Compute Node' : '▶ Resume Compute Node';
    document.getElementById('toggle-gaming-btn').textContent = telRes.controls.simulateGamingPause ? '🎮 Exit Gaming Mode' : '🎮 Test Gaming Auto-Pause';

    // KPIs
    document.getElementById('kpi-net-profit').textContent = `$${econRes.netMonthlyProfitUsd.toFixed(2)}/mo`;
    document.getElementById('kpi-net-sub').textContent = `Gross $${econRes.grossMonthlyUsd} − Power $${econRes.electricityCostUsd} (${econRes.netProfitMarginPct}% margin)`;
    document.getElementById('kpi-power-score').textContent = `${econRes.powerScore} / 100`;
    document.getElementById('kpi-model-tier').textContent = econRes.unlockedModelTier;

    document.getElementById('kpi-node-water').textContent = `${ecoRes.ecoTotals.nodeWaterSavedLiters.toLocaleString()} L`;
    document.getElementById('kpi-node-co2').textContent = `${ecoRes.ecoTotals.nodeCo2SavedKg.toLocaleString()} kg CO₂ avoided`;

    // Telemetry card
    const t = telRes.telemetry;
    document.getElementById('tel-source-badge').textContent = t.source;
    document.getElementById('tel-hardware-model').textContent = `${t.hardware.model} · ${t.hardware.cores} Cores · Allocatable Cap ${t.safetyGuard.allocatableComputePct}% (${t.safetyGuard.estimatedPowerWatts}W)`;
    document.getElementById('tel-cpu-val').textContent = `${t.cpu.averagePercent}%`;
    document.getElementById('tel-cpu-bar').style.width = `${Math.min(100, t.cpu.averagePercent)}%`;
    document.getElementById('tel-ram-val').textContent = `${t.memory.usedGb} / ${t.memory.totalGb} GB (${t.memory.pressure})`;
    document.getElementById('tel-ram-bar').style.width = `${Math.min(100, t.memory.percent)}%`;
    document.getElementById('tel-therm-val').textContent = `${t.hardware.thermalState} (${t.hardware.estimatedTempC}°C / ${t.safetyGuard.thermalCutoffC}°C cap)`;

    const loadedList = (t.ollama && t.ollama.loaded && t.ollama.loaded.length)
      ? t.ollama.loaded.map((m) => `${m.name} (${m.vramGb}GB)`).join(', ')
      : `${(t.ollama && t.ollama.available && t.ollama.available.length) || 0} local Ollama models ready`;
    document.getElementById('tel-ollama-models').textContent = `Local AI Engine: ${loadedList}`;

    // Sync sliders if first load
    document.getElementById('ctrl-max-util').value = telRes.controls.maxUtilizationPct;
    document.getElementById('ctrl-max-util-val').textContent = `${telRes.controls.maxUtilizationPct}%`;
    document.getElementById('ctrl-therm-cap').value = telRes.controls.thermalCutoffC;
    document.getElementById('ctrl-therm-cap-val').textContent = `${telRes.controls.thermalCutoffC}°C`;
    document.getElementById('ctrl-schedule').value = telRes.controls.scheduleMode;
    document.getElementById('ctrl-kwh-rate').value = telRes.controls.electricityRateUsd;
    document.getElementById('chk-inf').checked = telRes.controls.approvedWorkloads.encryptedInference;
    document.getElementById('chk-lora').checked = telRes.controls.approvedWorkloads.loraMicroTuning;
    document.getElementById('chk-vis').checked = telRes.controls.approvedWorkloads.zeroRetentionVision;

    // Eco Impact tab
    document.getElementById('eco-global-water').textContent = `${Math.round(ecoRes.ecoTotals.globalWaterSavedLiters).toLocaleString()} L`;
    document.getElementById('eco-global-kwh').textContent = `${Math.round(ecoRes.ecoTotals.globalCoolingKwhSaved).toLocaleString()} kWh`;
    document.getElementById('eco-global-co2').textContent = `${Math.round(ecoRes.ecoTotals.globalCo2SavedKg).toLocaleString()} kg`;
    document.getElementById('eco-global-nodes').textContent = ecoRes.ecoTotals.globalActiveNodes.toLocaleString();
  } catch (err) {
    console.warn('Telemetry refresh error:', err.message);
  }
}

async function loadAdvisorAndUpgrades() {
  const data = await api('api/economics/tiers');
  state.tiers = data.tiers;
  state.upgrades = data.upgrades;

  const tierSelect = document.getElementById('adv-tier');
  tierSelect.innerHTML = '';
  data.tiers.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = `${t.label} ($${t.grossRatePerHr}/hr)`;
    if (state.controls && state.controls.tierId === t.id) opt.selected = true;
    tierSelect.appendChild(opt);
  });

  const upList = document.getElementById('upgrade-options-list');
  upList.innerHTML = '';
  data.upgrades.forEach((u) => {
    const row = document.createElement('label');
    row.className = 'job-card';
    row.style.cursor = 'pointer';
    const checked = state.selectedUpgrades.has(u.id) ? 'checked' : '';
    row.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:10px;">
        <div>
          <input type="checkbox" class="upgrade-chk" value="${u.id}" ${checked}>
          <strong>${u.label}</strong>
        </div>
        <span class="badge green">+$${u.hardwareCostUsd} Cost</span>
      </div>
      <div class="small muted">${u.unlockNote}</div>
    `;
    upList.appendChild(row);
  });

  upList.querySelectorAll('.upgrade-chk').forEach((chk) => {
    chk.addEventListener('change', () => {
      if (chk.checked) state.selectedUpgrades.add(chk.value);
      else state.selectedUpgrades.delete(chk.value);
      runEconomicsAndUpgrades();
    });
  });

  await runEconomicsAndUpgrades();
}

async function runEconomicsAndUpgrades() {
  const payload = {
    tierId: document.getElementById('adv-tier').value || 'm4-16gb',
    ramGb: Number(document.getElementById('adv-ram').value || 16),
    hoursPerDay: Number(document.getElementById('adv-hours').value || 11),
    maxUtilizationPct: Number(document.getElementById('ctrl-max-util').value || 68),
    electricityRateUsd: Number(document.getElementById('ctrl-kwh-rate').value || 0.14),
    upgrades: Array.from(state.selectedUpgrades),
  };
  const sim = await api('api/economics/upgrade-sim', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const b = sim.baseline;
  document.getElementById('econ-breakdown').innerHTML = `
    <div class="control-head"><span>Gross Compute Value (${b.monthlyHours}h)</span><strong>$${b.grossMonthlyUsd}/mo</strong></div>
    <div class="control-head"><span>12% Network Brokerage Fee</span><span>−$${b.platformFeeUsd}/mo</span></div>
    <div class="control-head"><span>Estimated Electricity Cost (${b.activeWatts}W draw)</span><span>−$${b.electricityCostUsd}/mo</span></div>
    <div class="control-head" style="border-top:1px solid var(--line); padding-top:8px; margin-top:6px;">
      <strong>True Net Provider Profit</strong>
      <strong style="color:#34d399; font-size:1.25rem;">$${b.netMonthlyProfitUsd}/mo</strong>
    </div>
    <div class="small" style="color:#7dd3fc; margin-top:6px;">💧 Saves ${b.ecoImpact.waterSavedLitersMonth} L fresh water &amp; ${b.ecoImpact.co2SavedKgMonth} kg CO₂ per month</div>
  `;

  const u = sim.upgraded;
  document.getElementById('upgrade-sim-result').innerHTML = `
    <div class="control-head"><span>Upgraded Compute Score</span><span class="badge green">${b.powerScore} → ${u.powerScore} / 100</span></div>
    <div class="control-head"><span>Projected Monthly Net Profit</span><strong style="color:#34d399;">$${u.netMonthlyProfitUsd}/mo (+$${u.incrementalMonthlyGainUsd}/mo)</strong></div>
    <div class="control-head"><span>Estimated Hardware Payback</span><strong>${u.paybackMonths ? `${u.paybackMonths} months` : 'Select upgrades above'}</strong></div>
  `;
}

async function loadJobs() {
  const data = await api('api/jobs');
  const el = document.getElementById('jobs-list');
  el.innerHTML = '';
  data.jobs.forEach((job) => {
    const card = document.createElement('div');
    card.className = 'job-card';
    const done = job.status === 'COMPLETED';
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:10px;">
        <div>
          <span class="badge ${done ? 'green' : 'water'}">${job.company} · ${job.status}</span>
          <h4 style="margin:6px 0 4px;">${job.title}</h4>
          <div class="job-meta small muted">
            <span>Min VRAM: ${job.minVramGb}GB</span> ·
            <span>Duration: ${job.estimatedHours}h</span> ·
            <span>🔒 ${job.securityTier}</span> ·
            <span style="color:#7dd3fc;">💧 Saves ${job.waterSavedLiters} L water</span>
          </div>
        </div>
        <div style="text-align:right; min-width:130px;">
          <div style="font-size:1.18rem; font-weight:800; color:#34d399;">$${job.payoutPerHourUsd.toFixed(2)}/hr</div>
          <button type="button" class="btn ${done ? 'sm' : 'primary sm'} accept-job-btn" data-id="${job.id}" ${done ? 'disabled' : ''}>
            ${done ? '✓ Executed' : '⚡ Accept & Earn'}
          </button>
        </div>
      </div>
    `;
    el.appendChild(card);
  });

  el.querySelectorAll('.accept-job-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        const res = await api(`api/jobs/${btn.dataset.id}/accept`, { method: 'POST', body: '{}' });
        document.getElementById('kpi-wallet').textContent = `$${res.walletBalanceUsd.toFixed(2)}`;
        showToast(`Earned +$${res.providerPayoutUsd} net! Saved ${res.job.waterSavedLiters}L fresh water.`);
        await Promise.all([loadJobs(), loadTelemetryAndKpis(), loadWallet(), loadMarketplace()]);
      } catch (err) {
        showToast(err.message);
      }
    });
  });
}

async function loadMarketplace() {
  const [mkt, rev] = await Promise.all([api('api/marketplace/catalog'), api('api/revenue/overview')]);
  state.marketplaceItems = mkt.items;
  state.sponsorAds = mkt.sponsorAds;

  // Sponsor ad slot inside Overview
  const ad = mkt.sponsorAds[0];
  if (ad) {
    document.getElementById('overview-sponsor-slot').innerHTML = `
      <div>
        <span class="badge water">Sponsored Eco-Partner · ${ad.sponsor}</span>
        <div style="font-weight:700; margin-top:4px;">${ad.headline}</div>
      </div>
      <button type="button" class="btn water sm" id="click-sponsor-ad-btn" data-ad="${ad.id}">${ad.ctaText} →</button>
    `;
    document.getElementById('click-sponsor-ad-btn').addEventListener('click', async (e) => {
      await api('api/marketplace/affiliate-click', { method: 'POST', body: JSON.stringify({ adId: e.target.dataset.ad }) });
      showToast(`Opened partner offer from ${ad.sponsor} (+ad click revenue tracked)`);
      loadMarketplace();
    });
  }

  // Revenue totals
  const l = rev.revenueLedger;
  document.getElementById('rev-total').textContent = `$${rev.totalPlatformRevenueUsd.toLocaleString()}`;
  document.getElementById('rev-brokerage').textContent = `$${l.brokerageFeesEarnedUsd.toLocaleString()}`;
  document.getElementById('rev-affiliate').textContent = `$${l.affiliateCommissionsUsd.toLocaleString()}`;
  document.getElementById('rev-ads').textContent = `$${l.sponsorAdRevenueUsd.toLocaleString()}`;
  document.getElementById('rev-licenses').textContent = `$${l.selfHostedLicensesUsd.toLocaleString()}`;

  renderMarketplaceGrid();
}

function renderMarketplaceGrid() {
  const grid = document.getElementById('marketplace-grid');
  grid.innerHTML = '';
  const filtered = state.marketplaceItems.filter((it) => state.mktFilter === 'all' || it.category === state.mktFilter);
  filtered.forEach((it) => {
    const card = document.createElement('div');
    card.className = 'mkt-card';
    card.innerHTML = `
      <div>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="badge ${it.category === 'security' ? 'water' : 'green'}">${it.badge}</span>
          <strong>$${it.priceUsd}</strong>
        </div>
        <h4 style="margin:10px 0 6px;">${it.title}</h4>
        <p class="small muted">${it.description}</p>
        <div class="small" style="color:#6ee7b7; margin-top:6px;">⚡ ${it.powerBoostNote}</div>
      </div>
      <button type="button" class="btn primary sm mkt-buy-btn" data-item="${it.id}">
        ${it.category === 'security' ? '🛡️ Enable Security Pack' : '🛒 Order Hardware Upgrade'} →
      </button>
    `;
    grid.appendChild(card);
  });

  grid.querySelectorAll('.mkt-buy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const res = await api('api/marketplace/affiliate-click', {
        method: 'POST',
        body: JSON.stringify({ itemId: btn.dataset.item }),
      });
      showToast(res.message);
      loadMarketplace();
    });
  });
}

async function loadWallet() {
  try {
    const w = await api('api/wallet');
    document.getElementById('kpi-wallet').textContent = `$${w.balanceUsd.toFixed(2)}`;
    document.getElementById('wallet-tx-list').innerHTML = w.transactions.map((tx) => `
      <div class="job-card" style="padding:12px;">
        <div style="display:flex; justify-content:space-between;">
          <strong>${tx.type}</strong>
          <strong style="color:${tx.amountUsd >= 0 ? '#34d399' : '#f59e0b'};">${tx.amountUsd >= 0 ? '+' : ''}$${tx.amountUsd.toFixed(2)}</strong>
        </div>
        <div class="small muted">${tx.description}</div>
      </div>
    `).join('');

    document.getElementById('sec-audit-list').innerHTML = w.securityAuditLog.map((s) => `
      <div class="job-card" style="padding:12px;">
        <div style="display:flex; justify-content:space-between;">
          <strong class="mono small">${s.event}</strong>
          <span class="badge green">${s.severity}</span>
        </div>
        <div class="small muted">${s.detail}</div>
      </div>
    `).join('');
  } catch (err) {
    console.warn(err.message);
  }
}

async function refreshAllData() {
  await Promise.all([loadTelemetryAndKpis(), loadAdvisorAndUpgrades(), loadJobs(), loadMarketplace(), loadWallet()]);
}

// Event bindings
document.querySelectorAll('.role-btn').forEach((btn) => {
  btn.addEventListener('click', () => loginWith(btn.dataset.demoEmail, btn.dataset.demoPass));
});

document.getElementById('login-form').addEventListener('submit', (e) => {
  e.preventDefault();
  loginWith(document.getElementById('login-email').value, document.getElementById('login-password').value);
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await api('api/auth/logout', { method: 'POST', body: '{}' });
  setLoggedOut();
});

const TAB_TITLES = {
  overview: 'Human-Controlled Node & Live Telemetry',
  advisor: 'Earnings Calculator & Hardware Power Advisor',
  jobs: 'Enterprise ↔ Home Compute Bridge',
  eco: 'Global Water Scarcity & Green AI Impact',
  marketplace: 'Hardware, Cybersecurity & Ad Monetization Hub',
  wallet: 'Provider Cash Payouts & AppSec Audit',
  opensource: 'Open-Source Movement & DevOps Invent Ownership',
};

document.querySelectorAll('.nav-item').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach((n) => n.classList.remove('active'));
    btn.classList.add('active');
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.add('hidden'));
    document.getElementById(`tab-${tab}`).classList.remove('hidden');
    document.getElementById('page-title').textContent = TAB_TITLES[tab] || 'SylvaWatt AI';
  });
});

document.getElementById('ctrl-max-util').addEventListener('input', (e) => {
  document.getElementById('ctrl-max-util-val').textContent = `${e.target.value}%`;
});
document.getElementById('ctrl-therm-cap').addEventListener('input', (e) => {
  document.getElementById('ctrl-therm-cap-val').textContent = `${e.target.value}°C`;
});

document.getElementById('save-controls-btn').addEventListener('click', async () => {
  await api('api/node/controls', {
    method: 'POST',
    body: JSON.stringify({
      maxUtilizationPct: Number(document.getElementById('ctrl-max-util').value),
      thermalCutoffC: Number(document.getElementById('ctrl-therm-cap').value),
      scheduleMode: document.getElementById('ctrl-schedule').value,
      electricityRateUsd: Number(document.getElementById('ctrl-kwh-rate').value),
      approvedWorkloads: {
        encryptedInference: document.getElementById('chk-inf').checked,
        loraMicroTuning: document.getElementById('chk-lora').checked,
        zeroRetentionVision: document.getElementById('chk-vis').checked,
      },
    }),
  });
  showToast('Human sovereignty & thermal limits saved!');
  loadTelemetryAndKpis();
});

document.getElementById('toggle-node-btn').addEventListener('click', async () => {
  const nextActive = !(state.controls && state.controls.nodeActive);
  await api('api/node/controls', { method: 'POST', body: JSON.stringify({ nodeActive: nextActive }) });
  showToast(nextActive ? 'Compute node resumed' : 'Compute node paused by user');
  loadTelemetryAndKpis();
});

document.getElementById('toggle-gaming-btn').addEventListener('click', async () => {
  const nextGaming = !(state.controls && state.controls.simulateGamingPause);
  await api('api/node/controls', { method: 'POST', body: JSON.stringify({ simulateGamingPause: nextGaming }) });
  showToast(nextGaming ? 'Gaming detected — AI paused in <200ms!' : 'Gaming ended — AI node safely resumed!');
  loadTelemetryAndKpis();
});

document.getElementById('run-bench-btn').addEventListener('click', async () => {
  showToast('Running live hardware inference benchmark...');
  const b = await api('api/telemetry/benchmark', { method: 'POST', body: '{}' });
  showToast(`Verified: ${b.computeScore}/100 Power Score · ${b.estimatedTokensPerSec} tok/s`);
  loadWallet();
});

document.getElementById('calc-econ-btn').addEventListener('click', runEconomicsAndUpgrades);
document.getElementById('adv-tier').addEventListener('change', runEconomicsAndUpgrades);

document.getElementById('post-job-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const titleEl = document.getElementById('job-title');
  const res = await api('api/jobs', {
    method: 'POST',
    body: JSON.stringify({
      company: document.getElementById('job-company').value,
      title: titleEl.value,
      minVramGb: Number(document.getElementById('job-vram').value),
      payoutPerHourUsd: Number(document.getElementById('job-rate').value),
      estimatedHours: Number(document.getElementById('job-hours').value),
    }),
  });
  titleEl.value = '';
  showToast(`Dispatched '${res.job.title}' (${res.job.waterSavedLiters}L water saved)!`);
  loadJobs();
});

document.querySelectorAll('.mkt-filter').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.mktFilter = btn.dataset.cat;
    renderMarketplaceGrid();
  });
});

document.getElementById('payout-btn').addEventListener('click', async () => {
  try {
    const res = await api('api/wallet/payout', {
      method: 'POST',
      body: JSON.stringify({
        amountUsd: Number(document.getElementById('payout-amount').value),
        method: document.getElementById('payout-method').value,
      }),
    });
    showToast(`Withdrawal processed! New balance: $${res.balanceUsd.toFixed(2)}`);
    loadWallet();
  } catch (err) {
    showToast(err.message);
  }
});

// Check existing session on boot
api('api/auth/me')
  .then((d) => { if (d.authenticated) setLoggedIn(d.user); })
  .catch(() => setLoggedOut());

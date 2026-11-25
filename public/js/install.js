/* Installer client script (CSP-clean) */
'use strict';

document.getElementById('install-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const statusEl = document.getElementById('install-status');
  statusEl.textContent = 'Initializing network broker & saving configuration...';
  try {
    const res = await fetch('api/install/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operatorEmail: document.getElementById('ins-email').value,
        brokeragePct: Number(document.getElementById('ins-fee').value),
        dataMode: document.getElementById('ins-mode').value,
      }),
    });
    if (!res.ok) throw new Error('Setup failed');
    statusEl.innerHTML = '<span class="badge green">Setup Complete</span> <a href="./">Open SylvaWatt Control Center →</a>';
  } catch (err) {
    statusEl.textContent = `Error: ${err.message}`;
  }
});

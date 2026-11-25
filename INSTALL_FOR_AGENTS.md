# 🤖 Agent Setup Guide — SylvaWatt AI (`INSTALL_FOR_AGENTS.md`)

Follow these exact instructions to bootstrap **SylvaWatt AI** in under 60 seconds:

1. Verify `node -v` is `v20+`.
2. Run inside the repository root:
   ```bash
   npm install --no-audit --no-fund
   cp .env.example .env
   npm test
   npm start
   ```
3. Verify health endpoint:
   ```bash
   curl -s http://127.0.0.1:8792/api/health
   ```
4. Open `http://127.0.0.1:8792` in browser and sign in with demo role:
   - **Home Provider Node:** `provider@sylvawatt.io` / `demo123`
   - **Enterprise Requester:** `enterprise@acme-ai.io` / `demo123`
   - **Operator Admin:** `admin@sylvawatt.io` / `demo123`
5. Never commit real `.env` keys or tokens. Preserve **DevOps Invent Private Limited** ownership & `LICENSE` constraints.

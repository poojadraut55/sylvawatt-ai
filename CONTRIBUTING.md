# 🤝 Contributing to SylvaWatt AI

We welcome developers, climate advocates, Linux/macOS/Windows systems hackers, and AppSec researchers to build a greener, human-controlled compute network!

## Priority Open-Source Contribution Areas
1. **Cross-Platform GPU Telemetry Probes** (`src/services/telemetry.js`): `nvidia-smi`, `rocm-smi`, Intel Arc, Apple Metal `powermetrics` wrappers without elevated root bloat.
2. **Regional Grid Water & Carbon APIs** (`src/services/economics.js`): Live regional WUE / PUE / electricity rate estimators.
3. **Zero-Trust Sandbox Adapters**: Strict eBPF / Firecracker / Docker rootless isolation for zero-retention inference containers.
4. **Game & Creator Auto-Pause Detectors**: Zero-latency foreground process hooks so creators/gamers never notice frame drops.

## Rules & Licensing
- All contributions are submitted under the **DevOps Invent Source-Available Non-Commercial Community License** (`LICENSE`).
- Keep **ZERO real secrets, API keys, or personal data** in commits or PRs.
- Run `npm test` before submitting any pull request.

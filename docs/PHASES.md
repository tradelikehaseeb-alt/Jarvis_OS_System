# Jarvis OS Delivery Phases

| Phase | Scope | Status |
|-------|--------|--------|
| **0** | Monorepo scaffold, config, Docker, docs | Done |
| **1** | Refactor: api-gateway, memory-service, split packages | Done |
| **2** | Jarvis Core contracts + orchestrator skeleton | Done |
| **3** | API gateway contracts + app structure (routes, schemas) | Done |
| **4** | Orchestrator stub implementations (internal wiring) | Done |
| **5** | Memory service contracts + skeleton | Done |
| **6** | API gateway routes → orchestrator stubs | Done |
| **7** | Orchestrator transport abstraction (LocalCli → future HTTP/gRPC/MQ) | Done |
| **8** | Agent shared framework (`@jarvis/agents-shared`) | Done |
| **9** | Skills shared framework (`@jarvis/skills-shared`) | Done |
| **10** | Hermes + OpenClaw agent stubs | Done |
| **11** | Agent→skill pipeline (`SkillExecutor`) | Done |
| **12** | Capability-based orchestrator routing | Done |
| **13** | Concrete skills + agent pipeline wiring | Done |
| **14** | End-to-end API → orchestrator → agent → skill | Done |
| **15** | Task storage abstraction (`TaskStore`) | Done |
| **16** | Hermes/OpenClaw adapter boundaries | Done |
| **17** | Provider registry (`@jarvis/provider-registry`) | Done |
| **18** | Electron desktop UI shell | Done |
| **19** | External integration research + plans | Done |
| **20** | Runtime detection + health framework | Done |
| **21** | Official adapter implementation (spikes) | Planned |
| **17** | Plugins registry | Planned |
| **18** | SaaS (billing, tenants) | Planned |
| **19** | Hardening (observability, security) | Planned |

**Target value:** 1–4 hours/day saved (5–8+ heavy users).

# North Star

Before doing anything in this project, read:
- `.gitvision` — why this exists and what success looks like
- `.gitroadmap` — what to build, in what order, and what can run in parallel

Every implementation decision should reference these files. If a task doesn't serve the vision, question it before doing it. If a roadmap item is complete, check it off.

---

## Code Intelligence

This project is indexed with GitNexus. Before exploring or modifying any code:
- Use `mcp__gitnexus__query` to find relevant execution flows and architectural patterns
- Use `mcp__gitnexus__context` to get a 360-degree view of any symbol — callers, callees, imports, dependencies
- Use `mcp__gitnexus__impact` to understand what will break before changing something
- Use `mcp__gitnexus__route_map` to trace how data flows between entry points and handlers

Run `npx gitnexus analyze` after significant changes to keep the graph current.

---

## Production Readiness Skills

The following audit skills are installed and available globally (`~/.claude/skills/`):

| Skill | Invoke | What it audits |
|---|---|---|
| `production-readiness` | `/production-readiness` | Full orchestrated audit — delegates to all skills below |
| `security-audit` | `/security-audit` | OWASP Top 10, auth, secrets, crypto, headers |
| `compliance-check` | `/compliance-check` | GDPR, NIS2, EU AI Act, DORA, PCI-DSS, HIPAA, CCPA |
| `ai-readiness` | `/ai-readiness` | EU AI Act classification, prompt injection, RAG, hallucination |
| `test-coverage` | `/test-coverage` | 90% line+branch, integration, load, property-based tests |
| `reliability-audit` | `/reliability-audit` | Timeouts, retries+jitter, idempotency, circuit breakers |
| `observability-audit` | `/observability-audit` | Structured logs, RED metrics, OTel tracing, SLO alerting |
| `supply-chain-audit` | `/supply-chain-audit` | Lockfiles, CVEs, SBOM, container hygiene, SHA-pinned CI |
| `data-protection-audit` | `/data-protection-audit` | Encryption, KMS, PII inventory, retention, erasure |
| `accessibility-audit` | `/accessibility-audit` | WCAG 2.2 AA, EAA, keyboard, ARIA, screen readers |
| `release-readiness` | `/release-readiness` | CI gates, rollback, DB migrations, feature flags |
| `scalability-review` | `/scalability-review` | Indexes, N+1, caching, connection pools, pagination |

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Test** (4 symbols, 3 relationships, 0 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Test/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Test/clusters` | All functional areas |
| `gitnexus://repo/Test/processes` | All execution flows |
| `gitnexus://repo/Test/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

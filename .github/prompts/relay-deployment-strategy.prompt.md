---
name: Relay Deployment Strategy for 90%→99% User Coverage
description: Comprehensive plan for tiered relay deployment across user segments (indie/SMB/enterprise) using GitHub Action, Helm, Jenkins Plugin, Lambda, Terraform Provider, and Docker Universal to achieve 90%+ coverage with zero-trust architecture and minimal user burden.
---

## Plan: User-Centric Tiered Relay Strategy — 90%→99% Coverage

**TL;DR**: Segment users into **6 tiers** across indie/SMB/enterprise. **Phase 1 (GitHub Action + Helm)** captures 90% of indie + early SMB. **Phase 2 (Jenkins + Lambda)** adds 95% SMB/enterprise. **Phase 3 (Terraform + Universal Docker)** reaches 99% including self-hosted/niche. Each phase prioritizes frictionless onboarding for that segment's preferred infrastructure.

---

### Step 1: User Segmentation (Estimate Your 90%+ Base)

| Segment | % Users | Primary Tools | Relay Best Fit | Phase | Friction |
|---------|---------|---|---|---|---|
| **Indie/Startups (GitHub-native)** | 25% | GitHub + GitHub Actions | GitHub Action ⭐ | 1 | ⭐ Low |
| **Indie/Startups (other VCS)** | 8% | GitLab/Bitbucket + CI/CD | Browser WASM + Guide | 1-2 | ⭐⭐ Medium |
| **SMB (Kubernetes-native)** | 20% | GitHub/GitLab + K8s + Helm | Helm Chart | 1 | ⭐⭐ Medium |
| **SMB (Jenkins-heavy)** | 15% | GitHub/GitLab + Jenkins | Jenkins Plugin | 2 | ⭐⭐ Medium |
| **Enterprise (AWS multi-tool)** | 12% | GitHub + Lambda + Terraform + Prometheus | Lambda + Terraform Provider | 2-3 | ⭐⭐⭐ Complex |
| **Enterprise (On-prem/Self-hosted)** | 10% | GitLab on-prem + Jenkins + K8s | Docker Universal | 3 | ⭐⭐⭐ Complex |
| **Enterprise (IaC-driven)** | 5% | Terraform + GitHub + Prometheus | Terraform Provider | 3 | ⭐⭐ Medium |
| **DevOps/Platform Teams** | 3% | Multi-tool orchestration | API + Custom Integration | 3 | ⭐⭐⭐ Complex |
| **Niche/Open-source** | 2% | Gitea, Forgejo, custom tooling | Open-source Docker SDK | 3 | ⭐⭐⭐⭐ High |
| **TOTAL** | **100%** | — | — | — | — |

---

### Step 2: Phase 1 (90% Coverage) — Indie + Early SMB Focus

**Target**: Indie devs + GitHub-heavy startups (25% + 8%) + SMB with K8s (20%) = **~53% immediate, 75% with education**

**Deploy**:
- ✅ **GitHub Action** (indie GitHub-native)
- ✅ **Helm Chart** (SMB/early enterprise with K8s)
- ✅ **Documentation** (getting 8% GitLab users to use Helm via guides)

**Launch Strategy**:
```
Week 1-2: GitHub Action to GitHub Marketplace
Week 3-4: Helm Chart to Artifact Hub + docs
Week 5: Marketing push to indie/startup communities
Goal: 90% of indie + 30% of SMB on-boarded
```

**Success Metrics**:
- 500+ GitHub Action installs within 30 days
- 100+ Helm deployments within 30 days
- <5 min setup time for 95% of users
- Net Promoter Score (NPS) >50

---

### Step 3: Phase 2 (95% Coverage) — Enterprise + Jenkins Users

**Target**: SMB/Enterprise Jenkins users (15%) + AWS Lambda shops (5%) + Enterprise Terraform (5%) = **+25% new users**

**Deploy**:
- ✅ **Jenkins Plugin** (Jenkins-heavy SMB/enterprise)
- ✅ **AWS Lambda via CloudFormation** (AWS-native enterprise)
- ✅ **Docker Universal** (on-prem, docker-compose, self-hosted users)

**Launch Strategy**:
```
Month 2: Jenkins plugin published to Jenkins marketplace
Month 2: Lambda CloudFormation template in docs + quick-deploy button
Month 2: Docker compose template for self-hosted users
Goal: Capture 95% of Jenkins + 90% of Lambda users
```

**Success Metrics**:
- 200+ Jenkins plugin installs
- 50+ Lambda deployments
- 100+ Docker universal deployments
- Support requests <10% of new users (good docs)

---

### Step 4: Phase 3 (99% Coverage) — Enterprise IaC + Niche Systems

**Target**: Enterprise Terraform/IaC (5%) + on-prem GitLab (10%) + open-source/niche (2%) = **+17% final coverage**

**Deploy**:
- ✅ **Terraform Provider** (IaC-driven enterprises)
- ✅ **Docker Universal SDK** (fully customizable for any CI/CD)
- ✅ **API-first relay** (DevOps teams building custom integrations)
- ⏳ **GitLab CI Integration** (Phase 3.5, if demand)
- ⏳ **Gitea/Forgejo Support** (Phase 3.5, open-source communities)

**Launch Strategy**:
```
Month 3: Terraform provider published to Terraform Registry
Month 3: Docker SDK with code examples for CircleCI, Azure DevOps, custom
Month 4: Public API for custom relay implementations
Month 5+: Community extensions (GitLab template, CircleCI orb, etc.)
Goal: Capture 98%+ of all user segments
```

**Success Metrics**:
- Terraform provider installs in 100+ orgs
- 50+ custom integrations built via API
- Community contributions (GitLab template, etc.)
- Support requests stabilize

---

### Step 5: Friction Reduction by Segment

**Indie/Startup (GitHub-native) → 3 clicks**
```
Friction point: "Do I install the Action or use Helm?"
Solution: Smart UI detection (platform detects GitHub OAuth) → auto-suggests Action
Result: User never sees Helm option if they use GitHub
```

**SMB (Jenkins) → 2 clicks**
```
Friction point: "Where do I install plugins? How do I configure?"
Solution: 
  1. Video tutorial (30 seconds)
  2. Copy-paste Jenkins configuration (pre-filled)
  3. One-click "Install" from platform UI
Result: No Jenkins CLI knowledge needed
```

**Enterprise (Terraform) → 1 click**
```
Friction point: "I use Terraform. How do I add this?"
Solution:
  1. Copy Terraform resource code
  2. Add to existing infrastructure-as-code repo
  3. terraform apply (they already do this)
Result: Integrates seamlessly into existing IaC workflow
```

**Enterprise (On-prem) → Docker + docs**
```
Friction point: "I can't use SaaS solutions. Options?"
Solution:
  1. Docker compose template (copy-paste)
  2. Self-hosted setup docs (5 min read)
  3. Health check endpoint (verify it's working)
Result: Users can deploy on their own infrastructure
```

---

### Step 6: Timeline & Success Milestones

| Phase | Target | Month | Relay Options | Users Gained | Cumulative |
|-------|--------|-------|---|---|---|
| **1** | 90% | M1-2 | GitHub Action + Helm | 25-30% | 45-53% |
| **1+** | 90% | M3 | + Education/docs for GitLab | 25-35% | 75-90% |
| **2** | 95% | M4-5 | Jenkins Plugin + Lambda + Docker | 20% | 95% |
| **3** | 98% | M6-7 | Terraform + API + Community | 3-5% | 98-99% |
| **3+** | 99%+ | M8+ | Specialized (GitLab CI, Gitea, etc.) | 1% | 99%+ |

---

### User Journey Map by Segment

**Indie Dev (GitHub Action Path)**
```
1. Sign up for platform → Dashboard
2. "Webhooks" section shows "Connect GitHub"
3. Click "Connect GitHub"
4. OAuth → Authorize → Done
5. Sees "✅ Action installed" + webhook flowing
Total: 3 clicks, 2 minutes
```

**SMB with Jenkins**
```
1. Sign up for platform
2. "Integrations" section shows "Connect Jenkins"
3. Click "Connect Jenkins"
4. Presented with: Video (30s) + Copy/paste config + "Install" button
5. Paste config into Jenkins → Restart Jenkins → Done
Total: ~10 minutes, minimal config knowledge
```

**Enterprise with Terraform**
```
1. Org already uses Terraform
2. Platform shows: "Add Terraform provider to your code"
3. Copy code snippet:
   resource "orchestrate_relay" "github" {
     source = "orchestrate/relay"
     platform_endpoint = "..."
   }
4. terraform apply
5. Done (integrates into existing IaC workflow)
Total: ~5 minutes, zero friction (already using Terraform)
```

**Enterprise Self-Hosted**
```
1. Cannot use SaaS platform directly
2. Platform shows: "Deploy Docker container"
3. Copy docker-compose.yml snippet
4. docker-compose up
5. Configure platform endpoint in environment variables
6. Done
Total: ~15 minutes, full control/audit trail
```

---

### Open Questions

**1. GitLab CI (Major Gap?)**
   - GitLab has ~20% market share (growing)
   - Phase 1 targets GitHub → Phase 2 adds GitLab CI template?
   - **Decision**: Phase 2.5 (Month 4-5) if demand high, else Phase 3

**2. CircleCI / Azure DevOps (15% of market)**
   - Covered by Docker universal, but no native integration
   - Create Orbs/templates per platform?
   - **Decision**: Phase 3 (community-contributed), document API for custom integrations

**3. Self-Hosted Prioritization**
   - Is on-prem critical to your go-to-market?
   - If yes, move Docker universal to Phase 2
   - If no, keep in Phase 3
   - **Decision**: Recommend Phase 2 if enterprise sales focus, Phase 3 if indie focus

**4. Multi-Relay (User runs Docker + Helm + GitHub Action)**
   - Can a single user connect via multiple relay types?
   - **Decision**: Yes, Phase 2+ feature (one relay per tool, or unified?)

---

### Why This Roadmap Works

✅ **Phase 1**: Capture low-hanging fruit (GitHub users) with zero friction  
✅ **Phase 2**: Expand to SMB/enterprise with moderate friction (plugins, docs)  
✅ **Phase 3**: Reach 99% with specialized options (IaC, on-prem, API)  
✅ **Segment-first**: Each phase targets users' preferred infrastructure (not force-fitting)  
✅ **Friction-conscious**: Reduce barriers at each stage (3 clicks → 2 → 1)  
✅ **Expandable**: API layer enables community to add 100% coverage (custom CI systems)

---

**Recommendation**: Start Phase 1 (GitHub Action + Helm) this month, Phase 2 (Jenkins + Lambda + Docker) next month. This captures 90%+ while building momentum. Phase 3 can be community-driven + customer-requested (not all upfront).

# 🚀 PHASE 2 EXECUTION PLAN - NextGen WMS AI

**Date:** 25 November 2025 (Lundi)  
**Duration:** 3 Weeks (21 Days)  
**Team:** Gemini 3 (Architecture) + GPT 5.1 (Implementation) + Comet (Orchestration)  
**Budget:** Ultra-Low (~$1K infrastructure)

---

## 📊 EXECUTIVE SUMMARY

### Deliverables (End of Week 3)

✅ **Backend API Layer** - 12 core endpoints (Warehouses, Inventory, Orders, Analytics)  
✅ **Odoo Integration** - Event-driven bidirectional sync via Cloud Pub/Sub  
✅ **Frontend Pages** - Missing dashboard modules implemented (Warehouses, Products, Orders, Analytics)  
✅ **Production Ready** - Deployed to staging, ready for 5 pilot warehouses

### Success Metrics
- API response time < 200ms (p95)
- Odoo sync latency < 5 minutes
- System uptime > 99%
- Zero data conflicts (SSOT pattern enforced)

---

## 🗓️ WEEK 1: BACKEND API LAYER

### DAY 1 (Lundi) - ARCHITECTURE DESIGN

#### 🔵 GEMINI 3 Task (4-5 hours)
**Deliverable:** API Architecture Specification v1.0

**Must Include:**
1. OpenAPI 3.0 spec (12 endpoints in YAML)
2. Firestore multi-tenant schema:
   ```
   tenants/{tenantId}/
   ├─ warehouses/{warehouseId}/
   │  ├─ metadata
   │  ├─ inventory/{productId}/locations/{locationId}
   │  └─ stock_movements/{movementId}
   ├─ products/{productId}
   └─ orders/{orderId}
   ```
3. Composite index requirements
4. Security rules (multi-tenant isolation)
5. Deployment checklist

**Gemini Prompt:**
```
You are Firebase/Firestore architecture expert. Design multi-tenant WMS with:
- 3-50 warehouses per tenant
- 10K-100K SKUs per warehouse
- 50+ concurrent API users
- Odoo sync via events

Deliver OpenAPI spec + Firestore schema + indexes + security rules + deployment checklist.
Optimize for: Cost ($2/user/month), Scalability (50+ warehouses), Performance (<200ms).
```

**Output Format:** Markdown, ~3 pages, no code—specs only

#### 🔴 GPT 5.1 Task (1 hour)
**Passive Review:**
- Review Gemini spec: "Any blockers for implementation?"
- Suggest 1-2 optimizations
- Approve/request clarification

#### 👨‍💼 COMET Task
- [ ] Read Gemini spec + GPT feedback
- [ ] Ask clarifying questions (if any)
- [ ] Approve → GPT starts DAY 2

---

### DAY 2-4 (Mardi-Jeudi) - API IMPLEMENTATION

#### 🔴 GPT 5.1 (Active - 32-40 hours)
**Task:** Implement all 12 API endpoints

**Endpoints to build:**
```
Warehouses Management:
- POST /api/v1/warehouses (create)
- GET /api/v1/warehouses (list with pagination)
- GET /api/v1/warehouses/{id}
- PUT /api/v1/warehouses/{id}
- DELETE /api/v1/warehouses/{id}

Inventory Management:
- POST /api/v1/inventory/movements (record stock move)
- GET /api/v1/inventory/products (list with filters)
- GET /api/v1/inventory/products/{id}/locations
- POST /api/v1/inventory/reconciliation

Orders:
- POST /api/v1/orders (create)
- PUT /api/v1/orders/{id}/status
- GET /api/v1/orders/forecasting

Analytics:
- GET /api/v1/analytics/metrics
```

**Per endpoint, deliver:**
```typescript
// app/api/v1/[resource]/route.ts
- Request validation (Zod)
- Firebase Admin SDK calls
- Error handling (try/catch)
- Rate limiting middleware
- Request logging (Sentry)
- Unit tests (Jest)
```

**Daily Breakdown:**
- DAY 2: Endpoints 1-4 (Warehouses)
- DAY 3: Endpoints 5-8 (Inventory)
- DAY 4: Endpoints 9-12 (Orders, Analytics)

#### 🔵 GEMINI 3 (Passive)
- Answer architecture questions
- Review code for Firestore anti-patterns
- Suggest index optimizations

#### 👨‍💼 COMET
- [ ] Daily code review (end of day)
- [ ] Latency check (< 200ms?)
- [ ] Approve merge to main

---

### DAY 5 (Vendredi) - INTEGRATION TESTING

#### 🔴 GPT 5.1
- E2E test: All 12 endpoints with realistic data
- Generate cURL examples + Postman collection
- Documentation: "How to call each API"

#### 🔵 GEMINI 3
- Performance audit
- Cost audit (Firestore read cost per user)
- Suggest optimizations

#### 👨‍💼 COMET Production Readiness Checklist
- [ ] All endpoints tested
- [ ] Error handling validated
- [ ] Performance benchmarks met
- [ ] Security rules applied
- [ ] Logging working (Sentry)
- [ ] Rate limiting active
- [ ] Deploy to staging
- [ ] Final approval

**WEEK 1 DELIVERABLE:** ✅ 12 API endpoints, tested, staged

---

## 🗓️ WEEK 2: ODOO INTEGRATION (EVENT-DRIVEN)

### DAY 6 (Lundi) - ARCHITECTURE DESIGN

#### 🔵 GEMINI 3 Task (4-5 hours)
**Deliverable:** Odoo Integration Architecture v1.0

**Must Include:**
1. Cloud Pub/Sub message schema
2. Webhook receiver spec (Odoo → WMS)
3. Retry & failure handling (exponential backoff)
4. Idempotence pattern (deduplication)
5. Monitoring & observability
6. Deployment checklist

**Key Pattern:**
```json
{
  "event_id": "uuid",
  "timestamp": "ISO8601",
  "event_type": "inventory.moved",
  "tenant_id": "tenant-123",
  "warehouse_id": "wh-456",
  "payload": {...},
  "idempotency_key": "uuid"
}
```

#### 🔴 GPT 5.1
- Review architecture: "Can this be coded in 5 days?"
- Suggest simplifications

#### 👨‍💼 COMET
- Approve → GPT starts DAY 7

---

### DAY 7-9 (Mardi-Jeudi) - ODOO INTEGRATION CODING

#### 🔴 GPT 5.1 (Active - 32-40 hours)

**DAY 7:**
- Cloud Pub/Sub message producer
- Infrastructure setup scripts

**DAY 8:**
- Cloud Run consumer (message handler)
- Idempotence table in Firestore
- Webhook receiver endpoint

**DAY 9:**
- Error handling + DLQ logic
- Structured logging
- E2E test with Odoo sandbox

#### 🔵 GEMINI 3
- Daily review for architectural issues
- Security: Credentials safe?
- Cost implications

#### 👨‍💼 COMET
- [ ] Daily standup
- [ ] Odoo sandbox connection verified
- [ ] Test actual data sync

---

### DAY 10 (Vendredi) - INTEGRATION & DEPLOYMENT

#### 🔴 GPT 5.1
- Admin dashboard: `/dashboard/admin/sync-status`
- Shows real-time sync metrics

#### 🔵 GEMINI 3
- Performance audit
- Cost audit

#### 👨‍💼 COMET Production Readiness
- [ ] Pub/Sub queues working
- [ ] Webhook receiver validated
- [ ] Odoo sync end-to-end proven
- [ ] Failure recovery tested
- [ ] Monitoring alerts configured
- [ ] Deploy to production

**WEEK 2 DELIVERABLE:** ✅ Bidirectional Odoo ↔ WMS sync working

---

## 🗓️ WEEK 3: FRONTEND + STABILIZATION

### DAY 11 (Lundi) - FRONTEND PAGES

#### 🔴 GPT 5.1 (Active - 30-36 hours)

**Pages to build:**

1. **Warehouses Page**
   - List with pagination
   - Create form
   - Edit/Delete buttons

2. **Products Page**
   - Searchable SKU list
   - Stock levels per warehouse
   - Last movement timestamp

3. **Orders Page**
   - Order list with status
   - Filter by date
   - Quick details modal

4. **Analytics Page**
   - Daily stock movements chart
   - Top 10 SKUs chart
   - KPI cards (inbound/outbound)

5. **Settings Page**
   - Warehouse config
   - Webhook URL management
   - API key management

6. **AI Copilot Placeholder**
   - Chat UI (mock responses)
   - "Coming soon" banner

**Per page:**
- [ ] API endpoint integration
- [ ] Error boundary + loading states
- [ ] Pagination (50 items/page)
- [ ] Responsive design
- [ ] TypeScript types
- [ ] Unit tests

#### 🔵 GEMINI 3
- Review: Pages match API contracts?
- Suggest performance optimizations

#### 👨‍💼 COMET
- Daily code review
- Lighthouse audit check

---

### DAY 12-13 (Mardi-Mercredi) - TESTING & FINALIZATION

#### 🔴 GPT 5.1
- E2E tests (Playwright)
- Lighthouse audit
- Performance optimization

#### 🔵 GEMINI 3
- Security audit
- Cost review

#### 👨‍💼 COMET
- [ ] Production readiness checklist
- [ ] Performance targets met
- [ ] Security rules verified
- [ ] Documentation complete
- [ ] Deploy to staging

**WEEK 3 DELIVERABLE:** ✅ Full frontend + all systems integrated, production-ready

---

## 📋 ORCHESTRATION CHECKLIST (COMET)

### Daily Standups
- [ ] 10 AM CET: "What did you complete yesterday?"
- [ ] 3 PM CET: "Any blockers?"
- [ ] 6 PM CET: "Status for approval?"

### Code Review Process
```
Gemini Design ✅
  ↓
GPT Review (5 min) ✅
  ↓
GPT Code ✅
  ↓
Gemini Security/Perf Review (15 min) ✅
  ↓
Comet QA + Approval ✅
  ↓
Merge to Main
```

### Risk Mitigation
| Risk | Mitigation |
|------|----------|
| Gemini/GPT conflict | Comet = final arbiter |
| Firestore costs spike | Daily monitoring + Gemini review |
| Odoo API instability | Mock API for testing |
| Missing deadline | Prioritize: API > Odoo > Frontend |

---

## 🎯 SUCCESS CRITERIA

✅ **Week 1 End:** 12 endpoints, staged, tested  
✅ **Week 2 End:** Odoo sync working, monitored  
✅ **Week 3 End:** Full UI + stable system, ready for pilots

**Go/No-Go Decision Points:**
- EOD Day 5: "Are APIs production-ready?" → YES/NO
- EOD Day 10: "Is Odoo sync reliable?" → YES/NO
- EOD Day 13: "Is entire system ready?" → YES/NO

---

## 📞 COMMUNICATION CHANNELS

- **Slack:** `#phase2-coordination`
- **GitHub:** Issues + PRs for tracking
- **Standups:** Daily 10 AM CET
- **Decision Log:** This document (keep updated)

---

**Status:** STARTING NOW (Lundi 10 PM CET)  
**Next Milestone:** End of DAY 1 (Gemini delivers spec)  
**Questions?** Raise now before Gemini starts!

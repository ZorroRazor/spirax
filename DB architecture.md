# SPIRAX — MVP Blueprint

**Energy Control Platform • Lean Product Roadmap, Architecture & Database Design**

---


## Part 1: 12-Week MVP Roadmap

### Strategy

Ship a working energy monitoring platform in 12 weeks by building one complete data path. Defer industrial protocols (OPC UA, Modbus), AI/ML, and NLP until the data foundation is solid and early customers are generating historical data.

---

### Phase 1 — Foundation (Weeks 1–3)

**Goal:** Core data pipeline + auth working end-to-end.

**Modules:** RF-AUTH (lite), RF1 (lite), RF2 (lite)

#### 1.1 Auth & Multi-Tenant Shell (RF-AUTH)

Build:

- Email/password login with JWT sessions
- 3 roles: Admin, Editor, Viewer
- Single-tenant first, `tenant_id` on all tables for future scale
- Basic user CRUD (admin panel)

Cut:

- SSO / SAML / OAuth
- MFA
- Asset hierarchy-scoped permissions
- Audit log UI (just log to database silently)

#### 1.2 Data Ingestion — 2 Protocols Only (RF1)

Build:

- MQTT connector (covers IoT + edge — fastest to demo)
- CSV / Excel file import (covers historicals + manual bulk)
- Store & forward with local buffer
- Connection status monitoring (connected / disconnected)

Cut:

- OPC UA / OPC DA (add in Phase 2 for industrial pilots)
- Modbus, SQL DB polling, REST / Webhooks
- Advanced buffering & diagnostics panel

#### 1.3 Tag Registry — Physical Tags (RF2)

Build:

- TagUUID auto-generation (immutable identity)
- TagName (editable, unique per tenant)
- Basic metadata: unit, classification, hierarchy (flat dropdown for now)
- Simple grid editor: list, create, edit, enable/disable
- Quality flag on every data point (Good / Bad / Manual)

Cut:

- Full hierarchy tree editor
- Versioning of tag config (log changes silently)
- Advanced scaling (square root)
- Bulk operations beyond basics

#### Phase 1 Deliverable

> A user can log in, connect an MQTT broker or import a CSV, see tags appear in a grid, and confirm data is flowing into the time-series database.

---

### Phase 2 — Intelligence (Weeks 4–6)

**Goal:** Calculations, totalization & first KPIs working.

**Modules:** RF3 (core), RF4 (lite), RF5 (lite)

#### 2.1 Calculation Engine — Virtual Tags (RF3)

Build:

- Formula editor: math operations (+−×÷), IF/THEN, basic functions
- References by TagUUID internally, TagName in UI
- Dependency graph (DAG) — detect cycles, auto-order calculations
- `TOTALIZE` function with Δt-based integration (the metrological core)
- Historize calculated results to TSDB

Cut:

- Full script engine
- Group functions (SUM across dynamic tag groups)
- Formula versioning UI
- Advanced predefined function library

#### 2.2 KPI — First Pass (RF4)

Build:

- KPI as special virtual tag with target / limits
- Traffic light state: Green / Amber / Red auto-evaluation
- Fixed period contexts: day, week, month
- 3–5 predefined KPI templates (kWh/t, efficiency, specific consumption)

Cut:

- KPI by manufacturing order (OF)
- KPI templates with parameter inheritance
- Variable targets by product/period
- KPI quality propagation rules

#### 2.3 Time Periods — Simple (RF5)

Build:

- Fixed period groupings: hour, day, week, month
- Timestamp-based bucketing (never arrival-based)
- Timezone-aware with DST handling

Cut:

- Operational Contexts (shifts, OFs, campaigns)
- Dynamic context detection
- Overlapping contexts
- Full calendar management

#### Phase 2 Deliverable

> A user can create a virtual tag like `kWh = TOTALIZE(kW)`, define a KPI with target and limits, and see it evaluated with traffic-light status on a daily/monthly basis.

---

### Phase 3 — Visibility (Weeks 7–9)

**Goal:** Dashboards + alarms — the "wow" layer for demos.

**Modules:** RF6 (core), RF9 (lite), RF6.15 (lite)

#### 3.1 Dashboard Builder (RF6)

Build:

- Grid-based drag & drop layout (edit / view mode)
- 5 widget types: time series chart, KPI card, gauge, table, comparison bar
- Global time range filter (synced across widgets)
- Hierarchy filter (plant → area dropdown)
- Real-time refresh (configurable interval)
- Responsive layout (desktop + tablet)

Cut:

- Dashboard templates per sector
- Drill-down from KPI to underlying tags
- Operational context overlays on charts
- Data quality visual indicators
- Dashboard versioning & sharing

#### 3.2 Alarms — Simple but Functional (RF9)

Build:

- Threshold alarms: value > limit, value < limit
- 3 priorities: Low, Medium, High
- Alarm states: Active → Acknowledged → Resolved
- Alarm panel with filtering
- Email notifications on alarm trigger

Cut:

- Complex logical / temporal alarms
- Escalation rules
- Context-aware alarm priority
- Alarm assignment & workflow
- AI-generated alarms

#### 3.3 Manual Data Entry (RF6.15)

Build:

- Simple form: select tag, enter value, set timestamp
- Quality flag = Manual (auto-set)
- Audit trail: who entered what and when

Cut:

- Bulk manual entry grid
- Approval workflows
- Counter reading adjustments

#### Phase 3 Deliverable

> A user can build a dashboard showing real-time energy data, KPI cards with green/amber/red status, receive email alerts when consumption exceeds thresholds, and manually enter meter readings.

---

### Phase 4 — Delivery & Polish (Weeks 10–12)

**Goal:** Reports, export, hardening — ready for pilot customers.

**Modules:** RF7 (lite), RF8 (lite), RF10 (lite), NFR

#### 4.1 Reports — PDF Generation (RF7)

Build:

- 1 report template: Energy Summary (period-based)
- Auto-generated PDF with: KPI summary, consumption chart, table breakdown
- Manual generation (select period → download PDF)
- Scheduled weekly/monthly report via email

Cut:

- Report builder / custom templates
- Multiple report types
- Comments & annotations
- Report versioning

#### 4.2 Data Export (RF8)

Build:

- CSV export of any tag/KPI data with time filter
- Manual download from UI
- Scheduled daily/weekly CSV export to email

Cut:

- Excel / XLSX export
- FTP / SFTP destinations
- DB-to-DB export
- Dynamic file naming

#### 4.3 Event Engine — Minimal (RF10)

Build:

- Trigger on: alarm fired, end of period
- Actions: send email, generate report
- Simple rule editor in admin panel

Cut:

- Complex event chaining
- Action dependencies
- System actions / scripts
- Full event audit log UI

#### 4.4 Hardening & Launch Prep (NFR)

Build:

- Performance testing: dashboard load < 2s
- Error handling & graceful degradation
- Basic monitoring (ingestion rate, error count)
- Deployment automation (Docker)
- User documentation / onboarding guide

#### Phase 4 Deliverable

> A pilot customer can receive automated weekly energy reports by email, export data for external analysis, and the system is stable enough for production use.

---

### Deliberately Deferred to Post-MVP

| Module | RF | Reason | Timing |
|---|---|---|---|
| OPC UA / Modbus | RF1 | Add when targeting industrial pilots with PLCs | Month 4–5 |
| Operational Contexts & OFs | RF5 | Critical for manufacturing, but needs validated calc engine first | Month 4–5 |
| AI Module | RF11 | Needs 3+ months of historical data to train on | Month 5–6 |
| Natural Language / GPT | RF12 | Zero value without a solid data foundation | Month 6+ |
| Advanced RBAC & Hierarchy Perms | RF-AUTH | Enterprise feature, single-tenant MVP doesn't need it | Month 5 |
| Full Dashboard Templates & Sharing | RF6 | Nice-to-have after core builder is validated | Month 4 |

---

## Part 2: System Architecture

### Overview

The entire MVP runs as 4 Docker containers orchestrated by `docker-compose`. SvelteKit handles both the frontend and API (no separate backend), PostgreSQL with TimescaleDB handles both config data and time-series, and Redis serves triple duty as cache, job queue, and real-time pub/sub.

### Deployment

```yaml
services:
  app:          # SvelteKit (API + Frontend + Workers)
    build: .
    ports: ["3000:3000"]
    depends_on: [postgres, redis, mosquitto]

  postgres:     # PostgreSQL + TimescaleDB extension
    image: timescale/timescaledb:latest-pg16
    volumes: [pgdata:/var/lib/postgresql/data]

  redis:        # Cache + BullMQ backend
    image: redis:7-alpine

  mosquitto:    # MQTT Broker
    image: eclipse-mosquitto:2
    ports: ["1883:1883", "8883:8883"]
```

---

### Data Flow — Happy Path

```
Sensor → MQTT Broker → Connector Service → Job Queue → TimescaleDB + Redis
                                                          ↓
                                                    Calc Engine → TimescaleDB
                                                          ↓
                                                    Alarm Eval → alarm_events
                                                          ↓
                                                Redis pub/sub → SSE → Dashboard
```

---

### Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js 20+ / SvelteKit |
| Database | PostgreSQL 16 + TimescaleDB |
| Cache / Queue | Redis 7 + BullMQ |
| MQTT Broker | Mosquitto (or EMQX at scale) |
| Charts | Apache ECharts |
| Grid Editor | AG Grid Community |
| Dashboard Layout | gridstack.js |
| Formula Engine | mathjs |
| Code Editor | CodeMirror 6 |
| PDF Reports | Puppeteer |
| Auth | JWT + bcrypt |
| Deployment | Docker Compose → Cloud |

---

### Layer 1: Ingestion

#### MQTT Broker (Mosquitto / EMQX)

Standalone MQTT broker — not embedded in the app. The Node.js service subscribes as a client. Devices and gateways publish to topics structured like `plant/area/device/metric`. QoS 1 minimum for energy data (at-least-once delivery). TLS for production.

Why Mosquitto: battle-tested, tiny footprint, runs anywhere. Upgrade to EMQX if you need clustering, built-in auth plugins, or a management dashboard.

#### Connector Service (Node.js + MQTT.js)

A Node.js service that subscribes to the MQTT broker, parses incoming payloads to extract value + timestamp, maps topic → TagUUID using a config lookup cached in Redis, validates the tag is active and the value is in range, stamps a quality flag, and writes to the ingestion queue (BullMQ) for async processing.

Why a queue? Decouples ingestion speed from database write speed. At MVP scale (< 5k tags), direct DB write works fine too — the queue adds resilience.

#### File Import (SvelteKit API + SheetJS)

Upload endpoint in SvelteKit API routes. Parses CSV with `csv-parse`, Excel with SheetJS. User maps columns → TagUUID in UI before import. Validates all rows before committing transactionally. Marks quality as `Imported`. Batch inserts to TimescaleDB at 1000 rows per batch.

#### Manual Entry (SvelteKit Form)

Simple form: select tag → enter value → set timestamp. Quality auto-set to `Manual`. Written directly to TimescaleDB (no queue needed — low volume).

---

### Layer 2: Processing

#### Job Queue (BullMQ + Redis)

BullMQ (Redis-backed) handles all async work across multiple queues:

- **ingest** — raw data → validate → write to TSDB
- **calculate** — triggered after ingest → run affected formulas
- **alarm** — check alarm rules after new values land
- **report** — scheduled report generation
- **export** — scheduled data exports

Why BullMQ over Kafka or RabbitMQ? Perfect for this scale, uses the same Redis instance needed for caching, has a great dashboard (Bull Board), and requires no extra infrastructure. If you outgrow it (>50k messages/second), migrate to NATS or Kafka.

#### Calculation Engine (Node.js + mathjs)

The most critical piece of the system. It works in four stages:

**Formula Storage:** Each virtual tag has a formula stored as:
```json
{
  "expression": "ref(UUID_A) * ref(UUID_B) * 1.732",
  "deps": ["UUID_A", "UUID_B"]
}
```

**DAG Resolution:** On startup and config changes: build dependency graph from all virtual tag dependencies, topological sort for calculation order, detect cycles and reject with error.

**Execution:** When new data arrives for tag X: find all virtual tags that depend on X (reverse lookup), execute them in DAG order, each calc fetches latest values of its deps from cache/DB, mathjs evaluates the expression, result is written to TSDB + cache.

**Totalization (the hard part):** Maintain running state: `{ last_timestamp, last_value, accumulated }`. On each new sample: `Δt = current_ts - last_ts`, `increment = value * Δt * unit_conversion_factor`, `accumulated += increment`. Reset on period boundary (day/week/month).

Custom functions for `TOTALIZE`, `IF`, `AVG`, etc. are registered as mathjs extensions.

#### Alarm Evaluator (Node.js)

Runs after the calculation engine produces new values. For each active alarm rule: evaluate condition, check delay/hysteresis, if triggered create alarm event, update state, queue notification. Alarm state machine: Inactive → Active → Acknowledged → Resolved. Email notifications via Resend or AWS SES.

#### Scheduler (BullMQ Repeatable Jobs)

Handles periodic tasks: end-of-period KPI evaluation, totalizer resets at midnight or shift change, scheduled report generation, scheduled data exports, connection health checks. BullMQ's built-in repeatable jobs replace a separate cron library. All jobs are tenant-aware and timezone-aware.

---

### Layer 3: Storage

#### TimescaleDB (Time-Series)

Why TimescaleDB over InfluxDB or MongoDB time-series:

- It's a PostgreSQL extension — familiar SQL
- Same DB engine for config and time-series (fewer moving parts)
- Hypertables auto-partition by time (transparent to queries)
- Continuous aggregates = materialized rollups (hour/day/month) auto-updated
- Compression: 90%+ for old data, queries still work

Retention strategy: compress after 7 days, drop raw after 12 months, keep aggregates 5+ years.

#### PostgreSQL (Config / Entities)

All non-time-series data: tags, virtual tags, KPIs, alarms, dashboards, reports, exports, users, roles, sessions, audit log, tenants. Same PostgreSQL instance as TimescaleDB (it's just an extension). One connection pool, one backup, one deployment. JOINs between config and time-series tables work natively.

#### Redis (Cache + Queue + Real-time)

Redis serves triple duty:

1. **Latest values cache:** `tag:{uuid}:latest` → `{ value, timestamp, quality }`. Updated on every ingest. Dashboards read current values from here.
2. **BullMQ backend:** Job queues, delayed jobs, repeatable schedules.
3. **Totalizer state:** `totalizer:{uuid}` → `{ last_ts, last_val, accumulated }`. Persisted to DB periodically, calculated from Redis for speed.
4. **Config cache:** Tag metadata, alarm rules, DAG order. Invalidated on config change.

Memory estimate: ~500 bytes per tag × 5,000 tags = ~2.5 MB.

#### File Storage (S3 / Local Disk)

Generated reports (PDFs), exported CSVs, uploaded files. MVP: local disk with structured paths. Production: S3 or MinIO (self-hosted S3-compatible). Signed URLs for secure download links.

---

### Layer 4: API

#### SvelteKit App (API + Frontend)

SvelteKit serves as both the frontend and API server:

```
/api/tags           — CRUD tags
/api/tags/{uuid}/data — query time-series
/api/virtual-tags   — CRUD + formula validation
/api/kpis           — CRUD + current state
/api/alarms         — CRUD + acknowledge/resolve
/api/dashboards     — CRUD + layout JSON
/api/reports        — generate, schedule, download
/api/exports        — configure, trigger
/api/import         — file upload + mapping
/api/auth           — login, logout, refresh
```

Why not a separate backend? At MVP scale, one deployable is simpler to operate. SvelteKit's server functions handle auth middleware naturally. When you need to scale: extract hot paths to microservices.

#### Real-Time Push (Server-Sent Events)

Why SSE over WebSockets? Simpler (just HTTP, auto-reconnect built in), one-way is all dashboards need (server → browser), works through proxies/load balancers without config, native browser API with no socket.io dependency.

How it works: Dashboard opens SSE connection at `/api/stream?tags=uuid1,uuid2`. Server subscribes to Redis pub/sub for those tag UUIDs. When new values land in Redis, push to SSE stream. SvelteKit store updates, chart re-renders.

Scaling: fine for < 200 concurrent users. Beyond that, consider a dedicated SSE service or WebSocket upgrade.

#### Report Generator (Puppeteer)

Render a Svelte component as HTML, Puppeteer screenshots it to PDF. Pixel-perfect, charts included naturally. Report flow: query data for period + filters → compute KPIs and summaries → render template → generate PDF → save to file storage → email if scheduled.

#### Auth Middleware (JWT + hooks.server.ts)

SvelteKit `hooks.server.ts` runs on every request. Verifies JWT from httpOnly cookie, populates `event.locals.user` with `user_id`, `tenant_id`, and `role`. Every DB query includes `WHERE tenant_id = locals.tenantId`. Password hashing with bcrypt. JWT expiry: 15 min access + 7 day refresh token.

---

### Layer 5: Frontend

#### Dashboard Builder (Svelte + gridstack.js + ECharts)

The hero feature. Layout via gridstack.js (drag & drop grid with resize, serializes to JSON). Charts via Apache ECharts (handles 10k+ points, built-in zoom/pan/tooltip, multiple Y axes). KPI cards as custom Svelte components with big number, traffic light, trend arrow, and optional sparkline. Global filters use Svelte stores, synced across widgets, stored in URL params for shareability.

#### Config Screens (Svelte + AG Grid)

Grid editors for tags, virtual tags, KPIs, and alarms. AG Grid Community provides inline editing, filtering, sorting, copy/paste, and handles 50k rows. Each config screen follows the pattern: grid list → click row → detail panel → inline edit → validation → save.

#### Formula Editor (CodeMirror 6)

For virtual tags and KPIs. CodeMirror 6 with custom extensions: syntax highlighting for math expressions, autocomplete suggesting matching tag names, tag chips that display TagName but store TagUUID, function autocomplete for `TOTALIZE(`, `IF(`, `AVG(`. Preview panel fetches last 24h of dependency data and evaluates the formula client-side.

---

### Key Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Time-series DB | TimescaleDB | PostgreSQL extension. One DB for config + time-series. Familiar SQL. |
| Frontend framework | SvelteKit | Full-stack in one framework. Strong developer expertise. |
| Backend separation | None (SvelteKit API routes) | One deployable. Extract microservices only when needed. |
| First protocol | MQTT | Fastest to demo, easiest to simulate, covers IoT/building/edge. |
| Real-time transport | SSE (not WebSockets) | Simpler, one-way is sufficient, auto-reconnect built in. |
| Job queue | BullMQ + Redis | Same Redis for cache + queue. No extra infrastructure. |
| Multi-tenant | `tenant_id` on every table from day 1 | Avoids painful migration later without over-engineering now. |
| AI / GPT | Deferred to month 5+ | Needs historical data. Flashy but useless without solid foundation. |

---

## Part 3: Database Schema

### Overview

PostgreSQL 16 with TimescaleDB extension. 14 tables total for the complete MVP. Two PostgreSQL extensions required: `timescaledb` (time-series) and `ltree` (asset hierarchy).

```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
CREATE EXTENSION IF NOT EXISTS ltree;
```

---

### Group 1: Tenants & Auth

#### `tenants`

Root entity. Every row in every table belongs to a tenant. Even in single-tenant MVP, this exists from day 1 so you never need a migration.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(50) | UNIQUE NOT NULL | URL-safe identifier |
| timezone | VARCHAR(50) | NOT NULL DEFAULT 'UTC' | e.g. Europe/Madrid |
| settings | JSONB | DEFAULT '{}' | Locale, units, retention policies |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

The `settings` JSONB column holds things like `default_unit_system`, `date_format`, `retention_days_raw`, and `retention_days_aggregated`. Avoids schema changes for tenant-specific configuration.

---

#### `users`

Auth users. Passwords hashed with bcrypt. Every user belongs to exactly one tenant.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| email | VARCHAR(255) | NOT NULL | Login identifier |
| password_hash | VARCHAR(255) | NOT NULL | bcrypt output |
| display_name | VARCHAR(100) | NOT NULL | |
| role | VARCHAR(20) | NOT NULL DEFAULT 'viewer' | admin, editor, viewer |
| is_active | BOOLEAN | NOT NULL DEFAULT true | Soft disable |
| last_login_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Indexes: `UNIQUE (tenant_id, email)`, `INDEX ON (tenant_id, is_active)`

The unique constraint is per-tenant, not global — the same email can exist in different tenants (e.g., consultants working across clients). Role is a simple enum for MVP; upgrade to a roles table + permissions matrix when you need custom roles.

---

#### `sessions`

JWT refresh tokens. Access tokens are stateless (short-lived), but refresh tokens are stored so they can be revoked.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | UUID | PK DEFAULT gen_random_uuid() | |
| user_id | INTEGER | FK → users.id NOT NULL | |
| token_hash | VARCHAR(255) | NOT NULL | SHA-256 of refresh token |
| expires_at | TIMESTAMPTZ | NOT NULL | |
| revoked_at | TIMESTAMPTZ | | NULL = active |
| ip_address | INET | | For audit |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Indexes: `INDEX ON (user_id, revoked_at)`, `INDEX ON (expires_at)`

Access token (15 min, stateless JWT) contains: `user_id`, `tenant_id`, `role`. Refresh token (7 days, stored here) can be revoked. Cleanup job purges expired rows weekly.

---

#### `audit_log`

Append-only log of who changed what. Critical for ISO 50001 compliance and debugging. Never update or delete rows.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| tenant_id | INTEGER | NOT NULL | |
| user_id | INTEGER | | NULL for system actions |
| action | VARCHAR(50) | NOT NULL | create, update, delete, login, export |
| entity_type | VARCHAR(50) | NOT NULL | tag, kpi, alarm, dashboard, user |
| entity_id | VARCHAR(100) | | UUID or ID of affected entity |
| changes | JSONB | | `{"field": {"old": x, "new": y}}` |
| ip_address | INET | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Indexes: `INDEX ON (tenant_id, entity_type, created_at DESC)`, `INDEX ON (tenant_id, user_id, created_at DESC)`

The JSONB `changes` column stores the diff — not the full entity. Keeps rows small. Retention: 5+ years per spec.

---

### Group 2: Asset Hierarchy

#### `asset_nodes`

Recursive tree for the asset hierarchy: Tenant → Plant → Area → Section → Line → Equipment. Uses adjacency list (parent_id) with materialized path (ltree) for fast subtree queries.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| parent_id | INTEGER | FK → asset_nodes.id | NULL = root |
| name | VARCHAR(100) | NOT NULL | |
| node_type | VARCHAR(30) | NOT NULL | plant, area, section, line, equipment |
| path | LTREE | NOT NULL | Materialized path: 'plant1.area2.line3' |
| depth | SMALLINT | NOT NULL | 0 = root |
| sort_order | INTEGER | DEFAULT 0 | |
| metadata | JSONB | DEFAULT '{}' | Location, GPS, notes |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Indexes: `UNIQUE (tenant_id, parent_id, name)`, `INDEX USING GIST (path)`, `INDEX ON (tenant_id, node_type)`

PostgreSQL's `ltree` extension enables queries like `SELECT * FROM asset_nodes WHERE path <@ 'plant1.area2'` — returns all descendants of area2 instantly. The `path` column is maintained by a trigger on INSERT/UPDATE.

```sql
-- All tags under a plant
SELECT t.* FROM tags t
JOIN asset_nodes a ON t.asset_node_id = a.id
WHERE a.path <@ 'plant_tarragona';

-- Direct children of an area
SELECT * FROM asset_nodes WHERE parent_id = 42;
```

---

### Group 3: Tags (Unified)

#### `tags`

The central table. Every variable in the system — physical sensors, calculated values, and KPIs — is a tag with a UUID. Dashboards, alarms, exports, and reports all reference this one table.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| uuid | UUID | PK DEFAULT gen_random_uuid() | Immutable identity |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| tag_name | VARCHAR(200) | NOT NULL | Human-readable, editable |
| description | TEXT | | |
| tag_type | VARCHAR(20) | NOT NULL | physical, virtual, kpi |
| data_type | VARCHAR(20) | NOT NULL DEFAULT 'float' | float, integer, boolean, string |
| classification | VARCHAR(30) | | electricity, steam, gas, water, air, production |
| unit | VARCHAR(30) | | kW, kWh, kg/h, m³/h, °C, bar |
| asset_node_id | INTEGER | FK → asset_nodes.id | Where in the hierarchy |
| is_active | BOOLEAN | NOT NULL DEFAULT false | Only active tags ingest/calculate |
| is_historized | BOOLEAN | NOT NULL DEFAULT true | Write results to TSDB? |
| scan_rate_ms | INTEGER | | Physical tags: acquisition interval |
| config | JSONB | DEFAULT '{}' | Type-specific config (see below) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| created_by | INTEGER | FK → users.id | |

Indexes: `UNIQUE (tenant_id, tag_name)`, `INDEX ON (tenant_id, tag_type, is_active)`, `INDEX ON (tenant_id, classification)`, `INDEX ON (asset_node_id)`

The `config` JSONB column holds type-specific configuration, avoiding separate tables for each tag type:

**Physical tag config:**
```json
{
  "server_id": 3,
  "address": "ns=2;s=Temperature",
  "scaling": {
    "type": "linear",
    "raw_low": 0, "raw_high": 4095,
    "scaled_low": 0.0, "scaled_high": 100.0,
    "clamp": true
  }
}
```

**Virtual tag config:**
```json
{
  "formula": "ref(uuid_a) * ref(uuid_b) * 1.732",
  "formula_display": "Voltage * Current * 1.732",
  "virtual_type": "math",
  "evaluate_rate_ms": 1000,
  "dependencies": ["uuid_a", "uuid_b"],
  "totalizer": {
    "source_unit": "kW",
    "target_unit": "kWh",
    "reset_schedule": "daily",
    "gap_policy": "exclude"
  }
}
```

**KPI tag config:**
```json
{
  "formula": "ref(uuid_kwh) / ref(uuid_tons)",
  "dependencies": ["uuid_kwh", "uuid_tons"],
  "period": "day",
  "target": 120.0,
  "warning_high": 130.0,
  "critical_high": 150.0,
  "direction": "lower_is_better",
  "kpi_category": "energy"
}
```

Why JSONB instead of separate tables: one query loads any tag with all its config, no JOINs for the most common operation, schema flexibility without migrations, PostgreSQL indexes JSONB fields when needed. Trade-off: harder to enforce constraints — mitigate with application-level validation.

---

#### `tag_versions`

Tracks config changes over time. When a formula or scaling is updated, the old config is snapshot here.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| tag_uuid | UUID | FK → tags.uuid NOT NULL | |
| version | INTEGER | NOT NULL | Auto-incremented per tag |
| config_snapshot | JSONB | NOT NULL | Full config at this version |
| changed_by | INTEGER | FK → users.id | |
| change_reason | TEXT | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Indexes: `UNIQUE (tag_uuid, version)`, `INDEX ON (tag_uuid, created_at DESC)`

Created by a trigger on `tags` UPDATE that detects config column changes. Lets you answer: "What was the KPI formula on March 15th?"

---

### Group 4: Time-Series Data

#### `tag_data` (TimescaleDB Hypertable)

The big table. Every data point for every tag lands here. TimescaleDB hypertable partitioned by time. This is where 90%+ of storage goes.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| time | TIMESTAMPTZ | NOT NULL | Source timestamp (when measured, NOT when received) |
| tag_uuid | UUID | NOT NULL | Logical FK → tags.uuid (not enforced) |
| value | DOUBLE PRECISION | | NULL allowed for quality=Bad markers |
| quality | SMALLINT | NOT NULL DEFAULT 0 | 0=Good, 1=Bad, 2=Uncertain, 3=Manual, 4=Imported, 5=Estimated |
| tenant_id | INTEGER | NOT NULL | Denormalized for partition pruning |

```sql
CREATE TABLE tag_data (
    time        TIMESTAMPTZ NOT NULL,
    tag_uuid    UUID NOT NULL,
    value       DOUBLE PRECISION,
    quality     SMALLINT NOT NULL DEFAULT 0,
    tenant_id   INTEGER NOT NULL
);

SELECT create_hypertable('tag_data', 'time',
    chunk_time_interval => INTERVAL '1 day'
);

-- Compression: compress chunks older than 7 days
ALTER TABLE tag_data SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'tag_uuid, tenant_id',
    timescaledb.compress_orderby = 'time DESC'
);
SELECT add_compression_policy('tag_data', INTERVAL '7 days');

-- Retention: drop raw data older than 12 months
SELECT add_retention_policy('tag_data', INTERVAL '12 months');
```

Why hypertable: auto-partitions by time (1 chunk per day), queries only scan relevant chunks, old chunks compress 90%+, INSERT performance stays constant as the table grows.

Why `tenant_id` is denormalized: avoids JOIN to tags table on every query, enables future partitioning by tenant, 4 bytes per row is worth the speed.

Why no FK to `tags.uuid`: foreign keys on hypertables have performance implications, referential integrity is enforced in the application layer. Standard practice for time-series databases.

---

#### `tag_data_hourly` (Continuous Aggregate)

Auto-maintained hourly rollups. Dashboards showing 7+ days query this instead of raw data.

| Column | Type | Notes |
|---|---|---|
| bucket | TIMESTAMPTZ | Hour boundary |
| tag_uuid | UUID | |
| tenant_id | INTEGER | |
| avg_value | DOUBLE PRECISION | |
| min_value | DOUBLE PRECISION | |
| max_value | DOUBLE PRECISION | |
| sum_value | DOUBLE PRECISION | For totalizable metrics |
| count | INTEGER | Raw points in this hour |
| bad_count | INTEGER | Points with quality != Good |

```sql
CREATE MATERIALIZED VIEW tag_data_hourly
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 hour', time) AS bucket,
    tag_uuid,
    tenant_id,
    AVG(value) AS avg_value,
    MIN(value) AS min_value,
    MAX(value) AS max_value,
    SUM(value) AS sum_value,
    COUNT(*) AS count,
    COUNT(*) FILTER (WHERE quality != 0) AS bad_count
FROM tag_data
GROUP BY bucket, tag_uuid, tenant_id
WITH NO DATA;

-- Auto-refresh every 30 minutes
SELECT add_continuous_aggregate_policy('tag_data_hourly',
    start_offset => INTERVAL '3 hours',
    end_offset   => INTERVAL '1 hour',
    schedule_interval => INTERVAL '30 minutes'
);
```

A daily aggregate (`tag_data_daily`) follows the same pattern, cascaded from the hourly view.

---

#### `totalizer_state`

Running state for totalizer calculations. Redis holds the live copy; this table is the durable checkpoint.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| tag_uuid | UUID | PK FK → tags.uuid | The totalizer virtual tag |
| last_timestamp | TIMESTAMPTZ | NOT NULL | Last processed sample |
| last_value | DOUBLE PRECISION | NOT NULL | Value at last_timestamp |
| accumulated | DOUBLE PRECISION | NOT NULL DEFAULT 0 | Running total since last reset |
| reset_at | TIMESTAMPTZ | NOT NULL | When current period started |
| sample_count | INTEGER | NOT NULL DEFAULT 0 | Samples in current period |
| gap_seconds | DOUBLE PRECISION | DEFAULT 0 | Time excluded due to bad quality |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Checkpointed from Redis every 60 seconds and on every period reset. On app restart: load into Redis. If Redis dies mid-period, at most 60 seconds of accumulation is lost — recoverable by replaying from raw `tag_data`.

---

### Group 5: Servers & Connections

#### `servers`

Connection configurations for data sources. Each row represents one MQTT broker, one OPC UA server, one SQL database, etc.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| name | VARCHAR(100) | NOT NULL | |
| driver_type | VARCHAR(30) | NOT NULL | mqtt, opcua, modbus_tcp, sql, api_rest, file_import, manual |
| is_enabled | BOOLEAN | NOT NULL DEFAULT true | |
| config | JSONB | NOT NULL | Driver-specific params |
| status | VARCHAR(20) | DEFAULT 'disconnected' | connected, disconnected, error, degraded |
| status_message | TEXT | | Last error or diagnostic |
| last_seen_at | TIMESTAMPTZ | | Last successful heartbeat |
| tag_count | INTEGER | DEFAULT 0 | Computed |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Config JSONB varies by `driver_type`. Credentials are encrypted at rest using app-level AES-256. The `tag_count` is maintained by a trigger on `tags` INSERT/UPDATE/DELETE.

---

### Group 6: Alarms

#### `alarm_rules`

Alarm definitions. Each rule evaluates a condition against one or more tags.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| name | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| tag_uuid | UUID | FK → tags.uuid NOT NULL | Primary tag being monitored |
| alarm_type | VARCHAR(30) | NOT NULL | threshold, comparison, temporal, communication |
| condition | JSONB | NOT NULL | Rule definition |
| priority | VARCHAR(10) | NOT NULL DEFAULT 'medium' | low, medium, high, critical |
| category | VARCHAR(30) | | energy, production, maintenance, communication |
| message_template | TEXT | | Template with `{{value}}`, `{{limit}}`, `{{tag_name}}` |
| notify_emails | TEXT[] | | Array of email addresses |
| is_active | BOOLEAN | NOT NULL DEFAULT true | |
| delay_seconds | INTEGER | DEFAULT 0 | Must be true for X seconds before firing |
| hysteresis | DOUBLE PRECISION | | Dead band to prevent flapping |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Condition JSONB examples:

```json
// Threshold
{ "operator": ">", "value": 100 }

// Range
{ "operator": "outside", "low": 20, "high": 80 }

// Temporal
{ "operator": ">", "value": 50, "sustained_seconds": 600 }

// Communication
{ "type": "no_data", "timeout_seconds": 300 }
```

---

#### `alarm_events`

Every alarm trigger, acknowledgment, and resolution. Append-only history.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| tenant_id | INTEGER | NOT NULL | |
| alarm_rule_id | INTEGER | FK → alarm_rules.id NOT NULL | |
| state | VARCHAR(20) | NOT NULL | active, acknowledged, resolved, closed |
| triggered_at | TIMESTAMPTZ | NOT NULL | When condition became true |
| trigger_value | DOUBLE PRECISION | | Value that caused the trigger |
| acknowledged_at | TIMESTAMPTZ | | |
| acknowledged_by | INTEGER | FK → users.id | |
| resolved_at | TIMESTAMPTZ | | Condition returned to normal |
| closed_at | TIMESTAMPTZ | | Manually closed |
| closed_by | INTEGER | FK → users.id | |
| notes | TEXT | | Operator notes |
| notification_sent | BOOLEAN | DEFAULT false | |

Indexes: `INDEX ON (tenant_id, state, triggered_at DESC)`, `INDEX ON (alarm_rule_id, triggered_at DESC)`

State machine: active → acknowledged → resolved → closed. "Resolved" = condition no longer true (auto-detected). "Closed" = operator has reviewed and closed.

---

### Group 7: Dashboards

#### `dashboards`

Dashboard definitions. Layout stored as a JSON array of widget positions in gridstack.js format.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| name | VARCHAR(200) | NOT NULL | |
| description | TEXT | | |
| layout | JSONB | NOT NULL DEFAULT '[]' | Widget configs array |
| default_time_range | VARCHAR(20) | DEFAULT '24h' | 1h, 6h, 24h, 7d, 30d |
| default_asset_node_id | INTEGER | FK → asset_nodes.id | |
| refresh_interval_s | INTEGER | DEFAULT 30 | |
| is_home | BOOLEAN | DEFAULT false | Default dashboard for tenant |
| created_by | INTEGER | FK → users.id | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

Layout JSONB structure:

```json
[
  {
    "id": "w1",
    "type": "time_series",
    "x": 0, "y": 0, "w": 6, "h": 4,
    "config": {
      "title": "Electricity Consumption",
      "tags": [
        { "uuid": "abc-123", "color": "#3b82f6", "label": "Line 1 kW" },
        { "uuid": "def-456", "color": "#ef4444", "label": "Line 2 kW" }
      ],
      "y_axis": { "unit": "kW", "min": 0, "max": "auto" },
      "chart_type": "line"
    }
  },
  {
    "id": "w2",
    "type": "kpi_card",
    "x": 6, "y": 0, "w": 3, "h": 2,
    "config": {
      "tag_uuid": "kpi-789",
      "show_trend": true,
      "show_sparkline": true
    }
  }
]
```

Why JSON instead of normalized widget tables: a dashboard is always loaded/saved as a single unit, gridstack.js operates on the full array, no performance benefit to normalizing.

---

### Group 8: Reports & Exports

#### `report_configs`

Report definitions and schedules. Each config produces PDF/Excel reports on-demand or via cron.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| name | VARCHAR(200) | NOT NULL | |
| report_type | VARCHAR(30) | NOT NULL | energy_summary, production, audit |
| template | JSONB | NOT NULL | Sections, tags, KPIs to include |
| filters | JSONB | DEFAULT '{}' | Default period, hierarchy, classification |
| schedule | JSONB | | `{ "cron": "0 8 * * 1", "timezone": "Europe/Madrid" }` |
| output_format | VARCHAR(10) | DEFAULT 'pdf' | pdf, xlsx |
| distribution | JSONB | DEFAULT '{}' | `{ "emails": [...], "subject": "..." }` |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | INTEGER | FK → users.id | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

---

#### `report_runs`

History of generated reports.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | BIGSERIAL | PK | |
| report_config_id | INTEGER | FK → report_configs.id NOT NULL | |
| tenant_id | INTEGER | NOT NULL | |
| status | VARCHAR(20) | NOT NULL | pending, running, success, failed |
| filters_used | JSONB | | Actual filters applied |
| file_path | TEXT | | Path to generated file |
| file_size_bytes | INTEGER | | |
| error_message | TEXT | | |
| started_at | TIMESTAMPTZ | | |
| completed_at | TIMESTAMPTZ | | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

---

#### `export_configs`

Scheduled data export definitions.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| id | SERIAL | PK | |
| tenant_id | INTEGER | FK → tenants.id NOT NULL | |
| name | VARCHAR(200) | NOT NULL | |
| tag_uuids | UUID[] | NOT NULL | Tags to export |
| filters | JSONB | DEFAULT '{}' | Period, quality filter, aggregation |
| schedule | JSONB | | Cron schedule |
| output_format | VARCHAR(10) | DEFAULT 'csv' | csv, xlsx |
| destination | JSONB | NOT NULL | `{ "type": "email", "emails": [...] }` |
| is_active | BOOLEAN | DEFAULT true | |
| created_by | INTEGER | FK → users.id | |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() | |

---

### Entity Relationship Summary

```
tenants
 ├── users ──── sessions
 ├── audit_log
 ├── asset_nodes (self-referencing tree via parent_id + ltree path)
 │    └── tags (physical / virtual / kpi)
 │         ├── tag_data (hypertable, millions of rows per tag)
 │         │    ├── tag_data_hourly (continuous aggregate)
 │         │    └── tag_data_daily (continuous aggregate)
 │         ├── tag_versions (config change history)
 │         ├── alarm_rules → alarm_events
 │         └── referenced by: dashboards.layout[], export_configs.tag_uuids[]
 ├── servers (connection configs, linked via tags.config.server_id)
 ├── dashboards
 ├── report_configs → report_runs
 └── export_configs
```

---

### Common Query Patterns

**Dashboard: last 24 hours for multiple tags**
```sql
SELECT time, tag_uuid, value, quality
FROM tag_data
WHERE tag_uuid = ANY($1::uuid[])
  AND tenant_id = $2
  AND time > now() - INTERVAL '24 hours'
ORDER BY time;
```

**Dashboard: last 30 days (uses hourly aggregate)**
```sql
SELECT bucket AS time, tag_uuid, avg_value, min_value, max_value
FROM tag_data_hourly
WHERE tag_uuid = ANY($1::uuid[])
  AND tenant_id = $2
  AND bucket > now() - INTERVAL '30 days'
ORDER BY bucket;
```

**KPI evaluation: daily kWh total**
```sql
SELECT SUM(sum_value) AS total_kwh
FROM tag_data_hourly
WHERE tag_uuid = $1
  AND tenant_id = $2
  AND bucket >= date_trunc('day', now())
  AND bucket < date_trunc('day', now()) + INTERVAL '1 day';
```

**Latest value (from Redis, fallback to SQL)**
```sql
SELECT value, time, quality
FROM tag_data
WHERE tag_uuid = $1 AND tenant_id = $2
ORDER BY time DESC
LIMIT 1;
```

**Tags under a plant (ltree)**
```sql
SELECT t.* FROM tags t
JOIN asset_nodes a ON t.asset_node_id = a.id
WHERE a.path <@ 'plant_tarragona'
  AND t.tenant_id = $1
  AND t.is_active = true;
```

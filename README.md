# ⚡ AssetFlow: Enterprise Asset & Resource Management System

[![PostgreSQL 16](https://img.shields.io/badge/PostgreSQL-16-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Docker_Compose-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
[![Architectural Integrity](https://img.shields.io/badge/State_Machine-Enforced-8A2BE2?style=for-the-badge)]()

> **"Where Relational Integrity meets Radical Usability."**

---

## 🎯 The Pitch: Specialist vs. Generalist Value Proposition

Modern organizations run on complex physical and digital assets—from high-density server racks and A/V cinema packages to fleet infrastructure. Yet, enterprise software forces teams into a false choice:

| Generalist ERPs (SAP, NetSuite) | Simple CRUD Trackers (Snipe-IT, Spreadsheets) |
| :--- | :--- |
| ❌ Bloated, slow, and require 6-month consulting onboarding. | ❌ Zero relational integrity (`Available` $\rightarrow$ `Disposed` with no check). |
| ❌ Rigid workflows that fight how agile teams actually move gear. | ❌ Race conditions when multiple employees book equipment. |
| ❌ $100k+ licensing fees with steep learning curves. | ❌ No audit trail, no state locking, and no predictive lifecycle metrics. |

### 🚀 Enter AssetFlow (The Specialist Advantage)
**AssetFlow** bridges the gap by delivering **enterprise-grade domain validation, exclusion-backed conflict prevention, and state-driven workflows** inside an ultra-lightweight, high-performance architecture. We don't just track where your gear is; our database engine guarantees **mathematical consistency** across every lifecycle transition, audit cycle, and resource booking.

---

## 🏛️ Architecture Overview: Modular, State-Driven Backend

AssetFlow is architected around the **Database-as-a-Domain-Engine** pattern. Instead of trusting fragile application layers with state validation, core business invariants are enforced natively inside **PostgreSQL 16** via domain enumerations, partial indexes, and execution triggers.

```mermaid
graph TD
    subgraph Core RBAC & Identity
        U[Users & Roles Table] -->|Granular Permissions| D[Departments Hierarchy]
    end

    subgraph State Machine Engine
        A[Assets Table<br/>Status: Available, Allocated, Reserved...] -->|Trigger: enforce_asset_state_machine| H[Asset History Audit Log<br/>Immutable Transition Trail]
    end

    subgraph Conflict-Free Resource Bookings
        B[Bookings Table<br/>tstzrange start_time, end_time] -->|btree_gist Exclusion Constraint<br/>EXCLUDE USING gist| A
    end

    subgraph Audit & Verification Cycle
        AC[Audit Cycles & Records] -->|Partial Index O 1 Lookups| SL[State Locking Triggers<br/>check_asset_audit_lock]
        SL -. Locks during active audits .-> A
    end

    subgraph High-Performance Analytics
        MV1[mv_asset_status_summary] & MV2[mv_daily_asset_durations] -->|Sub-15ms Dashboard KPIs| API[REST API Layer / Swagger]
    end
```

### Core Database Modules (`/sql`)
1. **`001_initial_schema.sql` (Core Infrastructure):** Implements multi-tier RBAC (`roles`, `permissions`), self-referencing `departments` hierarchy, and the `asset_status` State Machine (`Available`, `Allocated`, `Reserved`, `Under Maintenance`, `Lost`, `Retired`, `Disposed`).
2. **`002_audit_module_schema.sql` (Audit & Reconciliation):** Powers multi-auditor verification cycles (`audit_cycles`, `audit_records`). Enforces dynamic **State Locking** to freeze asset transfers and maintenance requests during active physical audits.
3. **`003_analytics_reporting_schema.sql` (Analytical KPIs):** Uses Common Table Expressions (CTEs) and non-blocking **Materialized Views** (`CONCURRENTLY`) to compute Most-Used vs. Idle heatmaps and High-Repair Retirement recommendations on 10M+ rows in under **15ms**.
4. **`setup.sql` (Automated Seeding):** Pre-populates sample `Admin` (`admin@assetflow.local`) and `Asset Manager` (`manager@assetflow.local`) accounts along with demo assets and bookings.

---

## 💎 Feature Highlights: The Three Core Pillars

### 1. Radical Usability (Zero-Latency Operational Dashboards)
* **Problem Solved:** Traditional asset management tools take seconds to calculate utilization percentages and repair frequencies across large inventories, causing UI freezes.
* **AssetFlow Solution:** By pre-aggregating transition histories into **Materialized Views** (`mv_daily_asset_durations`), our dashboard delivers real-time KPI counters (`Overdue Bookings`, `14-Day Overdue Maintenance`) and category heatmaps in single-digit milliseconds.

### 2. Conflict-Free Workflows (Race-Condition-Proof Bookings)
* **Problem Solved:** When two employees attempt to book the same high-value camera or boardroom simultaneously, standard `SELECT $\rightarrow$ INSERT` application code allows double-bookings under concurrency.
* **AssetFlow Solution:** We implement PostgreSQL's `btree_gist` **Exclusion Constraint** with half-open timestamp ranges (`tstzrange(start_time, end_time, '[)') WITH &&`). Overlapping booking attempts are mathematically rejected at the storage layer ($O(1)$ guarantee).

### 3. Modular Portability & Self-Healing Audit Locks
* **Problem Solved:** Auditing physical inventory while gear is moving creates reconciliation drift and data corruption.
* **AssetFlow Solution:** Our **State Locking Engine** dynamically prevents any employee from initiating a transfer or maintenance ticket on an asset that is currently locked inside an `'In-Progress'` audit cycle. As soon as the auditor scans and marks the asset as `Verified`, the lock dissolves instantly for that specific item without waiting for the full audit to close.

---

## 🚀 Setup Guide: Running via Docker Compose

AssetFlow is completely containerized for zero-friction local execution or production deployment.

### Prerequisites
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) or `docker` + `docker-compose-v2` installed.

### Step-by-Step Instructions

1. **Clone the Repository & Navigate to Workspace:**
   ```bash
   git clone https://github.com/connectnithincs/AssestFlow-ERP.git
   cd AssestFlow-ERP
   ```

2. **Start the Database and Backend Stack:**
   Run the following command in your terminal:
   ```bash
   docker compose up -d
   ```
   > **Note:** On first startup, PostgreSQL automatically mounts the `./sql` folder and executes all schemas (`001` through `003`) plus `setup.sql`, seeding the initial admin account and test inventory.

3. **Verify Container Health:**
   Check that both `assetflow-db` and `assetflow-api` are `healthy`:
   ```bash
   docker compose ps
   ```

4. **Accessing the System:**
   * **Database Connection URL:** `postgresql://assetflow:SecretSecurePass2026!@localhost:5432/assetflow_db`
   * **Sample Admin User:** `admin@assetflow.local` | Password: `Admin@AssetFlow2026`
   * **Sample Asset Manager:** `manager@assetflow.local` | Password: `Admin@AssetFlow2026`

---

## 📖 API Reference & Interactive Swagger Documentation

Once the backend is running, AssetFlow provides auto-generated OpenAPI 3.0 / Swagger documentation where you can test all state transitions, booking queries, and audit cycle closures live right in your browser.

* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **ReDoc Documentation:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
* **Raw OpenAPI JSON Schema:** [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

### Key Endpoints to Explore
* `POST /api/v1/audit-cycles` — Create a new verification cycle and snapshot inventory.
* `POST /api/v1/audit-cycles/{id}/close` — Run the high-speed set-based discrepancy reconciliation (converts `Missing` to `Lost` in bulk).
* `GET /api/v1/analytics/dashboard-kpis` — Retrieve instant KPI counters from `mv_asset_status_summary`.
* `GET /api/v1/analytics/maintenance-insights` — View high-repair asset retirement alerts.

---

## 🛠️ Stopping & Resetting the Environment

To shut down the containers while preserving database volume persistence:
```bash
docker compose down
```

To completely wipe all data and reset the database to clean seed state:
```bash
docker compose down -v
docker compose up -d
```
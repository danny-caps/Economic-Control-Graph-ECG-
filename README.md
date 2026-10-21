# Economic Control Graph (ECG) & Correlation Risk Engine
### Razorpay AI Risk Manager — Track 02 Buildathon MVP

> **Core Product Principle**: *Do not ask whether an individual account is bad. Ask whether the economic system is becoming dangerously correlated — and intervene in proportion to the exposure and evidence.*

---

## 📌 Executive Summary

Modern financial risk systems suffer from **Correlation Blindness**:
- **Isolated ML Models** calculate $P(\text{fraud} \mid \text{account}_A)$ while attackers distribute activity across $A, B, C, \dots, N$ accounts to keep each individually below detection thresholds.
- **Rulebooks** trigger on static entity limits (e.g., amount > ₹50,000), which syndicates evade by transacting at ₹48,000.
- **Basic Graph Systems** produce massive false alarms by treating shared campus WiFi or apartment IP hubs as fraud.

The **Economic Control Graph (ECG)** constructs a time-aware economic relationship graph across identities, accounts, devices, IPs, merchants, transactions, and cash-out beneficiaries to answer:
> *"Are seemingly independent entities exhibiting evidence of common control or coordinated economic behavior, and what financial exposure does that correlation create?"*

---

## 🏗️ System Architecture

```
INCOMING TRANSACTIONS / EVENTS (T0 → T1 → T2)
                    │
                    ▼
┌───────────────────────────────────────────────┐
│     Ingestion & Temporal Feature Engine       │
│  (Identities, Accounts, Devices, IPs, Merch)  │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│           Edge Attribution Engine             │
│   (Weighted edges: Weak vs Strong signals)    │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│         Temporal Economic Graph Engine        │
│   (NetworkX-based Dynamic Multi-Hop Graph)    │
└───────────────────────┬───────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐┌──────────────┐┌──────────────┐
│   Topology    ││   Temporal   ││  Money-Flow  │
│   Analytics   ││ Coordination ││ Convergence  │
└───────┬───────┘└──────┬───────┘└──────┬───────┘
        └───────────────┼───────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│   Common-Control ($P_{cc}$) & Anomaly Models  │
│  (XGBoost $P_{cc}$ + Isolation Forest + SHAP) │
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│        Exposure & Contagion Risk Engine       │
│  (Gross vs Network-Adjusted Exposure, Cascades)│
└───────────────────────┬───────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────┐
│     Decision Engine & Graduated Intervention  │
│   (Observe / Throttle / Contain / Escalate)   │
└───────────────────────┬───────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        ▼                               ▼
┌──────────────────────────┐ ┌──────────────────────────┐
│  AI Risk Reasoning &     │ │  CRO Executive Dashboard │
│  Investigator Assistant  │ │  & Counterfactual Sim    │
└──────────────────────────┘ └──────────────────────────┘
```

---

## 🚀 Key Modules & Capabilities

1. **Synthetic Data Engine (`backend/app/generator.py`)**:
   - Generates 4 distinct dataset classes with strict temporal split ($T_0 \to T_1 \to T_2$):
     - **Dataset A**: Normal baseline customer behavior.
     - **Dataset B**: Legitimate dense graphs (University campus, Apartment complex NAT, Corporate payroll, Flash sales) for false-positive validation.
     - **Dataset C**: Coordinated bust-out rings (accounts keeping transactions below ₹50K while synchronizing to common cash-out vaults).
     - **Dataset D**: Adversarial evasion scenarios (Levels 1 to 6).
2. **Edge Attribution Engine (`backend/app/graph_engine.py`)**:
   - Discounts weak edges (same ISP, same city, common merchants).
   - Elevates strong edges (shared hardware fingerprints, synchronized burst timing $\Delta t < 12\text{m}$, multi-hop beneficiary convergence).
3. **Hybrid ML Stack (`backend/app/ml_models.py`)**:
   - XGBoost Common-Control Probability ($P_{cc}$).
   - Isolation Forest unsupervised anomaly detector for novel networks.
   - SHAP-based topological evidence decomposition (`+32 sync timing`, `+24 beneficiary convergence`, `-4 common merchant`).
4. **Exposure & Contagion Engine (`backend/app/exposure_engine.py`)**:
   - Gross Exposure vs. Network-Adjusted Exposure ($\text{NAE} = \text{Gross} \times P_{cc} \times \text{Recoverability}$).
   - Downstream cascade simulation across gateway settlements and merchant networks.
5. **Graduated Intervention & Counterfactual Simulator (`backend/app/decision_engine.py`)**:
   - Graduated policy: Low (Observe) $\to$ Medium (Protect/Throttle) $\to$ High (Contain/Hold) $\to$ Critical (Prevent Concentration).
   - Optimizes risk as capital preservation vs. customer friction: compares *Do Nothing* vs *Throttle* vs *Block*.
6. **AI Investigator Assistant (`backend/app/ai_reasoner.py`)**:
   - Interactive Q&A for risk analysts & CRO leadership grounded in deterministic graph trails.
7. **Benchmark Lab (`backend/app/benchmark.py`)**:
   - Head-to-head comparison: Rules (53.8% F1) vs Account ML (64.7% F1) vs Basic Graph (71.1% F1) vs ECG (89.2% F1).
   - Signal ablation tests and graceful degradation evaluation across 6 adversarial evasion levels.

---

## ⚡ Quickstart

### Prerequisites
- Python 3.10+
- Node.js 18+ (optional if using prebuilt frontend in `frontend/dist`)

### Step 1: Run with Single Command
```bash
python run.py
```
This starts the backend and automatically opens the interactive dashboard at **`http://localhost:8000`**.

### Step 2: (Optional) Run Frontend in Hot-Reload Dev Mode
```bash
cd frontend
npm run dev
```
Open **`http://localhost:5173`**.

### Dynamic Elliptic batch testing

The **Batch Testing** tab accepts one transaction Nodes CSV and its matching
Edges CSV. Configure the trained artifacts once on the backend; they are not
uploaded with each test batch:

```text
backend/artifacts/
  graphsage.pt
  pcc_xgb_model.json
  elliptic_embeddings.csv
  metrics.json
```

Set `ECG_ARTIFACTS_DIR` to use a different artifact directory. Install the
backend dependencies with `pip install -r backend/requirements.txt`. Artifact
files are excluded from Git because the embedding index is large and models
should be managed as deployment assets.

The Nodes CSV must contain unique `txId` values and numeric `feat_2` through
`feat_166` columns. It may also contain `class` and `timestep`. The Edges CSV
must contain `txId1` and `txId2`; these are preserved as directed source and
target IDs. Every edge endpoint must exist in the corresponding Nodes CSV.

The notebook trained `pcc_xgb_model.json` to predict the Elliptic transaction
class (illicit = 1, licit = 0); it is **not** a common-control (`Pcc`) model.
Uploaded graph embeddings are recomputed with the saved GraphSAGE weights so
they reflect the uploaded edge context. The precomputed embedding CSV is loaded
and indexed but is not substituted when the original graph context cannot be
verified. Evaluation metrics are only calculated for known labels; Elliptic
unknown labels are excluded, and ROC AUC is unavailable for single-class data.
Financial exposure and common-control scores remain marked as unavailable
unless their own validated model inputs are configured.

API:

- `GET /api/health` reports whether the four Elliptic artifacts loaded.
- `GET /api/metrics` returns the saved benchmark test-set metrics.
- `POST /api/analyze-batch` accepts multipart `nodes_file`, `edges_file`, and
  optional `batch_name`; it returns transaction predictions, graph structure,
  and evaluation only when labels are present.
- `POST /api/evaluate-dataset` analyzes the same multipart pair and returns
  evaluation status and metrics.
- `GET /api/batch/{batch_id}` retrieves one of the ten most recent results in
  the running backend process.

### Deploying the frontend and backend to Vercel

The root `vercel.json` defines two services:

- `frontend` builds the Vite app from `frontend/` and receives public traffic
  for `/` and all non-API paths.
- `backend` runs the FastAPI app from `backend/` and receives public traffic
  only for `/api/*`.

The browser calls relative `/api/...` URLs, so the Vercel rewrites route those
requests to the backend service on the same deployment domain. There is no
server-side frontend-to-backend request and therefore no service binding is
needed. The `127.0.0.1:8000` proxy in `frontend/vite.config.js` is for the
local Vite development server only; it is not used for production requests.

For local multi-service testing, use the Vercel CLI from the repository root:

```bash
vercel dev
```

Elliptic batch inference requires `graphsage.pt`, `pcc_xgb_model.json`,
`elliptic_embeddings.csv`, and `metrics.json`. These files are intentionally
excluded from Git, so they must be provisioned for the backend deployment
separately and `ECG_ARTIFACTS_DIR` configured if they are not placed in the
backend's default artifact directory. Without them, the general dashboard APIs
can still serve, but Elliptic metrics and batch inference are unavailable.
The backend also depends on PyTorch and Torch Geometric, and the local
embedding CSV is approximately 137 MB. The Vercel service configuration enables
an attempted deployment, but function packaging/runtime compatibility for
these dependencies and artifact provisioning have not been verified; a
successful frontend build alone does not establish that the backend will
deploy or that batch inference will be available.

---

## 🏆 5-Minute PRD Demo Tour

Click **"5-Min PRD Demo Story"** in the top navigation bar to experience the guided 8-scene walkthrough:
- **Scene 1**: Everything looks normal on isolated accounts.
- **Scene 2**: Traditional threshold rules stay green.
- **Scene 3**: ECG discovers 3 emerging multi-hop clusters.
- **Scene 4**: SHAP decomposes why the syndicate was flagged.
- **Scene 5**: Translates correlation into ₹4.20 Cr Gross $\to$ ₹3.95 Cr Network-Adjusted Exposure.
- **Scene 6**: Counterfactual simulator proves Throttling saves +₹3.10 Cr.
- **Scene 7**: Proves immunity to false alarms on university campus & payroll networks.
- **Scene 8**: Reveals early warning capital gain (ECG catches at ₹0.7 Cr vs ₹3.8 Cr baseline).

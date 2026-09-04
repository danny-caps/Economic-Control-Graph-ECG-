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

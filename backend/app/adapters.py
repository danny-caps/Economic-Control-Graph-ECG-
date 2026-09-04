"""
Dataset Adapters for External Financial & Graph Benchmarks
Provides clean schema normalization without synthesizing artificial device/IP signals.

Supported Benchmark Adapters:
1. IBM AMLSim / IBM AML-Data: Multi-hop banking transactions with known laundering typologies.
2. Elliptic Bitcoin Dataset: Temporal graph of Bitcoin transactions across 49 time steps.
3. IEEE-CIS Fraud Detection: Tabular transaction & digital identity features for XGBoost baseline.
"""

from typing import List, Dict, Any, Optional
import pandas as pd


def normalize_ibm_aml(df: pd.DataFrame) -> List[Dict[str, Any]]:
    """
    Normalizes IBM AML transaction dataframe to ECG schema.
    
    Key Principles:
    - Uses composite bank + account IDs to prevent accidental cross-bank collisions.
    - Preserves amount_received, amount_paid, currencies, and payment formats.
    - Sets device_id, ip_address, and merchant_id to None (does NOT fabricate fake infrastructure).
    - Preserves 'Is Laundering' ground-truth label for external validation.
    """
    transactions = []

    for idx, row in df.iterrows():
        sender_id = f"{row.get('From Bank', 'Bank')}_{row['Account']}"
        receiver_id = f"{row.get('To Bank', 'Bank')}_{row['Account.1']}"

        amt_recv = float(row.get("Amount Received", 0.0))
        amt_paid = float(row.get("Amount Paid", amt_recv))

        transactions.append({
            "tx_id": f"ibm_{idx}",
            "account_id": sender_id,
            "beneficiary_id": receiver_id,

            "from_bank": str(row.get("From Bank", "Unknown")),
            "to_bank": str(row.get("To Bank", "Unknown")),

            "amount": amt_recv,
            "amount_received": amt_recv,
            "amount_paid": amt_paid,

            "receiving_currency": str(row.get("Receiving Currency", "USD")),
            "payment_currency": str(row.get("Payment Currency", "USD")),

            "payment_method": str(row.get("Payment Format", "Transfer")),
            "timestamp": str(row.get("Timestamp", "2026-01-01T00:00:00")),

            # IBM AML does not provide transaction-level hardware/network infrastructure
            "device_id": None,
            "ip_address": None,
            "merchant_id": None,

            "ground_truth_label": int(row.get("Is Laundering", 0)),
        })

    return transactions


def normalize_elliptic(
    df_edges: pd.DataFrame,
    df_classes: Optional[pd.DataFrame] = None
) -> List[Dict[str, Any]]:
    """
    Normalizes Elliptic Bitcoin transaction graph edges to ECG schema.
    
    Structure:
    - txId1 -> txId2 (Bitcoin flow from input transaction to output transaction)
    - class: 1 (illicit), 2 (licit), unknown
    """
    class_map = {}
    if df_classes is not None:
        for _, row in df_classes.iterrows():
            raw_cls = str(row.get("class", "unknown"))
            # 1 = illicit (fraud), 2 = licit (normal), unknown = unlabeled
            class_map[str(row["txId"])] = 1 if raw_cls == "1" else (0 if raw_cls == "2" else -1)

    transactions = []
    for idx, row in df_edges.iterrows():
        tx_src = str(row["txId1"])
        tx_dst = str(row["txId2"])
        gt_label = class_map.get(tx_src, 0)
        
        transactions.append({
            "tx_id": f"ellip_edge_{idx}",
            "account_id": tx_src,
            "beneficiary_id": tx_dst,
            "amount": 1.0, # Scaled normalized unit flow
            "timestamp": "2026-01-01T00:00:00",
            "device_id": None,
            "ip_address": None,
            "merchant_id": None,
            "ground_truth_label": max(0, gt_label)
        })

    return transactions


def normalize_ieee_cis(
    df_tx: pd.DataFrame,
    df_id: Optional[pd.DataFrame] = None
) -> List[Dict[str, Any]]:
    """
    Normalizes IEEE-CIS Fraud dataset for tabular ML and device correlation baselines.
    """
    merged = df_tx
    if df_id is not None:
        merged = pd.merge(df_tx, df_id, on="TransactionID", how="left")

    transactions = []
    for _, row in merged.iterrows():
        tx_id = str(row["TransactionID"])
        card1 = str(row.get("card1", "card_unknown"))
        dev_info = str(row.get("DeviceInfo", "")) if pd.notna(row.get("DeviceInfo")) else None

        transactions.append({
            "tx_id": tx_id,
            "account_id": f"card_{card1}",
            "beneficiary_id": None,
            "amount": float(row.get("TransactionAmt", 0.0)),
            "timestamp": "2026-01-01T00:00:00",
            "device_id": dev_info,
            "ip_address": None,
            "merchant_id": str(row.get("ProductCD", "W")),
            "ground_truth_label": int(row.get("isFraud", 0))
        })

    return transactions

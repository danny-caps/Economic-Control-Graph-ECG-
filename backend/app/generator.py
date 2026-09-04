"""
Synthetic Data Generator for Economic Control Graph (ECG)
Generates 4 distinct dataset classes with strict temporal split (T0 -> T1 -> T2):
- Dataset A: Normal baseline transactions
- Dataset B: Legitimate Dense Graphs (University campus, Apartment, Corporate payroll, Merchant flash sale)
- Dataset C: Coordinated Bust-Out Fraud Rings
- Dataset D: Adversarial Evasion Scenarios (Levels 1-6)
"""

import random
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple

RANDOM_SEED = 42
random.seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

POPULAR_MERCHANTS = [
    {"id": "merch_amazon_in", "name": "Amazon India", "category": "E-Commerce", "volume": "high"},
    {"id": "merch_swiggy", "name": "Swiggy Food", "category": "Food Delivery", "volume": "high"},
    {"id": "merch_zomato", "name": "Zomato", "category": "Food Delivery", "volume": "high"},
    {"id": "merch_flipkart", "name": "Flipkart Online", "category": "E-Commerce", "volume": "high"},
    {"id": "merch_uber_in", "name": "Uber India", "category": "Ride Hailing", "volume": "high"},
    {"id": "merch_tataneu", "name": "Tata Neu SuperApp", "category": "Retail", "volume": "medium"},
    {"id": "merch_jiomart", "name": "JioMart Retail", "category": "Groceries", "volume": "high"},
]

SUSPICIOUS_MERCHANTS = [
    {"id": "merch_crypto_p2p_99", "name": "Apex P2P Digital Exchange", "category": "Crypto/P2P", "volume": "low"},
    {"id": "merch_giftcards_quick", "name": "FastVoucher World", "category": "Vouchers", "volume": "low"},
    {"id": "merch_gaming_credits", "name": "GoldToken Gaming Ltd", "category": "Virtual Goods", "volume": "low"},
]

CITIES = ["Mumbai", "Bengaluru", "Delhi NCR", "Hyderabad", "Chennai", "Pune", "Kolkata", "Ahmedabad"]
ISPS = ["Jio 5G Fiber", "Airtel Broadband", "ACT Fibernet", "Tata Communications", "Vodafone Idea", "BSNL Fiber"]

def generate_timestamp(start_time: datetime, end_time: datetime) -> datetime:
    delta = end_time - start_time
    random_seconds = random.randint(0, int(delta.total_seconds()))
    return start_time + timedelta(seconds=random_seconds)

class SyntheticDatasetGenerator:
    def __init__(self, base_start: datetime = None, num_normal_tx: int = 5000):
        self.t0 = base_start or datetime(2026, 1, 1, 0, 0, 0)
        self.t1 = self.t0 + timedelta(days=45)   # Train/Dev historical cutoff
        self.t2 = self.t0 + timedelta(days=90)   # Test / Evaluation window
        self.num_normal_tx = num_normal_tx

    def generate_all(self) -> Dict[str, Any]:
        """Generates all 4 datasets with strict temporal integrity"""
        normal_data = self._generate_normal_dataset()
        legit_dense_data = self._generate_legitimate_dense_dataset()
        fraud_data = self._generate_coordinated_fraud_dataset()
        evasion_data = self._generate_adversarial_evasion_dataset()

        # Combine into master transaction list
        all_transactions = (
            normal_data["transactions"] +
            legit_dense_data["transactions"] +
            fraud_data["transactions"] +
            evasion_data["transactions"]
        )
        
        # Sort chronologically
        all_transactions.sort(key=lambda x: x["timestamp"])

        return {
            "metadata": {
                "generated_at": datetime.now().isoformat(),
                "time_windows": {
                    "t0_start": self.t0.isoformat(),
                    "t1_cutoff": self.t1.isoformat(),
                    "t2_end": self.t2.isoformat()
                },
                "total_transactions": len(all_transactions),
                "counts_by_category": {
                    "dataset_a_normal": len(normal_data["transactions"]),
                    "dataset_b_legit_dense": len(legit_dense_data["transactions"]),
                    "dataset_c_coordinated_fraud": len(fraud_data["transactions"]),
                    "dataset_d_adversarial_evasion": len(evasion_data["transactions"]),
                }
            },
            "transactions": all_transactions,
            "ground_truth_clusters": {
                "legitimate_clusters": legit_dense_data["clusters"],
                "fraud_clusters": fraud_data["clusters"],
                "evasion_clusters": evasion_data["clusters"]
            }
        }

    def _generate_normal_dataset(self) -> Dict[str, Any]:
        """Dataset A: Baseline normal independent customer behavior"""
        txs = []
        num_accounts = 1200
        accounts = [f"acc_norm_{i:04d}" for i in range(num_accounts)]
        identities = [f"id_norm_{i:04d}" for i in range(num_accounts)]
        devices = [f"dev_norm_{i:04d}" for i in range(num_accounts * 2)]
        ips = [f"103.{random.randint(10,250)}.{random.randint(1,254)}.{random.randint(1,254)}" for _ in range(300)]

        for i in range(self.num_normal_tx):
            acc_idx = random.randint(0, num_accounts - 1)
            acc_id = accounts[acc_idx]
            ident_id = identities[acc_idx]
            dev_id = random.choice(devices)
            ip_addr = random.choice(ips)
            merchant = random.choice(POPULAR_MERCHANTS)
            beneficiary = f"ben_norm_{random.randint(1, 400):04d}"
            
            # Normal amount distribution (log-normal, ~ ₹200 to ₹15,000)
            amount = round(float(np.random.lognormal(mean=7.2, sigma=0.8)), 2)
            amount = max(50.0, min(amount, 85000.0))

            ts = generate_timestamp(self.t0, self.t2)
            split = "train" if ts < self.t1 else "test"

            txs.append({
                "tx_id": f"tx_norm_{i:06d}",
                "timestamp": ts.isoformat(),
                "time_split": split,
                "dataset_class": "Dataset_A_Normal",
                "identity_id": ident_id,
                "account_id": acc_id,
                "device_id": dev_id,
                "ip_address": ip_addr,
                "isp": random.choice(ISPS),
                "city": random.choice(CITIES),
                "merchant_id": merchant["id"],
                "merchant_name": merchant["name"],
                "merchant_category": merchant["category"],
                "beneficiary_id": beneficiary,
                "amount": amount,
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 0, # Normal
                "ground_truth_cluster_id": None,
                "is_coordinated": False
            })
        return {"transactions": txs}

    def _generate_legitimate_dense_dataset(self) -> Dict[str, Any]:
        """Dataset B: Legitimate dense graphs (University, Apartment, Payroll, Flash Sale)"""
        txs = []
        clusters = []

        # 1. University Campus Event (Shared WiFi IP & Geo, but thousands of independent beneficiaries)
        campus_ip = "115.240.88.12"
        campus_cluster_id = "cluster_legit_campus_iit"
        campus_accounts = [f"acc_campus_{i:03d}" for i in range(150)]
        for i in range(450):
            acc_id = random.choice(campus_accounts)
            ts = generate_timestamp(self.t0 + timedelta(days=20), self.t0 + timedelta(days=23))
            txs.append({
                "tx_id": f"tx_campus_{i:05d}",
                "timestamp": ts.isoformat(),
                "time_split": "train" if ts < self.t1 else "test",
                "dataset_class": "Dataset_B_Legit_Dense",
                "identity_id": f"id_{acc_id}",
                "account_id": acc_id,
                "device_id": f"dev_campus_{random.randint(1, 150):03d}",
                "ip_address": campus_ip,
                "isp": "National Knowledge Network",
                "city": "Bengaluru",
                "merchant_id": random.choice(POPULAR_MERCHANTS)["id"],
                "merchant_name": "Campus Canteen / BookStore",
                "merchant_category": "Education/Retail",
                "beneficiary_id": f"ben_campus_indep_{random.randint(1, 300):03d}",
                "amount": round(random.uniform(80.0, 1800.0), 2),
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 0,
                "ground_truth_cluster_id": campus_cluster_id,
                "is_coordinated": False,
                "scenario_type": "university_campus_event"
            })
        clusters.append({
            "cluster_id": campus_cluster_id,
            "type": "legitimate_dense",
            "name": "University Campus WiFi Density",
            "description": "High IP & spatial overlap, but highly divergent independent beneficiaries and low money convergence.",
            "expected_pcc_max": 0.25
        })

        # 2. Corporate Monthly Payroll (One sender account distributing to hundreds of employees)
        corp_cluster_id = "cluster_legit_payroll_tata"
        corp_acc = "acc_corp_hq_payroll"
        for i in range(200):
            ts = self.t0 + timedelta(days=30, hours=9, minutes=random.randint(0, 180))
            txs.append({
                "tx_id": f"tx_payroll_{i:05d}",
                "timestamp": ts.isoformat(),
                "time_split": "train" if ts < self.t1 else "test",
                "dataset_class": "Dataset_B_Legit_Dense",
                "identity_id": "id_corp_hq",
                "account_id": corp_acc,
                "device_id": "dev_corp_server_01",
                "ip_address": "14.140.22.50",
                "isp": "Tata Communications Enterprise",
                "city": "Mumbai",
                "merchant_id": "merch_corporate_payouts",
                "merchant_name": "RazorpayX Payroll Gateway",
                "merchant_category": "Corporate Payouts",
                "beneficiary_id": f"ben_employee_{i:03d}",
                "amount": round(random.uniform(45000.0, 180000.0), 2),
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 0,
                "ground_truth_cluster_id": corp_cluster_id,
                "is_coordinated": False,
                "scenario_type": "corporate_payroll"
            })
        clusters.append({
            "cluster_id": corp_cluster_id,
            "type": "legitimate_dense",
            "name": "Corporate Enterprise Payroll",
            "description": "Single authenticated entity fanning out to verified employees; high 1-to-many fanout with zero ringback or mule convergence.",
            "expected_pcc_max": 0.15
        })

        # 3. Apartment Complex Shared Broadband
        apt_cluster_id = "cluster_legit_apartment_complex"
        apt_ip = "49.207.180.95"
        apt_accounts = [f"acc_apt_{i:03d}" for i in range(80)]
        for i in range(240):
            acc_id = random.choice(apt_accounts)
            ts = generate_timestamp(self.t0 + timedelta(days=50), self.t0 + timedelta(days=70))
            txs.append({
                "tx_id": f"tx_apt_{i:05d}",
                "timestamp": ts.isoformat(),
                "time_split": "train" if ts < self.t1 else "test",
                "dataset_class": "Dataset_B_Legit_Dense",
                "identity_id": f"id_{acc_id}",
                "account_id": acc_id,
                "device_id": f"dev_resident_{acc_id}",
                "ip_address": apt_ip,
                "isp": "ACT Fibernet Bangalore",
                "city": "Bengaluru",
                "merchant_id": random.choice(POPULAR_MERCHANTS)["id"],
                "merchant_name": "Swiggy / Amazon / Uber",
                "merchant_category": "Daily Services",
                "beneficiary_id": f"ben_merchant_pool_{random.randint(1, 50):02d}",
                "amount": round(random.uniform(150.0, 4500.0), 2),
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 0,
                "ground_truth_cluster_id": apt_cluster_id,
                "is_coordinated": False,
                "scenario_type": "apartment_shared_ip"
            })
        clusters.append({
            "cluster_id": apt_cluster_id,
            "type": "legitimate_dense",
            "name": "Apartment Complex Residential Gateway",
            "description": "Shared residential NAT IP; distinct physical devices, independent merchants, no common destination siphon.",
            "expected_pcc_max": 0.20
        })

        return {"transactions": txs, "clusters": clusters}

    def _generate_coordinated_fraud_dataset(self) -> Dict[str, Any]:
        """Dataset C: Hidden Coordinated Bust-Out Fraud Rings (As per PRD Scene 3 & 5)"""
        txs = []
        clusters = []

        # Ring 1: Coordinated Bust-Out #8842 (12 accounts, high velocity sync, converging to 2 cash-out beneficiaries)
        c8842_id = "cluster_fraud_bustout_8842"
        c8842_accounts = [f"acc_bustout_8842_{i:02d}" for i in range(12)]
        c8842_beneficiaries = ["ben_mule_vault_alpha", "ben_mule_vault_beta"]
        
        # Warmup phase (Day 15-40): Low key benign txs
        for acc in c8842_accounts:
            for w in range(3):
                ts = generate_timestamp(self.t0 + timedelta(days=15), self.t0 + timedelta(days=40))
                txs.append({
                    "tx_id": f"tx_c8842_warm_{acc}_{w}",
                    "timestamp": ts.isoformat(),
                    "time_split": "train" if ts < self.t1 else "test",
                    "dataset_class": "Dataset_C_Coordinated_Fraud",
                    "identity_id": f"id_{acc}",
                    "account_id": acc,
                    "device_id": f"dev_shared_ring_a_{random.randint(1,3)}", # Subtle device overlap
                    "ip_address": f"103.21.{random.randint(1,10)}.{random.randint(1,250)}",
                    "isp": "Excitel Broadband",
                    "city": "Delhi NCR",
                    "merchant_id": "merch_swiggy",
                    "merchant_name": "Swiggy",
                    "merchant_category": "Food Delivery",
                    "beneficiary_id": f"ben_normal_food_{random.randint(1,5)}",
                    "amount": round(random.uniform(200.0, 500.0), 2),
                    "currency": "INR",
                    "payment_status": "captured",
                    "ground_truth_label": 1,
                    "ground_truth_cluster_id": c8842_id,
                    "is_coordinated": True,
                    "scenario_type": "bust_out_warmup"
                })

        # Coordinated Burst Extraction Phase (Day 56, strictly inside Test window T1->T2)
        burst_base_time = self.t0 + timedelta(days=56, hours=14)
        for acc in c8842_accounts:
            for b in range(6):
                # Synchronized in tight 12-minute window
                ts = burst_base_time + timedelta(minutes=random.randint(0, 12), seconds=random.randint(0, 59))
                target_ben = c8842_beneficiaries[b % 2]
                amount = round(random.uniform(42000.0, 49500.0), 2) # Deliberately just below ₹50,000 threshold!
                txs.append({
                    "tx_id": f"tx_c8842_burst_{acc}_{b}",
                    "timestamp": ts.isoformat(),
                    "time_split": "test",
                    "dataset_class": "Dataset_C_Coordinated_Fraud",
                    "identity_id": f"id_{acc}",
                    "account_id": acc,
                    "device_id": f"dev_shared_ring_a_{random.randint(1,3)}",
                    "ip_address": f"103.21.5.{random.randint(10,50)}",
                    "isp": "Excitel Broadband",
                    "city": "Delhi NCR",
                    "merchant_id": "merch_crypto_p2p_99",
                    "merchant_name": "Apex P2P Digital Exchange",
                    "merchant_category": "Crypto/P2P",
                    "beneficiary_id": target_ben,
                    "amount": amount,
                    "currency": "INR",
                    "payment_status": "captured",
                    "ground_truth_label": 1,
                    "ground_truth_cluster_id": c8842_id,
                    "is_coordinated": True,
                    "scenario_type": "bust_out_synchronized_extraction"
                })

        clusters.append({
            "cluster_id": c8842_id,
            "type": "coordinated_bustout",
            "name": "Coordinated Syndicate Ring #8842",
            "description": "12 accounts keeping transactions below ₹50K individual rulebook thresholds, while synchronizing money extraction to 2 common mule vaults.",
            "gross_exposure": 12 * 6 * 45000,
            "expected_pcc_min": 0.88
        })

        return {"transactions": txs, "clusters": clusters}

    def _generate_adversarial_evasion_dataset(self) -> Dict[str, Any]:
        """Dataset D: Adversarial Evasion scenarios across Levels 1-6 (Section 26 PRD)"""
        txs = []
        clusters = []

        # Level 1: Obvious Coordination
        l1_id = "cluster_evasion_l1_obvious"
        l1_accs = [f"acc_l1_{i:02d}" for i in range(5)]
        l1_ben = "ben_l1_direct_cashout"
        for acc in l1_accs:
            ts = self.t0 + timedelta(days=62, hours=10, minutes=random.randint(0, 5))
            txs.append({
                "tx_id": f"tx_l1_{acc}",
                "timestamp": ts.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 1,
                "identity_id": f"id_{acc}",
                "account_id": acc,
                "device_id": "dev_shared_l1_identical",
                "ip_address": "122.161.44.10",
                "isp": "Airtel Broadband",
                "city": "Mumbai",
                "merchant_id": "merch_giftcards_quick",
                "merchant_name": "FastVoucher World",
                "merchant_category": "Vouchers",
                "beneficiary_id": l1_ben,
                "amount": 48000.0,
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l1_id,
                "is_coordinated": True
            })
        clusters.append({"cluster_id": l1_id, "level": 1, "name": "Level 1: Obvious Coordination", "description": "Shared IP, device, single beneficiary & sync timing."})

        # Level 2: Infrastructure Distribution (Different IPs and Devices, but Economic Convergence)
        l2_id = "cluster_evasion_l2_infra_dist"
        l2_accs = [f"acc_l2_{i:02d}" for i in range(8)]
        l2_ben = "ben_l2_shared_aggregator"
        for i, acc in enumerate(l2_accs):
            ts = self.t0 + timedelta(days=65, hours=11, minutes=i*4)
            txs.append({
                "tx_id": f"tx_l2_{acc}",
                "timestamp": ts.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 2,
                "identity_id": f"id_{acc}",
                "account_id": acc,
                "device_id": f"dev_l2_unique_{i}",
                "ip_address": f"182.70.{random.randint(10,90)}.{random.randint(1,250)}",
                "isp": random.choice(ISPS),
                "city": random.choice(CITIES),
                "merchant_id": "merch_crypto_p2p_99",
                "merchant_name": "Apex P2P Digital Exchange",
                "merchant_category": "Crypto/P2P",
                "beneficiary_id": l2_ben,
                "amount": 47500.0,
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l2_id,
                "is_coordinated": True
            })
        clusters.append({"cluster_id": l2_id, "level": 2, "name": "Level 2: Infrastructure Distribution", "description": "Distinct IPs & devices, but direct common beneficiary convergence."})

        # Level 3: Multi-Hop Intermediary Coordination
        l3_id = "cluster_evasion_l3_multihop"
        l3_origin_accs = [f"acc_l3_orig_{i:02d}" for i in range(6)]
        l3_mules = [f"ben_l3_mule_interm_{i:02d}" for i in range(3)]
        l3_final_vault = "ben_l3_master_vault_nexus"
        for i, acc in enumerate(l3_origin_accs):
            mule = l3_mules[i % 3]
            ts1 = self.t0 + timedelta(days=68, hours=8, minutes=i*10)
            txs.append({
                "tx_id": f"tx_l3_hop1_{acc}",
                "timestamp": ts1.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 3,
                "identity_id": f"id_{acc}",
                "account_id": acc,
                "device_id": f"dev_l3_{i}",
                "ip_address": f"157.48.{i}.{random.randint(10,200)}",
                "isp": "Jio 5G Fiber",
                "city": "Pune",
                "merchant_id": "merch_gaming_credits",
                "merchant_name": "GoldToken Gaming Ltd",
                "merchant_category": "Virtual Goods",
                "beneficiary_id": mule,
                "amount": 42000.0,
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l3_id,
                "is_coordinated": True,
                "multihop_intermediate": True
            })
            ts2 = ts1 + timedelta(hours=2, minutes=random.randint(10, 45))
            txs.append({
                "tx_id": f"tx_l3_hop2_{mule}_{i}",
                "timestamp": ts2.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 3,
                "identity_id": f"id_{mule}",
                "account_id": f"acc_{mule}",
                "device_id": f"dev_mule_{mule}",
                "ip_address": "103.88.22.14",
                "isp": "Vodafone Idea",
                "city": "Hyderabad",
                "merchant_id": "merch_crypto_p2p_99",
                "merchant_name": "Apex P2P Digital Exchange",
                "merchant_category": "Crypto/P2P",
                "beneficiary_id": l3_final_vault,
                "amount": 41500.0,
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l3_id,
                "is_coordinated": True,
                "multihop_target": l3_final_vault
            })
        clusters.append({"cluster_id": l3_id, "level": 3, "name": "Level 3: Multi-Hop Intermediary Evasion", "description": "Origin accounts transfer to intermediary mules which consolidate into master cashout vault."})

        # Level 4: Temporal Evasion (Jittered timing across 14 days)
        l4_id = "cluster_evasion_l4_temporal_jitter"
        l4_accs = [f"acc_l4_{i:02d}" for i in range(6)]
        l4_ben = "ben_l4_delayed_siphon"
        for i, acc in enumerate(l4_accs):
            ts = self.t0 + timedelta(days=70 + i*2, hours=random.randint(1, 23), minutes=random.randint(0, 59))
            txs.append({
                "tx_id": f"tx_l4_{acc}",
                "timestamp": ts.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 4,
                "identity_id": f"id_{acc}",
                "account_id": acc,
                "device_id": f"dev_l4_{i}",
                "ip_address": f"117.200.{random.randint(1,20)}.{random.randint(1,200)}",
                "isp": "BSNL Fiber",
                "city": random.choice(CITIES),
                "merchant_id": "merch_crypto_p2p_99",
                "merchant_name": "Apex P2P Digital Exchange",
                "merchant_category": "Crypto/P2P",
                "beneficiary_id": l4_ben,
                "amount": round(random.uniform(43000.0, 48000.0), 2),
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l4_id,
                "is_coordinated": True
            })
        clusters.append({"cluster_id": l4_id, "level": 4, "name": "Level 4: Temporal Evasion", "description": "Timing is randomized across 2 weeks to defeat velocity and short-window burst detection."})

        # Level 5: Distributed Cash-Out (Multiple fan-out beneficiaries)
        l5_id = "cluster_evasion_l5_dist_cashout"
        l5_accs = [f"acc_l5_{i:02d}" for i in range(7)]
        l5_bens = [f"ben_l5_split_{i:02d}" for i in range(4)]
        for i, acc in enumerate(l5_accs):
            ts = self.t0 + timedelta(days=82, hours=15, minutes=i*8)
            txs.append({
                "tx_id": f"tx_l5_{acc}",
                "timestamp": ts.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 5,
                "identity_id": f"id_{acc}",
                "account_id": acc,
                "device_id": f"dev_l5_{i % 3}",
                "ip_address": f"103.45.{random.randint(1,5)}.{random.randint(1,250)}",
                "isp": "Jio 5G Fiber",
                "city": "Chennai",
                "merchant_id": "merch_giftcards_quick",
                "merchant_name": "FastVoucher World",
                "merchant_category": "Vouchers",
                "beneficiary_id": l5_bens[i % 4],
                "amount": round(random.uniform(38000.0, 46000.0), 2),
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l5_id,
                "is_coordinated": True
            })
        clusters.append({"cluster_id": l5_id, "level": 5, "name": "Level 5: Distributed Cash-Out", "description": "Cashout split across multiple distinct crypto/voucher beneficiaries with subtle shared hardware pools."})

        # Level 6: Low-and-Slow Coordination (Long term account aging before extraction)
        l6_id = "cluster_evasion_l6_low_and_slow"
        l6_accs = [f"acc_l6_{i:02d}" for i in range(5)]
        l6_target_ben = "ben_l6_dormant_sleeper_vault"
        for acc in l6_accs:
            for day in [5, 18, 32, 48]:
                ts = self.t0 + timedelta(days=day, hours=random.randint(9, 21), minutes=random.randint(0, 59))
                txs.append({
                    "tx_id": f"tx_l6_age_{acc}_{day}",
                    "timestamp": ts.isoformat(),
                    "time_split": "train" if ts < self.t1 else "test",
                    "dataset_class": "Dataset_D_Adversarial_Evasion",
                    "evasion_level": 6,
                    "identity_id": f"id_{acc}",
                    "account_id": acc,
                    "device_id": f"dev_l6_legit_{acc}",
                    "ip_address": f"182.64.{random.randint(1,10)}.{random.randint(1,200)}",
                    "isp": "Airtel Broadband",
                    "city": "Kolkata",
                    "merchant_id": "merch_amazon_in",
                    "merchant_name": "Amazon India",
                    "merchant_category": "E-Commerce",
                    "beneficiary_id": f"ben_amazon_indep_{random.randint(1,20)}",
                    "amount": round(random.uniform(300.0, 1200.0), 2),
                    "currency": "INR",
                    "payment_status": "captured",
                    "ground_truth_label": 1,
                    "ground_truth_cluster_id": l6_id,
                    "is_coordinated": True
                })
        for acc in l6_accs:
            ts = self.t0 + timedelta(days=88, hours=22, minutes=random.randint(0, 15))
            txs.append({
                "tx_id": f"tx_l6_strike_{acc}",
                "timestamp": ts.isoformat(),
                "time_split": "test",
                "dataset_class": "Dataset_D_Adversarial_Evasion",
                "evasion_level": 6,
                "identity_id": f"id_{acc}",
                "account_id": acc,
                "device_id": f"dev_l6_legit_{acc}",
                "ip_address": f"182.64.5.{random.randint(1,200)}",
                "isp": "Airtel Broadband",
                "city": "Kolkata",
                "merchant_id": "merch_crypto_p2p_99",
                "merchant_name": "Apex P2P Digital Exchange",
                "merchant_category": "Crypto/P2P",
                "beneficiary_id": l6_target_ben,
                "amount": 49200.0,
                "currency": "INR",
                "payment_status": "captured",
                "ground_truth_label": 1,
                "ground_truth_cluster_id": l6_id,
                "is_coordinated": True
            })
        clusters.append({"cluster_id": l6_id, "level": 6, "name": "Level 6: Low-and-Slow Sleeper Ring", "description": "Accounts establish 2+ months of legitimate purchase history before synchronized sudden high-value extraction."})

        return {"transactions": txs, "clusters": clusters}

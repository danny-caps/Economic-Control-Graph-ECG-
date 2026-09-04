"""
Temporal Economic Graph & Edge Attribution Engine (NetworkX based)
Implements:
- Multi-entity graph modeling (Identity, Account, Device, IP, Merchant, Beneficiary, Transaction)
- Edge Attribution Engine with Weak vs Strong edge discounting
- Temporal window filtering and graph evolution tracking
- Multi-hop path tracing and cluster feature extraction for Common-Control modeling
"""

import networkx as nx
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Set
from collections import defaultdict

# Popular high-volume merchants that receive weak edge weighting
COMMON_MERCHANTS = {"merch_amazon_in", "merch_swiggy", "merch_zomato", "merch_flipkart", "merch_uber_in"}

class EconomicControlGraphEngine:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.undirected_graph = nx.Graph()
        self.transactions: List[Dict[str, Any]] = []
        self.accounts_info: Dict[str, Dict[str, Any]] = {}
        self.devices_info: Dict[str, Set[str]] = defaultdict(set)
        self.ips_info: Dict[str, Set[str]] = defaultdict(set)
        self.beneficiaries_info: Dict[str, Set[str]] = defaultdict(set)
        self.acc_to_labels: Dict[str, List[int]] = defaultdict(list)
        self.time_window_index: List[Tuple[datetime, str]] = []

    def ingest_transactions(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Ingests transactions and constructs the multi-entity attributed graph"""
        self.transactions = transactions
        self.graph.clear()
        self.undirected_graph.clear()
        self.devices_info.clear()
        self.ips_info.clear()
        self.beneficiaries_info.clear()
        self.acc_to_labels.clear()
        self.time_window_index.clear()

        # Step 1: Add nodes and raw events
        for tx in transactions:
            ts = datetime.fromisoformat(tx["timestamp"])
            self.time_window_index.append((ts, tx["tx_id"]))

            acc_id = tx["account_id"]
            if "ground_truth_label" in tx:
                self.acc_to_labels[acc_id].append(tx["ground_truth_label"])
            ident_id = tx.get("identity_id", f"id_{acc_id}")
            dev_id = tx.get("device_id")
            ip_addr = tx.get("ip_address")
            merch_id = tx.get("merchant_id")
            ben_id = tx.get("beneficiary_id")
            tx_id = tx["tx_id"]
            amount = float(tx.get("amount", tx.get("amount_received", tx.get("amount_paid", 0.0))))

            # Store entity sets for overlap calculation
            if dev_id:
                self.devices_info[dev_id].add(acc_id)
            if ip_addr:
                self.ips_info[ip_addr].add(acc_id)
            if ben_id:
                self.beneficiaries_info[ben_id].add(acc_id)

            # Node insertion with attributes
            self._add_node(acc_id, "Account", {"label": acc_id, "exposure": amount})
            self._add_node(ident_id, "Identity", {"label": ident_id})
            self._add_node(tx_id, "Transaction", {"amount": amount, "timestamp": tx["timestamp"], "status": tx.get("payment_status", "captured")})
            
            if dev_id:
                self._add_node(dev_id, "Device", {"label": dev_id})
            if ip_addr:
                self._add_node(ip_addr, "IP", {"label": ip_addr, "isp": tx.get("isp", "Unknown"), "city": tx.get("city", "Unknown")})
            if merch_id:
                self._add_node(merch_id, "Merchant", {"name": tx.get("merchant_name", merch_id), "category": tx.get("merchant_category", "General")})
            if ben_id:
                self._add_node(ben_id, "Beneficiary", {"label": ben_id})

            # Base structural edges
            self._add_edge(ident_id, acc_id, "identity_of", strength=1.0, confidence=1.0, timestamp=tx["timestamp"], evidence="KYC Provenance")
            self._add_edge(acc_id, tx_id, "initiated", strength=1.0, confidence=1.0, timestamp=tx["timestamp"], evidence="Initiated Transaction")
            
            if ben_id:
                self._add_edge(tx_id, ben_id, "transferred_to", strength=0.95, confidence=0.95, timestamp=tx["timestamp"], evidence="Payment Destination")
                # Direct synthetic economic flow edge
                self._add_edge(acc_id, ben_id, "economic_flow", strength=0.90, confidence=0.90, timestamp=tx["timestamp"], evidence=f"Amount ₹{amount:,.2f}")

            if dev_id:
                self._add_edge(acc_id, dev_id, "used_device", strength=0.75, confidence=0.85, timestamp=tx["timestamp"], evidence="Device Fingerprint")
            if ip_addr:
                # Shared IP is a weaker signal unless corroborated
                is_public_nkn = "Knowledge" in tx.get("isp", "") or "Airtel" in tx.get("isp", "")
                strength = 0.15 if is_public_nkn else 0.35
                self._add_edge(acc_id, ip_addr, "used_ip", strength=strength, confidence=0.60, timestamp=tx["timestamp"], evidence=f"ISP: {tx.get('isp', 'N/A')}")
            if merch_id:
                is_common = merch_id in COMMON_MERCHANTS
                strength = 0.10 if is_common else 0.65
                self._add_edge(acc_id, merch_id, "transacted_at", strength=strength, confidence=0.70, timestamp=tx["timestamp"], evidence=tx.get("merchant_name", merch_id))

        # Step 2: Corroborated Edge Attribution (Discount Weak vs Elevate Strong Edges)
        self._attribute_cross_account_edges(transactions)

        return {
            "total_nodes": self.graph.number_of_nodes(),
            "total_edges": self.graph.number_of_edges(),
            "total_transactions": len(transactions)
        }

    def _add_node(self, node_id: str, node_type: str, attrs: Dict[str, Any]):
        if not self.graph.has_node(node_id):
            self.graph.add_node(node_id, type=node_type, **attrs)
            self.undirected_graph.add_node(node_id, type=node_type, **attrs)
        else:
            # Update cumulative metrics like total exposure
            if "exposure" in attrs and "exposure" in self.graph.nodes[node_id]:
                self.graph.nodes[node_id]["exposure"] += attrs["exposure"]
                self.undirected_graph.nodes[node_id]["exposure"] += attrs["exposure"]

    def _add_edge(self, src: str, dst: str, edge_type: str, strength: float, confidence: float, timestamp: str, evidence: str):
        edge_data = {
            "type": edge_type,
            "strength": round(strength, 3),
            "confidence": round(confidence, 3),
            "timestamp": timestamp,
            "evidence": evidence
        }
        self.graph.add_edge(src, dst, **edge_data)
        # Undirected graph uses the highest strength edge between pairs
        if self.undirected_graph.has_edge(src, dst):
            existing_str = self.undirected_graph[src][dst].get("strength", 0.0)
            if strength > existing_str:
                self.undirected_graph.add_edge(src, dst, **edge_data)
        else:
            self.undirected_graph.add_edge(src, dst, **edge_data)

    def _attribute_cross_account_edges(self, transactions: List[Dict[str, Any]]):
        """Discounts weak edges (same ISP/City) and elevates strong edges (timing synchronization, common mule vault)"""
        # 1. Device Sharing (Strong)
        for dev_id, accs in self.devices_info.items():
            acc_list = list(accs)
            if len(acc_list) > 1 and len(acc_list) <= 15: # Specific device ring
                for i in range(len(acc_list)):
                    for j in range(i + 1, len(acc_list)):
                        self._add_edge(
                            acc_list[i], acc_list[j],
                            edge_type="shared_hardware",
                            strength=0.88,
                            confidence=0.92,
                            timestamp=datetime.now().isoformat(),
                            evidence=f"Direct Hardware Collision: {dev_id}"
                        )

        # 2. Beneficiary Convergence (Strong)
        for ben_id, accs in self.beneficiaries_info.items():
            acc_list = list(accs)
            if len(acc_list) > 1:
                # If multiple accounts send to the SAME beneficiary, calculate timing synchronicity
                strength = min(0.95, 0.65 + 0.05 * len(acc_list))
                for i in range(len(acc_list)):
                    for j in range(i + 1, len(acc_list)):
                        self._add_edge(
                            acc_list[i], acc_list[j],
                            edge_type="beneficiary_convergence",
                            strength=strength,
                            confidence=0.90,
                            timestamp=datetime.now().isoformat(),
                            evidence=f"Common Siphon Target: {ben_id}"
                        )

        # 3. Temporal Synchronicity Check (Transactions occurring within <= 15 minutes of each other at high amounts)
        time_sorted = sorted(transactions, key=lambda x: x["timestamp"])
        window_sec = 900 # 15 min
        n = len(time_sorted)
        for i in range(n):
            t1 = datetime.fromisoformat(time_sorted[i]["timestamp"])
            acc1 = time_sorted[i]["account_id"]
            amt1 = float(time_sorted[i].get("amount", 0))
            if amt1 < 25000: # Focus synchronicity evaluation on significant amounts
                continue
            
            for j in range(i + 1, min(i + 30, n)):
                t2 = datetime.fromisoformat(time_sorted[j]["timestamp"])
                if (t2 - t1).total_seconds() > window_sec:
                    break
                acc2 = time_sorted[j]["account_id"]
                amt2 = float(time_sorted[j].get("amount", 0))
                if acc1 != acc2 and amt2 >= 25000:
                    # Synchronized high-value burst
                    self._add_edge(
                        acc1, acc2,
                        edge_type="synchronized_burst",
                        strength=0.91,
                        confidence=0.87,
                        timestamp=time_sorted[j]["timestamp"],
                        evidence=f"Δt={(t2 - t1).total_seconds():.0f}s (₹{amt1:,.0f} & ₹{amt2:,.0f})"
                    )

    def extract_clusters(self, min_size: int = 2, max_clusters: int = 50) -> List[Dict[str, Any]]:
        """
        Extracts candidate multi-entity connected components / subgraphs
        and computes rich topological + temporal features for Common-Control prediction
        """
        # Build strong-edge filtered graph for cluster discovery to prevent single giant components from weak edges
        cluster_subgraph = nx.Graph()
        for u, v, data in self.undirected_graph.edges(data=True):
            if data.get("strength", 0.0) >= 0.40: # Filter out weak ambient edges
                cluster_subgraph.add_edge(u, v, **data)

        components = list(nx.connected_components(cluster_subgraph))
        clusters = []
        cluster_idx = 1001

        for comp in sorted(components, key=len, reverse=True):
            if len(comp) < min_size:
                continue

            subG = self.graph.subgraph(comp)
            undir_subG = self.undirected_graph.subgraph(comp)

            # Categorize nodes
            accounts = [n for n in comp if undir_subG.nodes[n].get("type") == "Account"]
            beneficiaries = [n for n in comp if undir_subG.nodes[n].get("type") == "Beneficiary"]
            devices = [n for n in comp if undir_subG.nodes[n].get("type") == "Device"]
            ips = [n for n in comp if undir_subG.nodes[n].get("type") == "IP"]
            transactions = [n for n in comp if undir_subG.nodes[n].get("type") == "Transaction"]

            if not accounts:
                continue

            # Calculate Topological & Temporal Features
            num_nodes = len(comp)
            num_edges = undir_subG.number_of_edges()
            density = nx.density(undir_subG) if num_nodes > 1 else 0.0
            
            # Exposure calculations
            gross_exposure = sum(undir_subG.nodes[acc].get("exposure", 0.0) for acc in accounts)
            
            # Convergence Ratio: accounts per beneficiary
            num_bens = max(1, len(beneficiaries))
            beneficiary_convergence_ratio = round(len(accounts) / num_bens, 2)

            # Uncommon device overlap ratio
            uncommon_device_ratio = round(len(devices) / max(1, len(accounts)), 2)

            # Edge strength distribution
            edge_strengths = [d.get("strength", 0.5) for _, _, d in undir_subG.edges(data=True)]
            mean_edge_strength = float(np.mean(edge_strengths)) if edge_strengths else 0.5
            strong_edge_count = sum(1 for s in edge_strengths if s >= 0.75)
            weak_edge_count = sum(1 for s in edge_strengths if s < 0.30)

            # Temporal metrics
            tx_times = []
            for t_node in transactions:
                t_str = undir_subG.nodes[t_node].get("timestamp")
                if t_str:
                    try:
                        tx_times.append(datetime.fromisoformat(t_str))
                    except:
                        pass
            
            temporal_sync_score = 0.0
            if len(tx_times) >= 2:
                tx_times.sort()
                time_span_hours = max(0.1, (tx_times[-1] - tx_times[0]).total_seconds() / 3600.0)
                tx_velocity = len(tx_times) / time_span_hours
                # High velocity in short window -> high sync
                temporal_sync_score = min(1.0, tx_velocity / 15.0)
            else:
                time_span_hours = 24.0

            # Multi-hop depth estimation
            if len(undir_subG) <= 40 and nx.is_connected(undir_subG):
                try:
                    diameter = nx.diameter(undir_subG)
                except:
                    diameter = 2
            else:
                diameter = min(6, max(2, len(undir_subG) // 6))

            cluster_id = f"cluster_{cluster_idx}"
            cluster_idx += 1

            # Determine ground truth label if present in component
            gt_labels = []
            for acc in accounts:
                gt_labels.extend(self.acc_to_labels.get(acc, []))
            is_fraud_gt = sum(gt_labels) > (len(gt_labels) / 2) if gt_labels else False

            clusters.append({
                "cluster_id": cluster_id,
                "node_count": num_nodes,
                "edge_count": num_edges,
                "accounts_count": len(accounts),
                "beneficiaries_count": len(beneficiaries),
                "devices_count": len(devices),
                "ips_count": len(ips),
                "transactions_count": len(transactions),
                "accounts": accounts,
                "beneficiaries": beneficiaries,
                "devices": devices,
                "ips": ips,
                "density": round(density, 4),
                "mean_edge_strength": round(mean_edge_strength, 3),
                "strong_edge_count": strong_edge_count,
                "weak_edge_count": weak_edge_count,
                "beneficiary_convergence_ratio": beneficiary_convergence_ratio,
                "uncommon_device_ratio": uncommon_device_ratio,
                "temporal_sync_score": round(temporal_sync_score, 3),
                "time_span_hours": round(time_span_hours, 1),
                "multi_hop_depth": diameter,
                "gross_exposure": round(gross_exposure, 2),
                "is_ground_truth_coordinated": is_fraud_gt
            })

            if len(clusters) >= max_clusters:
                break

        return clusters

    def get_time_window_graph(self, start_ts: str, end_ts: str) -> Dict[str, Any]:
        """Returns the active nodes, edges, and state for a specific temporal snapshot"""
        t_start = datetime.fromisoformat(start_ts)
        t_end = datetime.fromisoformat(end_ts)

        active_tx_ids = set()
        active_node_ids = set()
        for ts, tx_id in self.time_window_index:
            if t_start <= ts <= t_end:
                active_tx_ids.add(tx_id)

        # Collect entities involved in active transactions
        for tx in self.transactions:
            if tx["tx_id"] in active_tx_ids:
                active_node_ids.add(tx["tx_id"])
                active_node_ids.add(tx["account_id"])
                active_node_ids.add(tx.get("identity_id", f"id_{tx['account_id']}"))
                if tx.get("device_id"): active_node_ids.add(tx["device_id"])
                if tx.get("ip_address"): active_node_ids.add(tx["ip_address"])
                if tx.get("merchant_id"): active_node_ids.add(tx["merchant_id"])
                if tx.get("beneficiary_id"): active_node_ids.add(tx["beneficiary_id"])

        subG = self.graph.subgraph(active_node_ids)
        nodes = []
        for n, d in subG.nodes(data=True):
            nodes.append({
                "id": n,
                "type": d.get("type", "Unknown"),
                "label": d.get("label", n),
                "exposure": d.get("exposure", 0.0),
                "name": d.get("name", n)
            })

        edges = []
        for u, v, d in subG.edges(data=True):
            edges.append({
                "source": u,
                "target": v,
                "type": d.get("type", "connected"),
                "strength": d.get("strength", 0.5),
                "confidence": d.get("confidence", 0.8),
                "evidence": d.get("evidence", ""),
                "timestamp": d.get("timestamp", "")
            })

        return {
            "start_time": start_ts,
            "end_time": end_ts,
            "nodes_count": len(nodes),
            "edges_count": len(edges),
            "nodes": nodes,
            "edges": edges
        }

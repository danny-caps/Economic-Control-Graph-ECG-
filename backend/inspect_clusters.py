import sys
sys.path.insert(0, '.')
from app.generator import SyntheticDatasetGenerator
from app.graph_engine import EconomicControlGraphEngine

g = SyntheticDatasetGenerator(num_normal_tx=1500)
data = g.generate_all()
ge = EconomicControlGraphEngine()
ge.ingest_transactions(data['transactions'])
clusters = ge.extract_clusters(min_size=2)

print("GRAPH CLUSTER IDs:")
for c in clusters:
    accs = c.get('accounts', [])
    print(f"  {c['cluster_id']} | accounts={c.get('accounts_count','?')} | devices={c.get('devices_count','?')} | sample_accs={accs[:3]}")

print()
print("GROUND TRUTH fraud IDs:")
for cl in data['ground_truth_clusters']['fraud_clusters']:
    print(f"  {cl['cluster_id']}")

print("GROUND TRUTH evasion IDs:")
for cl in data['ground_truth_clusters']['evasion_clusters']:
    print(f"  {cl['cluster_id']}")

print("GROUND TRUTH legit IDs:")
for cl in data['ground_truth_clusters']['legitimate_clusters']:
    print(f"  {cl['cluster_id']}")

# Show what accounts are in each ground-truth cluster by sampling transactions
print()
print("TRANSACTIONS with ground_truth_cluster_id (sample):")
for tx in data['transactions'][:5000]:
    cid = tx.get('ground_truth_cluster_id')
    if cid and cid != 'None':
        print(f"  tx={tx['tx_id']} acc={tx['account_id']} gt_cluster={cid} ds_class={tx.get('dataset_class')}")
        break

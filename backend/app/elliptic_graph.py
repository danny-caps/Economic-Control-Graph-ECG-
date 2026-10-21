import networkx as nx
from community import community_louvain 

class EllipticTopologyEngine:
    @staticmethod
    def build_and_analyze(edges_df):
        G = nx.from_pandas_edgelist(
            edges_df, 
            source='txId1', 
            target='txId2', 
            create_using=nx.DiGraph()
        )
        G_undirected = G.to_undirected()
        
        wcc_map = {}
        for comp in nx.weakly_connected_components(G):
            size = len(comp)
            for node in comp:
                wcc_map[node] = size
                
        G_core = nx.Graph(G_undirected)
        G_core.remove_edges_from(nx.selfloop_edges(G_core))
        core_numbers = nx.core_number(G_core)
        
        try:
            communities = community_louvain.best_partition(G_undirected)
            community_sizes = {}
            for node, comm_id in communities.items():
                community_sizes[comm_id] = community_sizes.get(comm_id, 0) + 1
        except Exception:
            communities = {n: 0 for n in G.nodes()}
            community_sizes = {0: len(G.nodes())}

        for node in G.nodes():
            G.nodes[node]['wcc_size'] = wcc_map.get(node, 1)
            G.nodes[node]['core_number'] = core_numbers.get(node, 0)
            G.nodes[node]['community_size'] = community_sizes.get(communities.get(node, 0), 1)

        return G

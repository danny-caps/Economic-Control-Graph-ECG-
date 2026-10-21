import networkx as nx
from community import community_louvain 

class EllipticTopologyEngine:
    @staticmethod
    def build_and_analyze(edges_df, node_ids=None):
        G = nx.DiGraph()
        if node_ids is not None:
            G.add_nodes_from(str(node_id) for node_id in node_ids)
        G.add_edges_from(
            (str(source), str(target))
            for source, target in edges_df[["txId1", "txId2"]].itertuples(
                index=False, name=None
            )
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
        
        communities = (
            community_louvain.best_partition(G_undirected)
            if G.number_of_nodes()
            else {}
        )
        community_sizes = {}
        for node, comm_id in communities.items():
            community_sizes[comm_id] = community_sizes.get(comm_id, 0) + 1

        for node in G.nodes():
            G.nodes[node]['wcc_size'] = wcc_map.get(node, 1)
            G.nodes[node]['core_number'] = core_numbers.get(node, 0)
            G.nodes[node]['community_size'] = community_sizes.get(communities.get(node, 0), 1)
            G.nodes[node]['community_id'] = communities.get(node, 0)

        return G

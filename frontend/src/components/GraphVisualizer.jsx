import React, { useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';
import { 
  Play, Pause, RotateCcw, ZoomIn, ZoomOut, Maximize2, 
  Layers, ShieldAlert, Cpu, Network as NetIcon, Users, CreditCard 
} from 'lucide-react';

const NODE_COLORS = {
  Account: { background: '#1d4ed8', border: '#60a5fa', highlight: '#93c5fd' },
  Identity: { background: '#0e7490', border: '#22d3ee', highlight: '#67e8f9' },
  Device: { background: '#b45309', border: '#fbbf24', highlight: '#fde68a' },
  IP: { background: '#6d28d9', border: '#c084fc', highlight: '#e9d5ff' },
  Merchant: { background: '#047857', border: '#34d399', highlight: '#a7f3d0' },
  Beneficiary: { background: '#b91c1c', border: '#f87171', highlight: '#fca5a5' },
  Transaction: { background: '#334155', border: '#94a3b8', highlight: '#cbd5e1' },
  Unknown: { background: '#475569', border: '#cbd5e1', highlight: '#f1f5f9' }
};

export default function GraphVisualizer({ clusterId, onSelectNode }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [timelineStep, setTimelineStep] = useState(100); // 0 to 100%
  const [filterType, setFilterType] = useState('ALL');
  const [physicsEnabled, setPhysicsEnabled] = useState(true);

  // Fetch active graph data from backend
  useEffect(() => {
    setLoading(true);
    const url = clusterId ? `/api/graph/active?cluster_id=${clusterId}` : `/api/graph/active?limit_nodes=180`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        setGraphData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load graph data", err);
        setLoading(false);
      });
  }, [clusterId]);

  // Initialize Vis-Network
  useEffect(() => {
    if (!containerRef.current || loading || !graphData.nodes.length) return;

    // Filter nodes based on type and timeline step
    const cutoffIndex = Math.max(10, Math.floor((graphData.nodes.length * timelineStep) / 100));
    const activeRawNodes = graphData.nodes.slice(0, cutoffIndex);
    const activeNodeIds = new Set(activeRawNodes.map(n => n.id));

    const formattedNodes = activeRawNodes
      .filter(n => filterType === 'ALL' || n.type === filterType)
      .map(n => {
        const colors = NODE_COLORS[n.type] || NODE_COLORS.Unknown;
        const isBeneficiary = n.type === 'Beneficiary';
        const isAccount = n.type === 'Account';
        return {
          id: n.id,
          label: n.label || n.id,
          shape: isBeneficiary ? 'hexagon' : isAccount ? 'dot' : n.type === 'Device' ? 'box' : 'dot',
          size: isBeneficiary ? 24 : isAccount ? 18 : 12,
          color: {
            background: colors.background,
            border: colors.border,
            highlight: { background: colors.highlight, border: '#ffffff' }
          },
          borderWidth: isBeneficiary ? 3 : 1.5,
          font: {
            color: '#f8fafc',
            size: 11,
            face: 'JetBrains Mono',
            strokeWidth: 2,
            strokeColor: '#090d16'
          },
          shadow: {
            enabled: isBeneficiary || isAccount,
            color: isBeneficiary ? 'rgba(239, 68, 68, 0.4)' : 'rgba(51, 149, 255, 0.3)',
            size: 10
          },
          rawData: n
        };
      });

    const visibleNodeIds = new Set(formattedNodes.map(n => n.id));

    const formattedEdges = graphData.edges
      .filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target))
      .map(e => {
        const isStrong = (e.strength || 0) >= 0.75;
        return {
          id: e.id || `${e.source}_${e.target}`,
          from: e.source,
          to: e.target,
          width: isStrong ? 2.5 : 1.0,
          color: {
            color: isStrong ? '#38bdf8' : 'rgba(148, 163, 184, 0.25)',
            highlight: '#ffffff',
            hover: '#60a5fa'
          },
          dashes: !isStrong,
          arrows: {
            to: { enabled: true, scaleFactor: 0.6 }
          },
          smooth: { type: 'continuous' }
        };
      });

    const data = { nodes: formattedNodes, edges: formattedEdges };

    const options = {
      physics: {
        enabled: physicsEnabled,
        barnesHut: {
          gravitationalConstant: -2800,
          centralGravity: 0.25,
          springLength: 85,
          springConstant: 0.04,
          damping: 0.09
        },
        stabilization: { iterations: 100 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 150,
        zoomView: true,
        dragView: true
      }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    network.on('click', params => {
      if (params.nodes.length > 0) {
        const clickedId = params.nodes[0];
        const clickedNode = graphData.nodes.find(n => n.id === clickedId);
        setSelectedEntity(clickedNode);
        if (onSelectNode) onSelectNode(clickedNode);
      } else {
        setSelectedEntity(null);
      }
    });

    return () => {
      network.destroy();
    };
  }, [graphData, loading, timelineStep, filterType, physicsEnabled]);

  // Timeline playback animation
  useEffect(() => {
    let interval = null;
    if (isPlayingTimeline) {
      interval = setInterval(() => {
        setTimelineStep(prev => {
          if (prev >= 100) {
            setIsPlayingTimeline(false);
            return 100;
          }
          return prev + 5;
        });
      }, 400);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  return (
    <div className="glass-panel" style={{ height: '580px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {/* Top Toolbar */}
      <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', background: 'rgba(9, 13, 22, 0.7)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="pulse-dot pulse-blue"></div>
          <span style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {clusterId ? `Economic Control Subgraph: ${clusterId}` : 'Global Attributed Economic Control Graph'}
          </span>
          <span className="badge badge-blue">
            {graphData.nodes.length} Nodes • {graphData.edges.length} Edges
          </span>
        </div>

        {/* Node Type Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
          {['ALL', 'Account', 'Beneficiary', 'Device', 'IP', 'Merchant'].map(t => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              style={{
                background: filterType === t ? 'rgba(51, 149, 255, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: filterType === t ? '#60a5fa' : '#94a3b8',
                border: `1px solid ${filterType === t ? 'rgba(51, 149, 255, 0.4)' : 'transparent'}`,
                padding: '4px 9px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: '11px'
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button 
            className="btn-secondary" 
            style={{ padding: '5px 10px', fontSize: '12px' }}
            onClick={() => networkRef.current?.fit()}
            title="Fit to Screen"
          >
            <Maximize2 size={13} />
          </button>
          <button 
            className="btn-secondary" 
            style={{ padding: '5px 10px', fontSize: '12px' }}
            onClick={() => setPhysicsEnabled(!physicsEnabled)}
            title="Toggle Physics"
          >
            <Layers size={13} />
            <span style={{ fontSize: '11px' }}>{physicsEnabled ? 'Physics On' : 'Locked'}</span>
          </button>
        </div>
      </div>

      {/* Network Canvas Container */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#05070d' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6, 9, 17, 0.8)', zIndex: 10 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div className="pulse-dot pulse-blue" style={{ width: '16px', height: '16px' }}></div>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>Rendering Economic Control Topology...</span>
            </div>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating Legend */}
        <div style={{ position: 'absolute', bottom: '65px', left: '16px', background: 'rgba(10, 15, 26, 0.88)', backdropFilter: 'blur(8px)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 5 }}>
          <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '2px' }}>Graph Entities & Edges</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#1d4ed8', border: '1px solid #60a5fa' }} /> Account</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#b91c1c', border: '1px solid #f87171' }} /> Cashout Vault</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '9px', height: '9px', borderRadius: '2px', background: '#b45309' }} /> Shared Device</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#6d28d9' }} /> Network IP</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '2px', background: '#38bdf8' }} /> Strong Link</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '1px', background: '#94a3b8', borderStyle: 'dashed' }} /> Discounted Link</div>
          </div>
        </div>

        {/* Selected Entity Card Modal */}
        {selectedEntity && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', width: '280px', background: 'rgba(13, 19, 34, 0.95)', backdropFilter: 'blur(12px)', border: '1px solid var(--border-glow)', borderRadius: '10px', padding: '14px', zIndex: 15, boxShadow: '0 8px 24px rgba(0,0,0,0.6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <span className="badge badge-blue">{selectedEntity.type}</span>
                <h4 style={{ fontSize: '13px', marginTop: '6px', fontFamily: 'JetBrains Mono', color: '#f8fafc', wordBreak: 'break-all' }}>
                  {selectedEntity.id}
                </h4>
              </div>
              <button onClick={() => setSelectedEntity(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>✕</button>
            </div>
            
            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px' }}>
              {selectedEntity.exposure > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Entity Exposure:</span>
                  <span className="metric-num" style={{ color: '#f87171' }}>₹{selectedEntity.exposure.toLocaleString('en-IN')}</span>
                </div>
              )}
              {selectedEntity.name && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Entity Name:</span>
                  <span style={{ color: '#f1f5f9' }}>{selectedEntity.name}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Provenance:</span>
                <span style={{ color: '#34d399' }}>Verified KYC / API</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Time-Slider Evolution Playback Bar (PRD Section 14) */}
      <div style={{ padding: '10px 18px', background: 'rgba(8, 12, 20, 0.95)', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          className="btn-primary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
          onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
        >
          {isPlayingTimeline ? <Pause size={13} /> : <Play size={13} />}
          <span>{isPlayingTimeline ? 'Pause' : 'Replay Evolution'}</span>
        </button>

        <button
          className="btn-secondary"
          style={{ padding: '6px 10px' }}
          onClick={() => { setTimelineStep(10); setIsPlayingTimeline(true); }}
          title="Restart Timeline"
        >
          <RotateCcw size={12} />
        </button>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>T0 (Day 1)</span>
          <input
            type="range"
            min="10"
            max="100"
            value={timelineStep}
            onChange={(e) => setTimelineStep(Number(e.target.value))}
            style={{ flex: 1, accentColor: '#3395FF', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '11px', color: '#60a5fa', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
            T2 (Day 90: {timelineStep}%)
          </span>
        </div>
      </div>
    </div>
  );
}

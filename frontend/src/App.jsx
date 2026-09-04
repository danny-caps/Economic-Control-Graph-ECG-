import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, Activity, Network as NetIcon, Sliders, Bot, 
  BarChart3, Sparkles, RefreshCw, Play, ArrowRight, CheckCircle2, 
  AlertTriangle, DollarSign, Layers, ChevronRight, Scale, ShieldCheck,
  FileText, Briefcase, HelpCircle, ArrowUpRight, Lock, Eye, Download
} from 'lucide-react';

import GraphVisualizer from './components/GraphVisualizer';
import ClusterDeepDive from './components/ClusterDeepDive';
import CounterfactualPlayground from './components/CounterfactualPlayground';
import InvestigatorCopilot from './components/InvestigatorCopilot';
import BenchmarkLab from './components/BenchmarkLab';
import DemoNarrativeModal from './components/DemoNarrativeModal';
import ExecutiveSummaryModal from './components/ExecutiveSummaryModal';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [viewMode, setViewMode] = useState('executive'); // 'executive' | 'forensic'
  const [showExecutiveModal, setShowExecutiveModal] = useState(false);
  const [overviewData, setOverviewData] = useState(null);
  const [clustersData, setClustersData] = useState([]);
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [demoScenes, setDemoScenes] = useState([]);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [interventionAction, setInterventionAction] = useState(null);

  // Fetch initial system state
  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewRes, clustersRes, scenesRes] = await Promise.all([
        fetch('/api/overview').then(r => r.json()),
        fetch('/api/clusters').then(r => r.json()),
        fetch('/api/demo/scenes').then(r => r.json())
      ]);

      setOverviewData(overviewRes);
      setClustersData(clustersRes.clusters || []);
      setDemoScenes(scenesRes);
      if (clustersRes.clusters && clustersRes.clusters.length > 0) {
        setSelectedCluster(clustersRes.clusters[0]);
      }
      setLoading(false);
    } catch (err) {
      console.error("Failed to load initial data", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRegenerateData = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch('/api/generate-data?num_tx=5000', { method: 'POST' });
      await res.json();
      await loadData();
    } catch (err) {
      console.error("Regeneration error", err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSimulateCluster = (cluster) => {
    setSelectedCluster(cluster);
    setActiveTab('counterfactual');
  };

  const handleInspectCluster = (cluster) => {
    setSelectedCluster(cluster);
    setActiveTab('deepdive');
  };

  const metrics = overviewData?.metrics || {};

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Main Navigation Header */}
      <header style={{
        background: 'rgba(8, 12, 22, 0.95)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '12px 24px'
      }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0C2340 0%, #3395FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(51, 149, 255, 0.4)',
              border: '1px solid rgba(51, 149, 255, 0.5)'
            }}>
              <NetIcon size={22} color="white" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ fontSize: '17px', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                  Economic Control Graph <span className="text-gradient-blue">(ECG)</span>
                </h1>
                <span className="badge badge-blue" style={{ fontSize: '10px' }}>Track 02 MVP</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="pulse-dot pulse-green" style={{ width: '6px', height: '6px' }}></span>
                <span>Razorpay AI Risk Manager • Defensive Correlation Intelligence</span>
              </div>
            </div>
          </div>

          {/* Action CTAs & Mode Switcher */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* View Mode Toggle */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '3px',
              borderRadius: '10px',
              display: 'flex',
              border: '1px solid var(--border-subtle)'
            }}>
              <button
                onClick={() => setViewMode('executive')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'executive' ? 'linear-gradient(135deg, #0C2340 0%, #3395FF 100%)' : 'transparent',
                  color: viewMode === 'executive' ? '#ffffff' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Briefcase size={12} />
                <span>Executive Financial</span>
              </button>
              <button
                onClick={() => setViewMode('forensic')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: viewMode === 'forensic' ? 'rgba(51, 149, 255, 0.25)' : 'transparent',
                  color: viewMode === 'forensic' ? '#60a5fa' : '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Layers size={12} />
                <span>Forensic Science</span>
              </button>
            </div>

            <button
              className="btn-secondary"
              onClick={() => setShowExecutiveModal(true)}
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              <FileText size={13} color="#60a5fa" />
              <span>Export Executive Briefing</span>
            </button>

            <button
              className="btn-secondary"
              onClick={handleRegenerateData}
              disabled={isRegenerating}
              style={{ fontSize: '12px', padding: '7px 14px' }}
            >
              <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
              <span>{isRegenerating ? 'Recalibrating...' : 'Regenerate'}</span>
            </button>

            <button
              className="btn-primary"
              onClick={() => { setShowDemoModal(true); setActiveSceneIndex(0); }}
              style={{ fontSize: '12px', padding: '7px 16px', background: 'linear-gradient(135deg, #3395FF 0%, #0070f3 100%)' }}
            >
              <Sparkles size={14} />
              <span>5-Min PRD Demo Story</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ maxWidth: '1440px', margin: '12px auto 0', display: 'flex', gap: '4px', overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
          {[
            { id: 'overview', label: viewMode === 'executive' ? '🏢 Executive Risk Dashboard' : '🏢 CRO Portfolio Overview', icon: Activity },
            { id: 'graph', label: viewMode === 'executive' ? '🕸️ Visual Syndicate Map' : '🕸️ Interactive Control Graph', icon: NetIcon },
            { id: 'deepdive', label: viewMode === 'executive' ? '🔍 Evidence & Audit Breakdown' : '🔍 Cluster Drilldown & SHAP', icon: Layers },
            { id: 'counterfactual', label: viewMode === 'executive' ? '⚖️ Capital Preservation Simulator' : '⚖️ Counterfactual Simulator', icon: Scale },
            { id: 'copilot', label: viewMode === 'executive' ? '🤖 AI Risk Analyst Assistant' : '🤖 AI Investigator Copilot', icon: Bot },
            { id: 'benchmarks', label: viewMode === 'executive' ? '📊 Model Accuracy & ROI Lab' : '📊 Benchmark & Ablation Lab', icon: BarChart3 },
          ].map(t => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  background: isActive ? 'rgba(51, 149, 255, 0.18)' : 'transparent',
                  color: isActive ? '#60a5fa' : '#94a3b8',
                  border: `1px solid ${isActive ? 'rgba(51, 149, 255, 0.35)' : 'transparent'}`,
                  borderRadius: '8px',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body Content */}
      <main style={{ flex: 1, maxWidth: '1440px', width: '100%', margin: '0 auto', padding: '24px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', gap: '14px' }}>
            <div className="pulse-dot pulse-blue" style={{ width: '20px', height: '20px' }}></div>
            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Initializing Economic Control Graph Engine & Ingesting Transactions...</span>
          </div>
        ) : (
          <>
            {/* View 1: CRO Portfolio Overview (PRD §23) */}
            {activeTab === 'overview' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* Executive Risk Briefing Banner for Finance Managers */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(13, 27, 62, 0.8) 0%, rgba(8, 14, 28, 0.95) 100%)',
                  border: '1px solid rgba(51, 149, 255, 0.35)',
                  borderRadius: '14px',
                  padding: '18px 22px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  boxShadow: '0 8px 30px rgba(51, 149, 255, 0.1)'
                }}>
                  <div style={{ maxWidth: '820px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="pulse-dot pulse-red" style={{ width: '8px', height: '8px' }}></span>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Executive Financial Alert • Coordinated Syndicate Detected
                      </span>
                    </div>
                    <h3 style={{ fontSize: '16px', color: '#f8fafc', fontWeight: 700, lineHeight: 1.4 }}>
                      {viewMode === 'executive'
                        ? '3 coordinated merchant rings are currently transacting under individual ₹50,000 limits to siphon funds to a common vault.'
                        : 'ECG has isolated 3 high-probability Common-Control subgraphs (Pcc ≥ 70%) evading entity-level threshold filters.'}
                    </h3>
                    <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                      💡 <strong>Financial Impact:</strong> ₹3.95 Cr at immediate settlement risk. Recommended mitigation (Velocity Throttling) preserves <strong>+₹3.10 Cr</strong> while avoiding ₹44.30 L in false-alarm merchant friction.
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      className="btn-primary"
                      onClick={() => setShowExecutiveModal(true)}
                      style={{ fontSize: '12px', padding: '8px 16px' }}
                    >
                      <Briefcase size={14} />
                      <span>View CRO Briefing</span>
                    </button>
                  </div>
                </div>

                {/* 5 Main CRO Portfolio Metric Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  {/* Metric 1 */}
                  <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #3395FF' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{viewMode === 'executive' ? 'GROSS BALANCE EXPOSURE' : 'TOTAL NETWORK EXPOSURE'}</span>
                      <span title="Total transaction volume flowing across all flagged connected accounts">ℹ️</span>
                    </div>
                    <div className="metric-num text-gradient-blue" style={{ fontSize: '26px', marginTop: '6px' }}>
                      {metrics.total_network_exposure_formatted || '₹4.20 Cr'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Across {metrics.total_analyzed_entities || 0} monitored entities
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{viewMode === 'executive' ? 'ACTIVE SYNDICATE RINGS' : 'HIGH-RISK CLUSTERS'}</span>
                      <span title="Clusters with Common-Control Probability ≥ 70%">ℹ️</span>
                    </div>
                    <div className="metric-num" style={{ fontSize: '26px', color: '#f87171', marginTop: '6px' }}>
                      {metrics.high_risk_clusters_count || 3} Active Rings
                    </div>
                    <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '4px' }}>
                      {viewMode === 'executive' ? 'Coordinated Attack Groups' : 'Pcc ≥ 70.0% Common-Control'}
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="glass-panel-glow" style={{ padding: '18px', borderLeft: '4px solid #f97316' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{viewMode === 'executive' ? 'CAPITAL AT RISK (NAE)' : 'CORRELATED EXPOSURE (NAE)'}</span>
                      <span title="Gross Exposure scaled by Common-Control Probability and recovery friction">ℹ️</span>
                    </div>
                    <div className="metric-num text-gradient-gold" style={{ fontSize: '26px', marginTop: '6px' }}>
                      {metrics.correlated_exposure_formatted || '₹3.95 Cr'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>
                      {viewMode === 'executive' ? 'Net Balance-Sheet Liability' : 'Network-Adjusted At-Risk Capital'}
                    </div>
                  </div>

                  {/* Metric 4 */}
                  <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #a855f7' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{viewMode === 'executive' ? 'SETTLEMENT CASCADE RISK' : 'POTENTIAL CONTAGION'}</span>
                      <span title="Estimated potential losses spilling into downstream payout gateways and partner banks">ℹ️</span>
                    </div>
                    <div className="metric-num" style={{ fontSize: '26px', color: '#c084fc', marginTop: '6px' }}>
                      {metrics.potential_contagion_formatted || '₹1.45 Cr'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#e9d5ff', marginTop: '4px' }}>
                      Downstream settlement cascade
                    </div>
                  </div>

                  {/* Metric 5 */}
                  <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{viewMode === 'executive' ? 'FALSE ALARM REVENUE SAVED' : 'FALSE-POSITIVE COST AVOIDED'}</span>
                      <span title="Legitimate merchant volume protected by discounting uncorroborated shared campus/apartment IPs">ℹ️</span>
                    </div>
                    <div className="metric-num" style={{ fontSize: '26px', color: '#34d399', marginTop: '6px' }}>
                      {metrics.false_positive_cost_avoided_formatted || '₹44.30 L'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6ee7b7', marginTop: '4px' }}>
                      Protected legitimate merchant revenue
                    </div>
                  </div>
                </div>

                {/* Risk Hierarchy Flow (PRD §17) */}
                <div className="glass-panel" style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>Risk Hierarchy:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                    <span>ENTITY RISK</span>
                    <ChevronRight size={13} color="#64748b" />
                    <span>EDGE ATTRIBUTION</span>
                    <ChevronRight size={13} color="#64748b" />
                    <span>CLUSTER RISK</span>
                    <ChevronRight size={13} color="#64748b" />
                    <span style={{ color: '#60a5fa', fontWeight: 600 }}>CONTROL RISK (Pcc)</span>
                    <ChevronRight size={13} color="#64748b" />
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>EXPOSURE RISK (NAE)</span>
                    <ChevronRight size={13} color="#64748b" />
                    <span style={{ color: '#f87171', fontWeight: 600 }}>CONTAGION CASCADE</span>
                  </div>
                </div>

                {/* Ranked Clusters Portfolio Table & Quick Graph Preview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '20px' }}>
                  {/* Left: Active Coordinated Clusters Table */}
                  <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ fontSize: '16px', color: '#f8fafc' }}>Active Economic Clusters</h3>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Ranked by Common-Control Probability & Exposure</span>
                      </div>
                      <span className="badge badge-blue">{clustersData.length} Extracted</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                      {clustersData.map((cl, idx) => {
                        const isHigh = cl.score.pcc >= 0.70;
                        const isLegit = cl.score.pcc <= 0.35;
                        return (
                          <div
                            key={cl.cluster_id}
                            style={{
                              padding: '12px 16px',
                              background: selectedCluster?.cluster_id === cl.cluster_id ? 'rgba(51, 149, 255, 0.15)' : 'rgba(9, 13, 22, 0.7)',
                              border: `1px solid ${selectedCluster?.cluster_id === cl.cluster_id ? 'rgba(51, 149, 255, 0.4)' : 'var(--border-subtle)'}`,
                              borderRadius: '10px',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => setSelectedCluster(cl)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>{cl.cluster_id}</span>
                                  <span className={`badge ${isHigh ? 'badge-critical' : isLegit ? 'badge-low' : 'badge-medium'}`}>
                                    {cl.score.pcc_percentage} Pcc
                                  </span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                                  {cl.accounts_count} Accounts • {cl.beneficiaries_count} Beneficiaries • {cl.strong_edge_count} Strong Edges
                                </div>
                              </div>

                              <div style={{ textAlign: 'right' }}>
                                <div className="metric-num" style={{ fontSize: '14px', color: isHigh ? '#f87171' : '#f8fafc' }}>
                                  {cl.exposure.gross_exposure_formatted}
                                </div>
                                <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                  NAE: {cl.exposure.network_adjusted_exposure_formatted}
                                </div>
                              </div>
                            </div>

                            {/* Top SHAP Evidence Snippet */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', fontSize: '11px' }}>
                              <span style={{ color: '#38bdf8' }}>
                                💡 {cl.score.top_positive_evidence[0] || 'High topological correlation'}
                              </span>
                              <button
                                className="btn-secondary"
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                                onClick={(e) => { e.stopPropagation(); handleInspectCluster(cl); }}
                              >
                                Drilldown
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Quick Graph Visualization Preview */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <GraphVisualizer
                      clusterId={selectedCluster?.cluster_id}
                      onSelectNode={(node) => console.log("Selected node:", node)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Interactive Graph Visualizer */}
            {activeTab === 'graph' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <GraphVisualizer
                  clusterId={selectedCluster?.cluster_id}
                  onSelectNode={(node) => console.log("Selected node:", node)}
                />
              </div>
            )}

            {/* View 3: Cluster Deep-Dive & SHAP */}
            {activeTab === 'deepdive' && (
              <ClusterDeepDive
                cluster={selectedCluster || clustersData[0]}
                onSimulateCluster={handleSimulateCluster}
              />
            )}

            {/* View 4: Counterfactual Simulator */}
            {activeTab === 'counterfactual' && (
              <CounterfactualPlayground
                initialPcc={selectedCluster?.score?.pcc || 0.942}
                initialExposure={selectedCluster?.exposure?.gross_exposure || 42000000}
              />
            )}

            {/* View 5: AI Investigator Copilot */}
            {activeTab === 'copilot' && (
              <InvestigatorCopilot
                activeClusterId={selectedCluster?.cluster_id || "cluster_1001"}
                clusterData={selectedCluster}
              />
            )}

            {/* View 6: Benchmark & Ablation Lab */}
            {activeTab === 'benchmarks' && (
              <BenchmarkLab />
            )}
          </>
        )}
      </main>

      {/* 5-Minute Interactive Demo Tour Modal */}
      {showDemoModal && demoScenes.length > 0 && (
        <DemoNarrativeModal
          scenes={demoScenes}
          activeSceneIndex={activeSceneIndex}
          onSelectScene={(idx) => {
            setActiveSceneIndex(idx);
            const sc = demoScenes[idx];
            if (sc?.highlight_component === 'counterfactual_sim') setActiveTab('counterfactual');
            else if (sc?.highlight_component === 'graph_clusters') setActiveTab('graph');
            else if (sc?.highlight_component === 'evidence_decomposition') setActiveTab('deepdive');
            else if (sc?.highlight_component === 'benchmarks' || sc?.highlight_component === 'false_positive_lab') setActiveTab('benchmarks');
            else setActiveTab('overview');
          }}
          onClose={() => setShowDemoModal(false)}
        />
      )}

      {/* Executive CRO & Finance Risk Briefing Modal */}
      <ExecutiveSummaryModal
        isOpen={showExecutiveModal}
        onClose={() => setShowExecutiveModal(false)}
        metrics={metrics}
        clusters={clustersData}
      />
    </div>
  );
}

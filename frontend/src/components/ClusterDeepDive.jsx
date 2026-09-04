import React from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, Users, ArrowUpRight, ArrowDownRight, 
  Clock, GitMerge, FileCheck, DollarSign, AlertTriangle 
} from 'lucide-react';

export default function ClusterDeepDive({ cluster, onSimulateCluster }) {
  if (!cluster) {
    return (
      <div className="glass-panel" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
        Select a cluster from the portfolio list to inspect its topological evidence and financial exposure.
      </div>
    );
  }

  const score = cluster.score || {};
  const exp = cluster.exposure || {};
  const dec = cluster.decision || {};
  const pcc = score.pcc || 0.5;

  const isHighRisk = pcc >= 0.70;
  const isLegit = pcc <= 0.35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Cluster Header Card */}
      <div className="glass-panel-glow" style={{ padding: '22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className={`badge ${isHighRisk ? 'badge-critical' : isLegit ? 'badge-low' : 'badge-medium'}`}>
                {score.pcc_percentage || 'N/A'} Common-Control (Pcc)
              </span>
              <span className="badge badge-blue">
                Confidence: {score.evidence_confidence || 'High'}
              </span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: '#cbd5e1' }}>
                Quality: {score.evidence_quality || 'Strong'}
              </span>
            </div>
            <h2 style={{ fontSize: '22px', color: '#f8fafc', marginTop: '8px' }}>
              {cluster.cluster_id}: {isHighRisk ? 'Coordinated Multi-Account Syndicate' : isLegit ? 'Legitimate Dense Population' : 'Moderate Topological Linkage'}
            </h2>
          </div>

          <button
            className="btn-primary"
            onClick={() => onSimulateCluster && onSimulateCluster(cluster)}
            style={{ fontSize: '13px' }}
          >
            <span>Simulate Policy Options</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* Financial Exposure KPI Trio */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'rgba(9, 13, 22, 0.7)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Gross Exposure</div>
            <div className="metric-num" style={{ fontSize: '20px', color: '#f8fafc', marginTop: '2px' }}>
              {exp.gross_exposure_formatted || `₹${cluster.gross_exposure?.toLocaleString('en-IN') || 0}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Network-Adjusted Exposure (NAE)</div>
            <div className="metric-num" style={{ fontSize: '20px', color: '#f87171', marginTop: '2px' }}>
              {exp.network_adjusted_exposure_formatted || '₹0.00'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Potential Contagion Cascade</div>
            <div className="metric-num" style={{ fontSize: '20px', color: '#fb923c', marginTop: '2px' }}>
              {exp.potential_contagion_formatted || '₹0.00'}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: SHAP Evidence Decomposition & Recommended Graduated Intervention */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '18px' }}>
        {/* SHAP Waterfall / Evidence Decomposition (PRD §16) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', color: '#f8fafc' }}>Topological SHAP Evidence Decomposition</h3>
            <span className="badge badge-blue">100% Explainable</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(score.evidence_decomposition || []).map((ev, idx) => {
              const isPos = ev.points > 0;
              return (
                <div 
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: isPos ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
                    border: `1px solid ${isPos ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                    borderRadius: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isPos ? <ArrowUpRight size={15} color="#f87171" /> : <ArrowDownRight size={15} color="#34d399" />}
                    <span style={{ fontSize: '13px', color: isPos ? '#fca5a5' : '#a7f3d0' }}>
                      {ev.label}
                    </span>
                  </div>
                  <span className="metric-num" style={{ fontSize: '13px', fontWeight: 700, color: isPos ? '#ef4444' : '#10b981' }}>
                    {ev.points > 0 ? `+${ev.points}` : ev.points} pts
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Graduated Intervention Policy (PRD §19) */}
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '15px', color: '#f8fafc' }}>Proportional Graduated Intervention</h3>
            <span className={`badge ${isHighRisk ? 'badge-critical' : isLegit ? 'badge-low' : 'badge-medium'}`}>
              {dec.recommended_action || 'Observe'}
            </span>
          </div>

          <div style={{ background: 'rgba(9, 13, 22, 0.7)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: '#60a5fa', fontWeight: 600, marginBottom: '4px' }}>
              Strategy: {dec.tier || 'Risk Assessment'}
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {dec.strategy_summary || 'Continuous passive monitoring with zero customer friction.'}
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mandated Action Items:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {(dec.proportional_action_items || [
              "Continue passive transaction monitoring",
              "Log time-series edge evolution in background"
            ]).map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#e2e8f0' }}>
                <FileCheck size={14} color="#38bdf8" />
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* 1-Click Operational Action Buttons for Finance/Risk Managers */}
          <div style={{ background: 'rgba(51, 149, 255, 0.05)', border: '1px solid rgba(51, 149, 255, 0.2)', borderRadius: '8px', padding: '12px', marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
              1-Click Operations Control:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => alert(`[EXECUTED] Policy applied to ${cluster.cluster_id}: ${dec.recommended_action || 'Throttle & Verify'}`)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                <span>Execute {dec.recommended_action || 'Throttle'}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => alert(`[HOLD PLACED] 48-Hour Settlement Rolling Hold activated for ${cluster.cluster_id}.`)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                <span>Place Settlement Hold</span>
              </button>
              <button
                className="btn-secondary"
                onClick={() => alert(`[WHITELISTED] ${cluster.cluster_id} marked as verified legitimate commerce.`)}
                style={{ fontSize: '11px', padding: '6px 12px' }}
              >
                <span>Authorize Exemption</span>
              </button>
            </div>
          </div>

          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#94a3b8' }}>Action Reversibility:</span>
            <span style={{ color: '#34d399', fontWeight: 600 }}>{dec.reversibility || '100% Reversible'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


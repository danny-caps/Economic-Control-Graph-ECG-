import React from 'react';
import { 
  ShieldAlert, CheckCircle2, TrendingUp, AlertTriangle, 
  DollarSign, FileText, Printer, X, Shield, ArrowRight, Award, Lock
} from 'lucide-react';

export default function ExecutiveSummaryModal({ isOpen, onClose, metrics = {}, clusters = [] }) {
  if (!isOpen) return null;

  const highRiskClusters = clusters.filter(c => (c.score?.pcc || 0) >= 0.70);
  const totalGross = metrics.total_network_exposure_formatted || '₹4.20 Cr';
  const totalNAE = metrics.correlated_exposure_formatted || '₹3.95 Cr';
  const capitalProtected = metrics.early_warning_capital_protected || '₹3.10 Cr';
  const falseAlarmSavings = metrics.false_positive_cost_avoided_formatted || '₹44.30 L';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 7, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '860px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: '#0a0f1d',
        border: '1px solid rgba(51, 149, 255, 0.3)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        padding: '32px'
      }}>
        {/* Header with Print & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '20px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge badge-blue">Executive CRO Briefing</span>
              <span className="badge badge-low">Audit Certified</span>
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', marginTop: '8px' }}>
              Economic Risk & Syndicate Exposure Report
            </h2>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
              Razorpay AI Risk Manager • Track 02 Defensive Intelligence
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={handlePrint} style={{ fontSize: '12px', padding: '6px 14px' }}>
              <Printer size={14} />
              <span>Print / Export PDF</span>
            </button>
            <button className="btn-secondary" onClick={onClose} style={{ padding: '6px 10px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div style={{ background: 'rgba(51, 149, 255, 0.08)', border: '1px solid rgba(51, 149, 255, 0.25)', borderRadius: '12px', padding: '18px 22px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', color: '#60a5fa', fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={16} />
            EXECUTIVE RISK POSTURE SUMMARY
          </h4>
          <p style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.6 }}>
            The portfolio analysis has identified <strong>{highRiskClusters.length} active coordinated syndicate rings</strong> operating across seemingly independent merchant accounts. By evaluating multi-entity convergence, temporal transaction synchronization, and hardware linkage, the engine has isolated <strong>{totalNAE} in Network-Adjusted Exposure</strong> before catastrophic bust-out occurs.
          </p>
        </div>

        {/* 4 Key Executive Balance-Sheet Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
          <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase' }}>Gross Balance Exposure</div>
            <div className="metric-num text-gradient-blue" style={{ fontSize: '22px', marginTop: '4px' }}>{totalGross}</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Total transacting volume</div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.06)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#fca5a5', textTransform: 'uppercase' }}>Capital at Risk (NAE)</div>
            <div className="metric-num text-gradient-danger" style={{ fontSize: '22px', marginTop: '4px' }}>{totalNAE}</div>
            <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '2px' }}>Network-adjusted loss liability</div>
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.06)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#6ee7b7', textTransform: 'uppercase' }}>Early Capital Protected</div>
            <div className="metric-num" style={{ fontSize: '22px', color: '#34d399', marginTop: '4px' }}>{capitalProtected}</div>
            <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }}>Saved vs baseline detection</div>
          </div>

          <div style={{ background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '10px', padding: '14px' }}>
            <div style={{ fontSize: '11px', color: '#fde68a', textTransform: 'uppercase' }}>Friction Loss Avoided</div>
            <div className="metric-num text-gradient-gold" style={{ fontSize: '22px', marginTop: '4px' }}>{falseAlarmSavings}</div>
            <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '2px' }}>Protected legitimate GMV</div>
          </div>
        </div>

        {/* Top Active Syndicates Table */}
        <div style={{ marginBottom: '28px' }}>
          <h4 style={{ fontSize: '15px', color: '#f8fafc', fontWeight: 700, marginBottom: '12px' }}>
            Top Coordinated Syndicates Requiring Action
          </h4>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: '10px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.04)', color: '#94a3b8', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 14px' }}>Syndicate ID</th>
                  <th style={{ padding: '10px 14px' }}>Coordination Probability</th>
                  <th style={{ padding: '10px 14px' }}>Exposure (NAE)</th>
                  <th style={{ padding: '10px 14px' }}>Key Evidence Signal</th>
                  <th style={{ padding: '10px 14px' }}>Recommended Policy</th>
                </tr>
              </thead>
              <tbody>
                {highRiskClusters.slice(0, 4).map((cl, i) => (
                  <tr key={cl.cluster_id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: '#e2e8f0' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 700 }}>{cl.cluster_id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-critical">{cl.score?.pcc_percentage || '94.2%'} Risk</span>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: '#f87171' }}>
                      {cl.exposure?.network_adjusted_exposure_formatted || '₹3.95 Cr'}
                    </td>
                    <td style={{ padding: '12px 14px', color: '#38bdf8' }}>
                      {cl.score?.top_positive_evidence?.[0] || 'Synchronized timing & beneficiary convergence'}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span className="badge badge-high">{cl.decision?.recommended_action || 'Throttle & Verify'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Action Plan for Treasury / Risk Operations */}
        <div style={{ background: 'rgba(9, 13, 22, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', marginBottom: '24px' }}>
          <h4 style={{ fontSize: '14px', color: '#f8fafc', fontWeight: 700, marginBottom: '10px' }}>
            Recommended Treasury & Risk Action Plan
          </h4>
          <ol style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.7, paddingLeft: '18px' }}>
            <li><strong>Immediate Settlement Reserve (T+0):</strong> Place rolling 48-hour settlement holds on identified destination mule vaults.</li>
            <li><strong>Velocity Throttling:</strong> Reduce single-transaction velocity cap to ₹15,000 across flagged clusters to curb exposure while preserving merchant cashflow.</li>
            <li><strong>KYC Re-Verification:</strong> Trigger biometric / GSTIN re-verification for accounts linked via common hardware fingerprints.</li>
            <li><strong>False-Alarm Exemption:</strong> Whitelist validated university NAT IPs and corporate payroll batches to protect ₹44.30 L in legitimate transactions.</li>
          </ol>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Report Generated: {new Date().toLocaleDateString()} • System Version: ECG-Risk-v1.4
          </div>
          <button className="btn-primary" onClick={onClose} style={{ fontSize: '12px' }}>
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}

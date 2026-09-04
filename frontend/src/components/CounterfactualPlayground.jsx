import React, { useState, useEffect } from 'react';
import { Sliders, Shield, AlertOctagon, CheckCircle2, TrendingUp, DollarSign, Scale } from 'lucide-react';

export default function CounterfactualPlayground({ initialPcc = 0.942, initialExposure = 42000000 }) {
  const [pcc, setPcc] = useState(initialPcc);
  const [grossExposure, setGrossExposure] = useState(initialExposure);
  const [frictionWeight, setFrictionWeight] = useState(1.0);
  const [simResults, setSimResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSimulation = () => {
    setLoading(true);
    fetch('/api/counterfactual', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pcc: Number(pcc),
        gross_exposure: Number(grossExposure),
        friction_weight: Number(frictionWeight)
      })
    })
      .then(res => res.json())
      .then(data => {
        setSimResults(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Counterfactual sim error", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchSimulation();
  }, [pcc, grossExposure, frictionWeight]);

  const sc = simResults?.scenarios;

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scale size={18} color="#3395FF" />
            <h3 style={{ fontSize: '18px', color: '#f8fafc' }}>Counterfactual Intervention Simulator</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Risk management is an <strong style={{ color: '#60a5fa' }}>optimization problem</strong>, not a classification problem. Compare capital protection vs. customer friction.
          </p>
        </div>
        <span className="badge badge-medium">Showcase Feature (PRD §24)</span>
      </div>

      {/* Interactive Sliders Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', background: 'rgba(9, 13, 22, 0.7)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid var(--border-subtle)' }}>
        {/* Pcc Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Common-Control (Pcc):</span>
            <span className="metric-num" style={{ color: '#60a5fa' }}>{(pcc * 100).toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.99"
            step="0.01"
            value={pcc}
            onChange={(e) => setPcc(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#3395FF', cursor: 'pointer' }}
          />
        </div>

        {/* Gross Exposure Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Gross Exposure at Risk:</span>
            <span className="metric-num" style={{ color: '#f87171' }}>₹{(grossExposure / 10000000).toFixed(2)} Cr</span>
          </div>
          <input
            type="range"
            min="1000000"
            max="100000000"
            step="1000000"
            value={grossExposure}
            onChange={(e) => setGrossExposure(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#ef4444', cursor: 'pointer' }}
          />
        </div>

        {/* Friction Weight Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
            <span style={{ color: '#94a3b8' }}>Customer Friction Sensitivity:</span>
            <span className="metric-num" style={{ color: '#fbbf24' }}>{frictionWeight.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.0"
            step="0.1"
            value={frictionWeight}
            onChange={(e) => setFrictionWeight(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* 3 Side-by-Side Scenarios */}
      {sc && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* 1. Do Nothing */}
          <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #64748b' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', color: '#e2e8f0' }}>{sc.do_nothing.scenario_name}</h4>
              <span className="badge" style={{ background: 'rgba(100, 116, 139, 0.2)', color: '#94a3b8' }}>Passive</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Potential Exposure:</span>
                <span className="metric-num">{sc.do_nothing.potential_exposure_formatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Expected Fraud Loss:</span>
                <span className="metric-num" style={{ color: '#ef4444' }}>{sc.do_nothing.expected_loss_formatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Customer Friction:</span>
                <span style={{ color: '#34d399' }}>{sc.do_nothing.customer_friction}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span style={{ color: '#94a3b8' }}>Net Balance Impact:</span>
                <span className="metric-num" style={{ color: '#ef4444' }}>{sc.do_nothing.net_economic_value_formatted}</span>
              </div>
            </div>
          </div>

          {/* 2. Throttle (Recommended) */}
          <div className="glass-panel-glow" style={{ padding: '18px', borderLeft: '4px solid #3395FF', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10px', right: '14px' }}>
              <span className="badge badge-low" style={{ boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)' }}>
                ★ Recommended Policy
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', color: '#60a5fa' }}>{sc.throttle.scenario_name}</h4>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Capped Exposure:</span>
                <span className="metric-num">{sc.throttle.potential_exposure_formatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Expected Loss:</span>
                <span className="metric-num" style={{ color: '#fb923c' }}>{sc.throttle.expected_loss_formatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Friction Overhead:</span>
                <span style={{ color: '#fbbf24' }}>{sc.throttle.friction_cost_formatted}</span>
              </div>
              <div style={{ borderTop: '1px solid rgba(51, 149, 255, 0.2)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span style={{ color: '#94a3b8' }}>Net Capital Preserved:</span>
                <span className="metric-num" style={{ color: '#34d399', fontSize: '15px' }}>+{sc.throttle.net_economic_gain_formatted}</span>
              </div>
            </div>
          </div>

          {/* 3. Hard Block */}
          <div className="glass-panel" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ fontSize: '15px', color: '#e2e8f0' }}>{sc.block.scenario_name}</h4>
              <span className="badge badge-critical">Blunt Control</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Residual Exposure:</span>
                <span className="metric-num">{sc.block.potential_exposure_formatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Expected Loss:</span>
                <span className="metric-num" style={{ color: '#34d399' }}>{sc.block.expected_loss_formatted}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Merchant Churn Cost:</span>
                <span className="metric-num" style={{ color: '#ef4444' }}>{sc.block.friction_cost_formatted}</span>
              </div>
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                <span style={{ color: '#94a3b8' }}>Net Economic Value:</span>
                <span className="metric-num" style={{ color: '#38bdf8' }}>+{sc.block.net_economic_gain_formatted}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

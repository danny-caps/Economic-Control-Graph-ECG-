import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, ArrowRight, ArrowLeft, Play, Sparkles, 
  ShieldCheck, AlertTriangle, TrendingDown, DollarSign, Activity, FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function DemoNarrativeModal({ scenes, onClose, onSelectScene, activeSceneIndex }) {
  const [currentIdx, setCurrentIdx] = useState(activeSceneIndex || 0);

  const scene = scenes[currentIdx] || scenes[0];

  const handleNext = () => {
    if (currentIdx < scenes.length - 1) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      if (onSelectScene) onSelectScene(next);
      if (next === scenes.length - 1) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      const prev = currentIdx - 1;
      setCurrentIdx(prev);
      if (onSelectScene) onSelectScene(prev);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(3, 6, 13, 0.85)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div className="glass-panel-glow" style={{ width: '100%', maxWidth: '780px', padding: '28px', position: 'relative' }}>
        {/* Header with progress stepper */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-blue">Razorpay Buildathon Showcase</span>
            <span style={{ fontSize: '13px', color: '#94a3b8' }}>5-Minute Demo Narrative Tour</span>
          </div>
          <button 
            onClick={onClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Step Indicator Dots */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
          {scenes.map((s, idx) => (
            <div
              key={idx}
              onClick={() => { setCurrentIdx(idx); if (onSelectScene) onSelectScene(idx); }}
              style={{
                flex: 1,
                height: '4px',
                borderRadius: '2px',
                background: idx === currentIdx ? '#3395FF' : idx < currentIdx ? '#10b981' : 'rgba(255,255,255,0.1)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>

        {/* Scene Content */}
        <div style={{ minHeight: '260px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-medium">Scene {scene.scene_number} of {scenes.length}</span>
            <h2 style={{ fontSize: '20px', color: '#f8fafc' }}>{scene.title}</h2>
          </div>
          <h3 style={{ fontSize: '14px', color: '#60a5fa', fontWeight: 500, marginBottom: '16px' }}>
            {scene.subtitle}
          </h3>

          <p style={{ fontSize: '14px', color: '#cbd5e1', lineHeight: '1.7', marginBottom: '20px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '10px', borderLeft: '3px solid #3395FF' }}>
            {scene.narrative}
          </p>

          {/* Key Metric Highlights for this Scene */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            {Object.entries(scene.metrics || {}).map(([key, val]) => (
              <div key={key} style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 14px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {key.replace(/_/g, ' ')}
                </div>
                <div className="metric-num" style={{ fontSize: '16px', color: '#38bdf8', marginTop: '4px' }}>
                  {val}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '18px' }}>
          <button
            className="btn-secondary"
            onClick={handlePrev}
            disabled={currentIdx === 0}
            style={{ opacity: currentIdx === 0 ? 0.4 : 1, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}
          >
            <ArrowLeft size={14} />
            <span>Previous Scene</span>
          </button>

          <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'JetBrains Mono' }}>
            Scene {currentIdx + 1} / {scenes.length}
          </div>

          {currentIdx < scenes.length - 1 ? (
            <button className="btn-primary" onClick={handleNext}>
              <span>Next Scene</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }} onClick={onClose}>
              <Sparkles size={14} />
              <span>Finish Demo & Explore Engine</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BarChart3, FileUp, HelpCircle, Play } from 'lucide-react';
import GraphVisualizer from './GraphVisualizer';
import { apiUrl } from '../api';

const EMPTY_GRAPH = { nodes: [], edges: [] };
const EXPLANATION_ITEMS = [
  {
    title: 'Upload and Analyze Batch',
    description: 'Choose a Nodes CSV with unique txId values and numeric feat_2 through feat_166 columns, plus a matching Edges CSV with txId1 and txId2. Every edge endpoint must exist in the Nodes file. Analyze Batch validates both files, computes graph structure, creates GraphSAGE embeddings for this uploaded graph, then sends the combined features to XGBoost for a risk probability per transaction.'
  },
  {
    title: 'Global Model Performance',
    description: 'These Precision, Recall, F1 and ROC AUC values come from the model’s saved offline test-set metrics. They describe benchmark performance before this upload; they are not calculated from the current batch.'
  },
  {
    title: 'Batch Summary Cards',
    description: 'Transactions and Directed edges count the uploaded rows/nodes and links. Predicted illicit counts nodes whose model risk score is at least 50%; Mean risk averages the scores. Components counts disconnected groups (ignoring edge direction for connectivity), Largest gives the biggest group size, and Communities/Mean k-core describe detected groupings and how densely connected nodes are.'
  },
  {
    title: 'Batch Evaluation',
    description: 'If the Nodes CSV contains class labels, the app compares predictions with known labels: 1 means illicit, 2 means licit, and 3/unknown are excluded. Precision, Recall and F1 use the 50% prediction threshold. ROC AUC is available only when both known classes are present. Without usable labels, evaluation is shown as unavailable rather than guessed.'
  },
  {
    title: 'Supported Analysis',
    description: 'Transaction illicit-risk scoring is available. Common-control Pcc is not provided because this saved model predicts Elliptic illicit/licit labels, not shared ownership. Financial exposure is not calculated because this input has no validated currency amount field. Uploaded-graph embeddings are recomputed; saved embeddings are not reused because their original graph context cannot be confirmed.'
  },
  {
    title: 'Temporal and Multi-hop Structure',
    description: 'Two-hop directed walks count paths that enter and leave the same intermediate transaction. Transactions per timestep and Maximum timestep share are computed only when the Nodes CSV includes a timestep column; they summarize volume and concentration, not risk.'
  },
  {
    title: 'Uploaded Batch Graph',
    description: 'Each transaction is a node and each CSV edge is a directed link from txId1 to txId2. Red nodes are predicted illicit and blue nodes predicted licit; hover or click a node for its risk score, optional ground truth and topology details. Type filters, Fit to Screen and Physics On/Locked help explore the graph. For uploaded batches, the timeline controls progressively reveal nodes in CSV row order; they are not a historical replay, even if the optional timestep column is present.'
  },
  {
    title: 'Batch Comparison',
    description: 'After two batches are analyzed in this page session, the table compares the two most recent uploads. It shows changes in prediction counts, risk and graph structure. F1 is compared only when both uploads have known labels; a change is a difference between the displayed batch values, not a causal explanation.'
  }
];

function MetricCard({ label, value, note }) {
  return (
    <div className="glass-panel" style={{ padding: '16px' }}>
      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>{label}</div>
      <div className="metric-num" style={{ color: '#f8fafc', fontSize: '22px', marginTop: '6px' }}>{value}</div>
      {note && <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{note}</div>}
    </div>
  );
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${(value * 100).toFixed(1)}%` : 'Unavailable';
}

export default function BatchAnalysis() {
  const [nodesFile, setNodesFile] = useState(null);
  const [edgesFile, setEdgesFile] = useState(null);
  const [batchName, setBatchName] = useState('Uploaded batch');
  const [result, setResult] = useState(null);
  const [recentBatches, setRecentBatches] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [artifactStatus, setArtifactStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metricsError, setMetricsError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(apiUrl('/api/metrics')).then(async response => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.detail || 'Saved metrics are unavailable.');
        return body;
      }),
      fetch(apiUrl('/api/health')).then(response => response.json())
    ])
      .then(([metricsResponse, health]) => {
        if (cancelled) return;
        setMetrics(metricsResponse);
        setArtifactStatus(health.elliptic_artifacts || null);
      })
      .catch(fetchError => {
        if (!cancelled) setMetricsError(fetchError.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const comparison = useMemo(() => {
    if (recentBatches.length < 2) return null;
    const [latest, previous] = recentBatches;
    return { latest, previous };
  }, [recentBatches]);

  const handleAnalyze = async event => {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!nodesFile || !edgesFile) {
      setError('Choose both a Nodes CSV and its matching Edges CSV.');
      return;
    }

    const formData = new FormData();
    formData.append('nodes_file', nodesFile);
    formData.append('edges_file', edgesFile);
    formData.append('batch_name', batchName.trim() || 'Uploaded batch');
    setLoading(true);
    try {
      const response = await fetch(apiUrl('/api/analyze-batch'), {
        method: 'POST',
        body: formData
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.detail || 'Batch analysis failed.');
      setResult(body);
      setRecentBatches(previous => [
        body,
        ...previous.filter(batch => batch.batch_id !== body.batch_id)
      ].slice(0, 2));
    } catch (requestError) {
      setError(requestError.message || 'Batch analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const activeSummary = result?.summary;
  const activeEvaluation = result?.evaluation;
  const savedMetrics = metrics?.metrics;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <section className="glass-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ color: '#f8fafc', fontSize: '19px' }}>Analyze a transaction batch</h2>
            <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '5px' }}>
              Upload a matching Nodes + Edges CSV pair. The backend computes batch-specific topology,
              GraphSAGE embeddings and transaction-risk scores.
            </p>
          </div>
          <span className={`badge ${artifactStatus?.loaded ? 'badge-low' : 'badge-medium'}`}>
            {artifactStatus?.loaded ? 'Trained artifacts loaded' : 'Model artifacts unavailable'}
          </span>
        </div>

        {artifactStatus && !artifactStatus.loaded && (
          <div role="status" style={{ color: '#fbbf24', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '10px 12px', marginTop: '14px', fontSize: '12px' }}>
            {artifactStatus.error || `Place graphsage.pt, pcc_xgb_model.json, elliptic_embeddings.csv and metrics.json in ${artifactStatus.directory}.`}
          </div>
        )}

        <form onSubmit={handleAnalyze} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px', marginTop: '18px', alignItems: 'end' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '12px' }}>
            Batch name
            <input
              value={batchName}
              onChange={event => setBatchName(event.target.value)}
              aria-label="Batch name"
              style={inputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '12px' }}>
            Nodes CSV
            <input
              type="file"
              accept=".csv,text/csv"
              required
              onChange={event => setNodesFile(event.target.files?.[0] || null)}
              aria-label="Nodes CSV"
              style={fileInputStyle}
            />
          </label>
          <label style={{ display: 'grid', gap: '6px', color: '#cbd5e1', fontSize: '12px' }}>
            Matching Edges CSV
            <input
              type="file"
              accept=".csv,text/csv"
              required
              onChange={event => setEdgesFile(event.target.files?.[0] || null)}
              aria-label="Edges CSV"
              style={fileInputStyle}
            />
          </label>
          <button className="btn-primary" type="submit" disabled={loading || !artifactStatus?.loaded} style={{ justifyContent: 'center', minHeight: '39px' }}>
            {loading ? <Activity size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? 'Analyzing…' : 'Analyze Batch'}
          </button>
        </form>

        {(nodesFile || edgesFile) && (
          <div style={{ color: '#64748b', fontSize: '11px', marginTop: '9px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileUp size={13} />
            {nodesFile?.name || 'No nodes file'} · {edgesFile?.name || 'No edges file'}
          </div>
        )}
        {error && (
          <div role="alert" style={{ color: '#fca5a5', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '8px', padding: '10px 12px', marginTop: '14px', fontSize: '12px', display: 'flex', gap: '8px' }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}
      </section>

      <details open className="glass-panel" style={{ padding: '16px 18px' }}>
        <summary style={{ color: '#f8fafc', fontSize: '14px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={16} color="#60a5fa" />
          How each Batch Testing component works
        </summary>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px', marginTop: '14px' }}>
          {EXPLANATION_ITEMS.map(item => (
            <div key={item.title} style={{ border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', background: 'rgba(255,255,255,0.025)' }}>
              <h4 style={{ color: '#bfdbfe', fontSize: '12px', marginBottom: '6px' }}>{item.title}</h4>
              <p style={{ color: '#94a3b8', fontSize: '11px', lineHeight: 1.55 }}>{item.description}</p>
            </div>
          ))}
        </div>
      </details>

      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
          <BarChart3 size={16} color="#60a5fa" />
          <h3 style={{ fontSize: '14px', color: '#f8fafc' }}>Global Model Performance</h3>
          <span className="badge badge-blue">Saved test-set results</span>
        </div>
        {metricsError ? (
          <p role="status" style={{ color: '#fbbf24', fontSize: '12px' }}>{metricsError}</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
            <MetricCard label="Precision" value={formatPercent(savedMetrics?.test_precision)} />
            <MetricCard label="Recall" value={formatPercent(savedMetrics?.test_recall)} />
            <MetricCard label="F1" value={formatPercent(savedMetrics?.test_f1)} />
            <MetricCard label="ROC AUC" value={formatPercent(savedMetrics?.test_roc_auc)} />
          </div>
        )}
      </section>

      {result && (
        <>
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))', gap: '10px' }}>
            <MetricCard label="Transactions" value={activeSummary.node_count} note={result.batch_name} />
            <MetricCard label="Directed edges" value={activeSummary.edge_count} />
            <MetricCard label="Predicted illicit" value={activeSummary.predicted_illicit_count} note={formatPercent(activeSummary.predicted_illicit_count / activeSummary.node_count)} />
            <MetricCard label="Mean risk" value={formatPercent(activeSummary.mean_risk_score)} />
            <MetricCard label="Components" value={activeSummary.connected_component_count} note={`Largest: ${activeSummary.largest_component_size}`} />
            <MetricCard label="Communities" value={activeSummary.community_count} note={`Mean k-core: ${activeSummary.mean_core_number.toFixed(2)}`} />
          </section>

          <section className="glass-panel" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '15px' }}>Batch evaluation</h3>
                <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
                  Positive class: illicit (class 1). Unknown labels are excluded.
                </p>
              </div>
              <span className={`badge ${activeEvaluation.status === 'available' ? 'badge-low' : 'badge-medium'}`}>
                {activeEvaluation.status === 'available' ? `${activeEvaluation.known_label_count} known labels` : 'Ground truth unavailable'}
              </span>
            </div>
            {activeEvaluation.status === 'available' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <MetricCard label="Precision" value={formatPercent(activeEvaluation.precision)} />
                <MetricCard label="Recall" value={formatPercent(activeEvaluation.recall)} />
                <MetricCard label="F1" value={formatPercent(activeEvaluation.f1)} />
                <MetricCard label="ROC AUC" value={formatPercent(activeEvaluation.roc_auc)} note={activeEvaluation.roc_auc_reason} />
                <MetricCard label="Unknown excluded" value={activeEvaluation.unknown_label_count} />
              </div>
            ) : (
              <p style={{ color: '#fbbf24', fontSize: '12px' }}>{activeEvaluation.reason}</p>
            )}
          </section>

          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px' }}>Supported analysis</h3>
              <p style={capabilityStyle}>Transaction-risk model: <strong style={{ color: '#34d399' }}>Available</strong></p>
              <p style={capabilityStyle}>Common-control Pcc: <strong style={{ color: '#fbbf24' }}>Not configured</strong> — this XGBoost model predicts Elliptic licit/illicit labels.</p>
              <p style={capabilityStyle}>Financial exposure: <strong style={{ color: '#fbbf24' }}>Not configured</strong> — no validated currency amount is supplied.</p>
              <p style={{ ...capabilityStyle, marginBottom: 0 }}>{result.capabilities.embedding_source}</p>
            </div>
            <div className="glass-panel" style={{ padding: '16px' }}>
              <h3 style={{ fontSize: '14px' }}>Temporal and multi-hop structure</h3>
              <p style={capabilityStyle}>Two-hop directed walks: <strong style={{ color: '#e2e8f0' }}>{activeSummary.two_hop_walk_count.toLocaleString()}</strong></p>
              <p style={capabilityStyle}>Transactions per timestep: <strong style={{ color: '#e2e8f0' }}>{activeSummary.transactions_by_timestep ? Object.keys(activeSummary.transactions_by_timestep).length : 'Unavailable'}</strong></p>
              <p style={{ ...capabilityStyle, marginBottom: 0 }}>Maximum timestep share: <strong style={{ color: '#e2e8f0' }}>{formatPercent(activeSummary.max_timestep_share)}</strong></p>
            </div>
          </section>

          <GraphVisualizer
            providedGraph={result}
            title={`Uploaded batch graph: ${result.batch_name}`}
          />
        </>
      )}

      {comparison && (
        <section className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{ fontSize: '15px' }}>Batch comparison</h3>
            <p style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>
              Compares the two most recently analyzed uploads. Prediction shifts and graph-structure shifts are shown separately.
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
              <thead>
                <tr style={{ color: '#94a3b8' }}>
                  <th style={cellStyle}>Measure</th>
                  <th style={cellStyle}>{comparison.previous.batch_name}</th>
                  <th style={cellStyle}>{comparison.latest.batch_name}</th>
                  <th style={cellStyle}>Change</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Predictions', 'predicted_illicit_count', 'predicted illicit'],
                  ['Graph structure · nodes', 'node_count', 'nodes'],
                  ['Graph structure · edges', 'edge_count', 'edges'],
                  ['Graph structure · components', 'connected_component_count', 'components'],
                  ['Graph structure · communities', 'community_count', 'communities'],
                  ['Graph structure · largest component', 'largest_component_size', 'nodes'],
                ].map(([label, field, suffix]) => {
                  const before = comparison.previous.summary[field];
                  const after = comparison.latest.summary[field];
                  const delta = after - before;
                  return (
                    <tr key={field} style={{ borderTop: '1px solid var(--border-subtle)' }}>
                      <td style={cellStyle}>{label}</td>
                      <td style={cellStyle}>{before}</td>
                      <td style={cellStyle}>{after}</td>
                      <td style={cellStyle}>{delta > 0 ? '+' : ''}{delta} {suffix}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <td style={cellStyle}>Predictions · mean risk score</td>
                  <td style={cellStyle}>{formatPercent(comparison.previous.summary.mean_risk_score)}</td>
                  <td style={cellStyle}>{formatPercent(comparison.latest.summary.mean_risk_score)}</td>
                  <td style={cellStyle}>{formatPercent(comparison.latest.summary.mean_risk_score - comparison.previous.summary.mean_risk_score)} points</td>
                </tr>
                {comparison.previous.evaluation.status === 'available' && comparison.latest.evaluation.status === 'available' && (
                  <tr style={{ borderTop: '1px solid var(--border-subtle)' }}>
                    <td style={cellStyle}>Evaluation · F1</td>
                    <td style={cellStyle}>{formatPercent(comparison.previous.evaluation.f1)}</td>
                    <td style={cellStyle}>{formatPercent(comparison.latest.evaluation.f1)}</td>
                    <td style={cellStyle}>{formatPercent(comparison.latest.evaluation.f1 - comparison.previous.evaluation.f1)} points</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {(comparison.previous.evaluation.status !== 'available' || comparison.latest.evaluation.status !== 'available') && (
            <p style={{ color: '#fbbf24', fontSize: '11px', marginTop: '10px' }}>
              Evaluation metrics are omitted because both batches need known ground-truth labels.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  color: '#f8fafc',
  border: '1px solid var(--border-subtle)',
  borderRadius: '7px',
  padding: '9px 10px',
  fontSize: '12px'
};

const fileInputStyle = { ...inputStyle, padding: '6px' };
const capabilityStyle = { color: '#94a3b8', fontSize: '11px', lineHeight: 1.5, marginTop: '8px' };
const cellStyle = { padding: '9px 8px', color: '#cbd5e1', whiteSpace: 'nowrap' };

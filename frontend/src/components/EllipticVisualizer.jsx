import React, { useRef, useMemo, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';

export default function EllipticVisualizer({ nodes, edges }) {
    const graphRef = useRef();

    // Memoize graph data to prevent unnecessary re-renders of the physics engine
    const graphData = useMemo(() => {
        return {
            nodes: nodes.map(n => ({
                id: n.id,
                // Scale node base size by its k-core structural importance
                val: n.core_number > 0 ? n.core_number * 1.5 : 2, 
                isHighRisk: n.predicted_class === 1,
                risk_score: n.risk_score
            })),
            links: edges.map(e => ({
                source: e.source,
                target: e.target
            }))
        };
    }, [nodes, edges]);

    // Custom Canvas Rendering for Nodes
    const drawNode = (node, ctx, globalScale) => {
        const size = Math.max(node.val, 4); // Establish a minimum visible size
        const isHighRisk = node.isHighRisk;

        // Apply neon glow effect
        ctx.shadowBlur = 12 * globalScale;
        ctx.shadowColor = isHighRisk ? '#ef4444' : '#3b82f6';

        ctx.beginPath();
        
        if (isHighRisk) {
            // Draw Hexagon for High Risk (Illcit)
            const angles = 6;
            for (let i = 0; i < angles; i++) {
                const angle = (i * 2 * Math.PI) / angles - Math.PI / 2;
                const x = node.x + size * Math.cos(angle);
                const y = node.y + size * Math.sin(angle);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.closePath();
            ctx.fillStyle = '#450a0a'; // Desaturated dark red fill
            ctx.strokeStyle = '#ef4444'; // Bright neon red border
        } else {
            // Draw Circle for Low Risk (Licit)
            ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
            ctx.fillStyle = '#1e3a8a'; // Desaturated dark blue fill
            ctx.strokeStyle = '#3b82f6'; // Bright neon blue border
        }

        ctx.fill();
        ctx.lineWidth = 1.5 / globalScale; // Keep borders razor-thin regardless of zoom
        ctx.stroke();

        // Clear shadow to prevent the glow from bleeding into text and links
        ctx.shadowBlur = 0;

        // Draw transaction ID labels only when zoomed in (prevents clutter)
        if (globalScale > 3) {
            const label = `TX: ${String(node.id).substring(0, 6)}...`;
            const fontSize = 10 / globalScale;
            ctx.font = `${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, node.x, node.y + size + (4 / globalScale));
        }
    };

    // Apply damping to stabilize the graph quickly on mount
    useEffect(() => {
        if (graphRef.current) {
            graphRef.current.d3Force('charge').strength(-120);
            graphRef.current.d3Force('link').distance(40);
        }
    }, []);

    return (
        <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeCanvasObject={drawNode}
            // Critically damped spring animation primitives
            d3VelocityDecay={0.15} 
            // Neon cyan links with directional opacity
            linkColor={() => 'rgba(56, 189, 248, 0.3)'} 
            linkWidth={1.2}
            linkDirectionalArrowLength={4}
            linkDirectionalArrowRelPos={1}
            linkDirectionalArrowColor={() => 'rgba(56, 189, 248, 0.8)'}
            // Ergonomic off-black canvas
            backgroundColor="#0a0a0c" 
        />
    );
}

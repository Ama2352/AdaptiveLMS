import { useMemo, useState } from "react";

export default function KnowledgeGraph({ data }) {
  const [hoveredNode, setHoveredNode] = useState(null);

  // 1. Process Data & Layout
  const { nodes, edges, width, height, columns } = useMemo(() => {
    if (!data || !data.progress_details)
      return { nodes: [], edges: [], width: 800, height: 600, columns: [] };

    const items = data.progress_details;

    // Group by Chapter for Columns
    const chapters = {};
    items.forEach((item) => {
      const ch = item.chapter_name || "Unknown";
      if (!chapters[ch]) chapters[ch] = [];
      chapters[ch].push(item);
    });

    const chapterNames = Object.keys(chapters);

    // Config
    const colWidth = 350; // Much wider for text
    const rowHeight = 120; // More vertical spacing
    const paddingX = 150;
    const paddingY = 100;

    let maxRows = 0;
    const calculatedNodes = [];
    const idToPos = {};

    chapterNames.forEach((ch, colIdx) => {
      const concepts = chapters[ch];
      maxRows = Math.max(maxRows, concepts.length);

      concepts.forEach((concept, rowIdx) => {
        const x = paddingX + colIdx * colWidth;
        // Zigzag offset to prevent horizontal overlap of text
        const offsetX = rowIdx % 2 === 0 ? 0 : 50;
        const y = paddingY + rowIdx * rowHeight;

        const node = {
          ...concept,
          x: x + offsetX,
          y,
          col: colIdx,
        };
        calculatedNodes.push(node);
        idToPos[concept.concept_id] = { x: x + offsetX, y };
      });
    });

    // Edges
    const calculatedEdges = [];
    items.forEach((item) => {
      const prereqs = item.prerequisites || [];
      prereqs.forEach((pid) => {
        const source = idToPos[pid];
        const target = idToPos[item.concept_id];
        if (source && target) {
          calculatedEdges.push({
            source,
            target,
            sourceId: pid,
            targetId: item.concept_id,
          });
        }
      });
    });

    return {
      nodes: calculatedNodes,
      edges: calculatedEdges,
      width: Math.max(1200, paddingX * 2 + chapterNames.length * colWidth),
      height: Math.max(800, paddingY * 2 + maxRows * rowHeight),
      columns: chapterNames.map((name, i) => ({
        name,
        x: paddingX + i * colWidth,
      })),
    };
  }, [data]);

  if (!nodes.length)
    return (
      <div style={{ color: "#94a3b8", padding: "2rem" }}>
        No graph data available.
      </div>
    );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        background: "#020617", // Deeper Blue/Black
        position: "relative",
        backgroundImage: "radial-gradient(#1e293b 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <svg width={width} height={height}>
        <defs>
          <marker
            id="arrow"
            markerWidth="10"
            markerHeight="7"
            refX="22"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
          {/* Glow Filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Chapter Headers - Vertical Lines */}
        {columns.map((col, i) => (
          <g key={i}>
            {/* Divider Line */}
            <line
              x1={col.x - 20}
              y1={50}
              x2={col.x - 20}
              y2={height - 50}
              stroke="#1e293b"
              strokeDasharray="4,4"
            />

            {/* Header Box */}
            <rect
              x={col.x - 120}
              y={20}
              width={240}
              height={30}
              rx="15"
              fill="#1e293b"
              opacity="0.8"
            />
            <text
              x={col.x}
              y={40}
              fill="#e2e8f0"
              fontSize="13"
              fontWeight="bold"
              textAnchor="middle"
              style={{
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontFamily: "sans-serif",
              }}
            >
              {col.name.replace(/^\d+\.\s*/, "").substring(0, 30)}
            </text>
          </g>
        ))}

        {/* Edges */}
        {edges.map((edge, i) => {
          const dx = edge.target.x - edge.source.x;
          // Smooth Bezier
          const offset = Math.min(Math.abs(dx) * 0.5, 120);

          const d = `M ${edge.source.x} ${edge.source.y} 
                     C ${edge.source.x + offset} ${edge.source.y}, 
                       ${edge.target.x - offset} ${edge.target.y}, 
                       ${edge.target.x} ${edge.target.y}`;

          return (
            <path
              key={i}
              d={d}
              stroke="#475569"
              strokeWidth="1.5"
              fill="none"
              markerEnd="url(#arrow)"
              opacity="0.4"
              style={{ transition: "opacity 0.3s" }}
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const isMastered = node.is_mastered;
          const isHovered = hoveredNode === node;

          // Constellation Style Colors
          // Mastered = Bright Green/Teal
          // In Progress/Unmastered = Bright Blue/White (Star-like)

          const strokeColor = isMastered ? "#10b981" : "#60a5fa"; // Green vs Blue
          const fillColor = isMastered ? "#064e3b" : "#1e293b"; // Dark Green vs Dark Slate

          return (
            <g
              key={node.concept_id}
              transform={`translate(${node.x}, ${node.y})`}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
            >
              {/* Outer Glow on Hover */}
              {isHovered && (
                <circle
                  r="35"
                  fill={strokeColor}
                  opacity="0.2"
                  filter="url(#glow)"
                />
              )}

              {/* Node Body */}
              <circle
                r="16"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isMastered ? 3 : 2}
              />

              {/* Internal Symbol (Check or Dot) */}
              {isMastered ? (
                <text
                  dy=".35em"
                  textAnchor="middle"
                  fill="#a7f3d0"
                  fontSize="12"
                  fontWeight="bold"
                >
                  ✓
                </text>
              ) : (
                <circle r="4" fill={strokeColor} />
              )}

              {/* ELO Label (Floating Top Right) */}
              <g transform="translate(18, -18)">
                <rect
                  x="-5"
                  y="-12"
                  width="35"
                  height="18"
                  rx="4"
                  fill="#0f172a"
                  stroke={strokeColor}
                  strokeWidth="1"
                />
                <text
                  x="12"
                  y="0"
                  textAnchor="middle"
                  fill={strokeColor}
                  fontSize="10"
                  fontWeight="bold"
                >
                  {node.current_elo}
                </text>
              </g>

              {/* Text Label - Below Node */}
              {/* Use foreignObject for multi-line text wrapping if feasible, 
                  but user had issues. Let's use clean standard SVG text with truncation. */}
              <text
                y={35}
                textAnchor="middle"
                fill={isMastered ? "#a7f3d0" : "#cbd5e1"}
                fontSize="12"
                fontWeight={isHovered ? "bold" : "normal"}
                style={{ fontFamily: "sans-serif", pointerEvents: "none" }}
              >
                {(node.concept_name || node.concept_id).substring(0, 25)}
                {(node.concept_name || node.concept_id).length > 25
                  ? "..."
                  : ""}
              </text>

              {/* Hover Tooltip (Full Details) */}
              {isHovered && (
                <g
                  transform="translate(0, -55)"
                  style={{ pointerEvents: "none" }}
                >
                  <rect
                    x="-120"
                    y="-30"
                    width="240"
                    height="40"
                    rx="8"
                    fill="#0f172a"
                    stroke={strokeColor}
                    strokeWidth="2"
                    filter="url(#glow)"
                  />
                  <text
                    dy="-5"
                    textAnchor="middle"
                    fill="white"
                    fontSize="13"
                    fontWeight="bold"
                  >
                    {node.concept_name || node.concept_id}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          background: "rgba(2, 6, 23, 0.95)",
          padding: "1.5rem",
          borderRadius: "12px",
          border: "1px solid #334155",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
          backdropFilter: "blur(8px)",
        }}
      >
        <h4
          style={{
            margin: "0 0 1rem 0",
            color: "#f1f5f9",
            fontSize: "1rem",
            borderBottom: "1px solid #334155",
            paddingBottom: "0.5rem",
          }}
        >
          Map Legend
        </h4>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginBottom: "0.8rem",
            fontSize: "0.9rem",
            color: "#cbd5e1",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#064e3b",
              border: "2px solid #10b981",
              marginRight: "0.8rem",
              boxShadow: "0 0 8px #10b981",
            }}
          ></div>
          Mastered Concept (Ready)
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "0.9rem",
            color: "#cbd5e1",
          }}
        >
          <div
            style={{
              width: "12px",
              height: "12px",
              borderRadius: "50%",
              background: "#1e293b",
              border: "2px solid #60a5fa",
              marginRight: "0.8rem",
            }}
          ></div>
          In Progress / Pending
        </div>
      </div>
    </div>
  );
}

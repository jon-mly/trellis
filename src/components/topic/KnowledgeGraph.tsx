import type { JSX } from 'react';
import { ChevronRight, Circle, CheckCircle2, CircleDot } from 'lucide-react';
import type { KnowledgeGraphNode } from '../../types';
import { useI18n } from '../../i18n';
import './KnowledgeGraph.css';

interface KnowledgeGraphProps {
  nodes: KnowledgeGraphNode[];
  onConceptClick?: (conceptId: string) => void;
}

const FAMILIARITY_ICONS = {
  introduced: Circle,
  explored: CircleDot,
  understood: CheckCircle2,
};

function GraphNode({
  node,
  depth = 0,
  onConceptClick,
}: {
  node: KnowledgeGraphNode;
  depth?: number;
  onConceptClick?: (conceptId: string) => void;
}): JSX.Element {
  const t = useI18n();
  const Icon = FAMILIARITY_ICONS[node.familiarityLevel];
  const hasChildren = node.children.length > 0;

  return (
    <div className="knowledge-graph-node" style={{ '--depth': depth } as React.CSSProperties}>
      <button
        type="button"
        className={`knowledge-graph-node-content knowledge-graph-node--${node.familiarityLevel}`}
        onClick={() => onConceptClick?.(node.conceptId)}
        disabled={!onConceptClick}
      >
        <Icon size={14} strokeWidth={1.5} className="knowledge-graph-node-icon" />
        <span className="knowledge-graph-node-name">{node.conceptName}</span>
        <span className="knowledge-graph-node-level">
          {t.topicDashboard.familiarity[node.familiarityLevel]}
        </span>
        {hasChildren && (
          <ChevronRight size={12} strokeWidth={1.5} className="knowledge-graph-node-expand" />
        )}
      </button>

      {node.relatedConcepts.length > 0 && (
        <div className="knowledge-graph-related">
          {node.relatedConcepts.map((related, idx) => (
            <span key={idx} className="knowledge-graph-related-tag">
              {related}
            </span>
          ))}
        </div>
      )}

      {hasChildren && (
        <div className="knowledge-graph-children">
          {node.children.map((child) => (
            <GraphNode
              key={child.conceptId}
              node={child}
              depth={depth + 1}
              onConceptClick={onConceptClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function KnowledgeGraph({ nodes, onConceptClick }: KnowledgeGraphProps): JSX.Element {
  const t = useI18n();

  if (nodes.length === 0) {
    return (
      <div className="knowledge-graph knowledge-graph--empty">
        <p className="knowledge-graph-empty-text">{t.topicDashboard.knowledgeGraphEmpty}</p>
      </div>
    );
  }

  return (
    <div className="knowledge-graph">
      <div className="knowledge-graph-header">
        <span className="knowledge-graph-label">{t.topicDashboard.knowledgeGraph}</span>
      </div>
      <div className="knowledge-graph-tree">
        {nodes.map((node) => (
          <GraphNode key={node.conceptId} node={node} onConceptClick={onConceptClick} />
        ))}
      </div>
    </div>
  );
}

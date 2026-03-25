import React, { useState } from "react";

function Node({ node, onOpenFile, depth }) {
  const [open, setOpen] = useState(true);

  const pad = { paddingLeft: 10 + depth * 12 };

  if (node.type === "dir") {
    return (
      <div>
        <div
          style={{ ...styles.row, ...pad, fontWeight: 700 }}
          onClick={() => setOpen(!open)}
          title={node.path}
        >
          {open ? "▾" : "▸"} {node.name}
        </div>
        {open && (node.children || []).map((c) => (
          <Node key={c.path} node={c} onOpenFile={onOpenFile} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <div
      style={{ ...styles.row, ...pad }}
      onClick={() => onOpenFile(node.path)}
      title={node.path}
    >
      {node.name}
    </div>
  );
}

export default function FileTree({ tree, onOpenFile }) {
  return (
    <div>
      {(tree || []).map((n) => (
        <Node key={n.path || n.name} node={n} onOpenFile={onOpenFile} depth={0} />
      ))}
    </div>
  );
}

const styles = {
  row: {
    cursor: "pointer",
    padding: "6px 6px",
    borderRadius: 8
  }
};

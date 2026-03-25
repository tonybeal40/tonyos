import React from "react";
import Editor from "@monaco-editor/react";

function languageFromPath(path) {
  const p = (path || "").toLowerCase();
  if (p.endsWith(".py")) return "python";
  if (p.endsWith(".js") || p.endsWith(".mjs")) return "javascript";
  if (p.endsWith(".ts") || p.endsWith(".tsx")) return "typescript";
  if (p.endsWith(".json")) return "json";
  if (p.endsWith(".html")) return "html";
  if (p.endsWith(".css")) return "css";
  if (p.endsWith(".md")) return "markdown";
  return "plaintext";
}

export default function EditorPane({ path, content, onChange }) {
  return (
    <div style={{ height: "100%", border: "1px solid #ddd", borderRadius: 12, overflow: "hidden" }}>
      <Editor
        height="calc(100vh - 380px)"
        language={languageFromPath(path)}
        value={content}
        onChange={(v) => onChange(v ?? "")}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on"
        }}
      />
    </div>
  );
}

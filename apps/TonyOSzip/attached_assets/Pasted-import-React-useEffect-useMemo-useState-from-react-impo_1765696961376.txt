import React, { useEffect, useMemo, useState } from "react";
import { getTree, getFile, saveFile, mkdir, newFile } from "./api.js";
import FileTree from "./components/FileTree.jsx";
import EditorPane from "./components/EditorPane.jsx";
import TerminalPane from "./components/TerminalPane.jsx";

export default function App() {
  const [tree, setTree] = useState([]);
  const [selectedPath, setSelectedPath] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const [runCmd, setRunCmd] = useState("python app.py");

  const selectedName = useMemo(() => selectedPath.split(/[\\/]/).pop() || "", [selectedPath]);

  async function refreshTree() {
    const t = await getTree();
    if (t.error) { setStatus(t.error); return; }
    setTree(t.tree || []);
    setStatus("Ready");
  }

  async function openFile(p) {
    const r = await getFile(p);
    if (r.error) { setStatus(r.error); return; }
    setSelectedPath(p);
    setContent(r.content ?? "");
    setDirty(false);
    setStatus(`Opened ${p}`);
  }

  async function saveCurrent() {
    if (!selectedPath) return;
    const r = await saveFile(selectedPath, content);
    if (r.error) { setStatus(r.error); return; }
    setDirty(false);
    setStatus(`Saved ${selectedPath}`);
    await refreshTree();
  }

  async function createFolder() {
    const name = prompt("Folder name (relative to workspace). Example: src");
    if (!name) return;
    const r = await mkdir(name);
    if (r.error) { setStatus(r.error); return; }
    setStatus("Folder created");
    await refreshTree();
  }

  async function createFile() {
    const name = prompt("File path (relative to workspace). Example: app.py or src/main.js");
    if (!name) return;
    const r = await newFile(name);
    if (r.error) { setStatus(r.error); return; }
    setStatus("File created");
    await refreshTree();
  }

  useEffect(() => {
    refreshTree();
  }, []);

  return (
    <div style={styles.shell}>
      <div style={styles.topbar}>
        <div style={{ fontWeight: 800 }}>CodeBench</div>
        <div style={styles.controls}>
          <button onClick={refreshTree} style={styles.btn}>Refresh</button>
          <button onClick={createFolder} style={styles.btn}>New Folder</button>
          <button onClick={createFile} style={styles.btn}>New File</button>

          <input
            value={runCmd}
            onChange={(e) => setRunCmd(e.target.value)}
            style={styles.input}
            placeholder="Run command like: python app.py"
          />
        </div>

        <div style={styles.rightControls}>
          <button onClick={saveCurrent} disabled={!dirty} style={{...styles.btn, opacity: dirty ? 1 : 0.5}}>
            Save
          </button>
          <div style={styles.status}>{status}</div>
        </div>
      </div>

      <div style={styles.main}>
        <div style={styles.left}>
          <div style={styles.panelTitle}>Files</div>
          <FileTree tree={tree} onOpenFile={openFile} />
        </div>

        <div style={styles.center}>
          <div style={styles.panelTitle}>
            Editor {selectedName ? `| ${selectedName}` : ""}
            {dirty ? " (unsaved)" : ""}
          </div>
          <EditorPane
            path={selectedPath}
            content={content}
            onChange={(v) => { setContent(v); setDirty(true); }}
          />
        </div>
      </div>

      <div style={styles.bottom}>
        <TerminalPane runCommand={runCmd} />
      </div>
    </div>
  );
}

const styles = {
  shell: { height: "100vh", display: "flex", flexDirection: "column", fontFamily: "Arial, Helvetica, sans-serif" },
  topbar: { display: "flex", alignItems: "center", gap: 12, padding: 10, borderBottom: "1px solid #ddd" },
  controls: { display: "flex", alignItems: "center", gap: 8, flex: 1 },
  rightControls: { display: "flex", alignItems: "center", gap: 10 },
  btn: { padding: "8px 10px", border: "1px solid #111", background: "#111", color: "#fff", borderRadius: 10, cursor: "pointer" },
  input: { flex: 1, minWidth: 260, padding: "8px 10px", borderRadius: 10, border: "1px solid #ccc" },
  status: { fontSize: 12, color: "#333", maxWidth: 320, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  main: { display: "flex", flex: 1, minHeight: 0 },
  left: { width: 320, borderRight: "1px solid #ddd", padding: 10, overflow: "auto" },
  center: { flex: 1, padding: 10, overflow: "hidden", minWidth: 0 },
  bottom: { height: 280, borderTop: "1px solid #ddd" },
  panelTitle: { fontWeight: 700, fontSize: 12, color: "#444", marginBottom: 8 }
};

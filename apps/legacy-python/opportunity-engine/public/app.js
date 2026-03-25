const API_BASE = '';
let allResults = JSON.parse(localStorage.getItem('oppEngineResults') || '[]');

document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  loadIntelligence();
  renderResults();
});

function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
}

async function loadIntelligence() {
  try {
    const [taxonomyRes, keywordsRes, competitorsRes] = await Promise.all([
      fetch(`${API_BASE}/api/taxonomy`),
      fetch(`${API_BASE}/api/keywords`),
      fetch(`${API_BASE}/api/competitors`)
    ]);
    
    const taxonomy = await taxonomyRes.json();
    const keywords = await keywordsRes.json();
    const competitors = await competitorsRes.json();
    
    document.getElementById('taxonomyGrid').innerHTML = taxonomy.taxonomy
      .map(t => `<span class="chip">${t}</span>`).join('');
    
    document.getElementById('keywordsGrid').innerHTML = [
      ...keywords.keywords,
      ...keywords.pressureKeywords.map(k => `⚠️ ${k}`)
    ].map(k => `<span class="chip">${k}</span>`).join('');
    
    document.getElementById('competitorGrid').innerHTML = competitors.competitors
      .map(c => `
        <div class="competitor-card">
          <h4>${c.name}</h4>
          <div class="meta">${c.type} • ${c.region}</div>
        </div>
      `).join('');
  } catch (error) {
    console.error('Failed to load intelligence:', error);
  }
}

async function runSingleScan() {
  const name = document.getElementById('singleName').value || 'Unknown Company';
  const description = document.getElementById('singleDescription').value;
  const website = document.getElementById('singleWebsite').value;
  const region = document.getElementById('singleRegion').value;
  const useAI = document.getElementById('singleUseAI').checked;
  
  if (!description) {
    alert('Please enter a company description');
    return;
  }
  
  setStatus('Scanning...');
  
  try {
    const res = await fetch(`${API_BASE}/api/scan/single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, website, region, useAI })
    });
    
    const result = await res.json();
    
    allResults.unshift(result);
    saveResults();
    
    document.getElementById('singleResult').style.display = 'block';
    document.getElementById('singleResultContent').innerHTML = renderResultDetail(result);
    
    renderResults();
    setStatus('Scan Complete');
  } catch (error) {
    console.error('Scan failed:', error);
    setStatus('Scan Failed');
    alert('Scan failed: ' + error.message);
  }
}

async function runBatchScan() {
  const input = document.getElementById('batchInput').value;
  const useAI = document.getElementById('batchUseAI').checked;
  
  let companies;
  try {
    companies = JSON.parse(input);
    if (!Array.isArray(companies)) throw new Error('Must be an array');
  } catch (e) {
    alert('Invalid JSON. Please check your input.');
    return;
  }
  
  setStatus('Batch Scanning...');
  showProgress(0, companies.length);
  
  try {
    const res = await fetch(`${API_BASE}/api/scan/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companies, useAI })
    });
    
    const data = await res.json();
    
    allResults = [...data.results, ...allResults];
    saveResults();
    
    hideProgress();
    renderResults();
    
    document.querySelector('[data-tab="results"]').click();
    setStatus(`Scanned ${data.results.length} companies`);
  } catch (error) {
    console.error('Batch scan failed:', error);
    hideProgress();
    setStatus('Batch Failed');
    alert('Batch scan failed: ' + error.message);
  }
}

function loadSampleBatch() {
  const sample = [
    {
      name: "PharmaCo Industries",
      description: "Leading CDMO expanding tablet production capacity. Currently experiencing throughput bottlenecks with Fette 3090 presses. Looking to validate new formulations and scale-up pilot batches for FDA submission.",
      website: "pharmaco.com",
      region: "usa"
    },
    {
      name: "NutraLife Supplements",
      description: "Vitamin and nutraceutical manufacturer seeking new tooling solutions. Current press dies showing wear after 2M cycles. Considering upgrade from Korsch XL400.",
      website: "nutralife.com",
      region: "canada"
    },
    {
      name: "BatteryTech Materials",
      description: "Advanced battery materials company compacting cathode powders. Expanding sodium-ion production line. Need high-precision compaction equipment.",
      website: "batterytech.io",
      region: "usa"
    }
  ];
  
  document.getElementById('batchInput').value = JSON.stringify(sample, null, 2);
}

function renderResults() {
  const filter = document.getElementById('tierFilter').value;
  let filtered = allResults;
  
  if (filter !== 'all') {
    filtered = allResults.filter(r => r.finalTier === parseInt(filter));
  }
  
  const tier1 = allResults.filter(r => r.finalTier === 1).length;
  const tier2 = allResults.filter(r => r.finalTier === 2).length;
  const tier3 = allResults.filter(r => r.finalTier === 3).length;
  
  document.getElementById('totalScanned').textContent = allResults.length;
  document.getElementById('tier1Count').textContent = tier1;
  document.getElementById('tier2Count').textContent = tier2;
  document.getElementById('tier3Count').textContent = tier3;
  
  const container = document.getElementById('resultsList');
  
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state">No scan results yet. Run a scan to see opportunities.</div>';
    return;
  }
  
  container.innerHTML = filtered.map((r, i) => `
    <div class="result-card">
      <div class="result-tier tier-${r.finalTier}">T${r.finalTier}</div>
      <div class="result-info">
        <h4>${escHtml(r.name)}</h4>
        <div class="meta">${r.region?.toUpperCase() || 'N/A'} • ${r.scannedAt ? new Date(r.scannedAt).toLocaleDateString() : 'N/A'}</div>
        <div class="result-tags">
          ${r.taxonomy?.slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('') || ''}
          ${r.competitors?.map(c => `<span class="tag" style="background:rgba(255,68,102,0.1);color:#ff4466;">⚔️ ${c}</span>`).join('') || ''}
        </div>
      </div>
      <div class="result-actions">
        <button class="btn btn-secondary" onclick="viewDetail(${i})">View</button>
      </div>
    </div>
  `).join('');
}

function renderResultDetail(result) {
  return `
    <div style="display: grid; gap: 16px;">
      <div>
        <strong>Company:</strong> ${escHtml(result.name)}<br>
        <strong>Region:</strong> ${result.region?.toUpperCase() || 'N/A'}<br>
        <strong>Tier:</strong> <span style="color: ${result.finalTier === 1 ? 'var(--tier1)' : result.finalTier === 2 ? 'var(--tier2)' : 'var(--tier3)'}">Tier ${result.finalTier}</span>
      </div>
      <div>
        <strong>Local Analysis:</strong>
        <pre style="background: var(--bg-input); padding: 12px; border-radius: 8px; overflow: auto; font-size: 0.85rem;">${JSON.stringify(result.localAnalysis, null, 2)}</pre>
      </div>
      ${result.competitors?.length ? `<div><strong>Competitors Detected:</strong> ${result.competitors.join(', ')}</div>` : ''}
      ${result.taxonomy?.length ? `<div><strong>Taxonomy Match:</strong> ${result.taxonomy.join(', ')}</div>` : ''}
      ${result.ai ? `
        <div>
          <strong>AI Analysis:</strong>
          <pre style="background: var(--bg-input); padding: 12px; border-radius: 8px; overflow: auto; font-size: 0.85rem;">${JSON.stringify(result.ai, null, 2)}</pre>
        </div>
      ` : ''}
    </div>
  `;
}

function viewDetail(index) {
  const result = allResults[index];
  alert(JSON.stringify(result, null, 2));
}

function filterResults() {
  renderResults();
}

function exportResults(format) {
  if (allResults.length === 0) {
    alert('No results to export');
    return;
  }
  
  let content, filename, type;
  
  if (format === 'json') {
    content = JSON.stringify(allResults, null, 2);
    filename = `opportunity-scan-${Date.now()}.json`;
    type = 'application/json';
  } else {
    const headers = ['Name', 'Region', 'Tier', 'Keywords', 'Competitors', 'Taxonomy', 'Scanned At'];
    const rows = allResults.map(r => [
      r.name,
      r.region,
      r.finalTier,
      r.localAnalysis?.keywords?.join(';') || '',
      r.competitors?.join(';') || '',
      r.taxonomy?.join(';') || '',
      r.scannedAt
    ]);
    content = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    filename = `opportunity-scan-${Date.now()}.csv`;
    type = 'text/csv';
  }
  
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function clearResults() {
  if (confirm('Clear all scan results?')) {
    allResults = [];
    saveResults();
    renderResults();
  }
}

function saveResults() {
  localStorage.setItem('oppEngineResults', JSON.stringify(allResults));
}

function showProgress(current, total) {
  document.getElementById('batchProgress').style.display = 'block';
  document.getElementById('progressFill').style.width = `${(current / total) * 100}%`;
  document.getElementById('progressText').textContent = `Processing ${current} of ${total}...`;
}

function hideProgress() {
  document.getElementById('batchProgress').style.display = 'none';
}

function setStatus(text) {
  document.getElementById('status').textContent = text;
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

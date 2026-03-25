const kpiTargets = {
  campaigns: { base: 12, variance: 4 },
  leads: { base: 180, variance: 40 },
  conversion: { base: 6.5, variance: 1.3 },
  pipeline: { base: 1.8, variance: 0.6 }
};

const feed = document.getElementById('activity-feed');
const consoleEl = document.getElementById('ops-console');

const logLines = [];

const randomWithin = (base, variance, decimals = 0) => {
  const value = base + (Math.random() - 0.5) * variance * 2;
  return value.toFixed(decimals);
};

const updateKpis = () => {
  document.getElementById('kpi-campaigns').textContent = randomWithin(kpiTargets.campaigns.base, kpiTargets.campaigns.variance);
  document.getElementById('kpi-leads').textContent = randomWithin(kpiTargets.leads.base, kpiTargets.leads.variance);
  document.getElementById('kpi-conversion').textContent = `${randomWithin(kpiTargets.conversion.base, kpiTargets.conversion.variance, 1)}%`;
  document.getElementById('kpi-pipeline').textContent = `$${randomWithin(kpiTargets.pipeline.base, kpiTargets.pipeline.variance, 2)}M`;
  logToConsole('Metrics refreshed');
};

const logToConsole = (message) => {
  const timestamp = new Date().toLocaleTimeString();
  logLines.unshift(`[${timestamp}] ${message}`);
  consoleEl.textContent = logLines.slice(0, 12).join('\n');
};

const logActivity = () => {
  const activity = [
    'Activated new Natoli ad set',
    'Qualified lead from manufacturing vertical',
    'Synced CRM records to TonyOS',
    'Triggered LinkedIn nurture sequence',
    'Generated PDF insights for sales team'
  ];
  const entry = `${new Date().toLocaleTimeString()} · ${activity[Math.floor(Math.random() * activity.length)]}`;
  const item = document.createElement('li');
  item.textContent = entry;
  feed.prepend(item);
  if (feed.children.length > 12) {
    feed.removeChild(feed.lastChild);
  }
  logToConsole('New activity recorded');
};

// hooks

document.getElementById('refreshMetrics').addEventListener('click', updateKpis);
document.getElementById('logEvent').addEventListener('click', logActivity);

// bootstrap
updateKpis();
logActivity();
setInterval(() => {
  if (Math.random() > 0.5) {
    logActivity();
  }
  updateKpis();
}, 8000);

/**
 * TonyOS Master Google Sheets Sync Client
 * 
 * This script syncs data from all TonyOS apps to ONE master Google Sheet.
 * Each app writes to its own tab (worksheet) in the master sheet.
 * 
 * SETUP:
 * 1. Create a Google Sheet
 * 2. Go to Extensions > Apps Script
 * 3. Paste the Apps Script code (see apps-script-endpoint.js)
 * 4. Deploy as Web App (Anyone can access)
 * 5. Copy the Web App URL and set it below or in localStorage
 */

const SheetsSync = {
  STORAGE_KEY: 'tonyos_sheets_config',
  
  getConfig() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.error('[SheetsSync] Invalid config:', e);
      }
    }
    return { webAppUrl: '', apiKey: '', enabled: false };
  },
  
  setConfig(config) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(config));
  },
  
  isEnabled() {
    const config = this.getConfig();
    return config.enabled && config.webAppUrl;
  },
  
  async sync(sheetName, data, action = 'append') {
    const config = this.getConfig();
    if (!config.enabled || !config.webAppUrl) {
      console.log('[SheetsSync] Not enabled or no URL configured');
      return { success: false, reason: 'not_configured' };
    }
    
    const payload = {
      token: config.apiKey || '',
      app: sheetName.toLowerCase(),
      action: action,
      payload: {
        ...data,
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      const response = await fetch(config.webAppUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      console.log(`[SheetsSync] Synced to ${sheetName}:`, data);
      return { success: true };
    } catch (error) {
      console.error('[SheetsSync] Sync failed:', error);
      this.queueForRetry(sheetName, data, action);
      return { success: false, error: error.message };
    }
  },
  
  queueForRetry(sheetName, data, action) {
    const queue = JSON.parse(localStorage.getItem('tonyos_sync_queue') || '[]');
    queue.push({ sheetName, data, action, queuedAt: new Date().toISOString() });
    localStorage.setItem('tonyos_sync_queue', JSON.stringify(queue));
  },
  
  async processRetryQueue() {
    const queue = JSON.parse(localStorage.getItem('tonyos_sync_queue') || '[]');
    if (queue.length === 0) return;
    
    console.log(`[SheetsSync] Processing ${queue.length} queued items`);
    const failed = [];
    
    for (const item of queue) {
      const result = await this.sync(item.sheetName, item.data, item.action);
      if (!result.success && result.reason !== 'not_configured') {
        failed.push(item);
      }
    }
    
    localStorage.setItem('tonyos_sync_queue', JSON.stringify(failed));
  },
  
  async syncJournalEntry(entry) {
    return this.sync('Journal', {
      date: entry.date,
      mood: entry.mood || '',
      stress: entry.stress || '',
      category: entry.category || '',
      content: (entry.content || '').substring(0, 5000),
      gratitude: (entry.gratitude || []).join(' | '),
      focus: entry.focus || '',
      reflection: entry.reflection || '',
      tags: (entry.tags || []).join(', '),
      links: (entry.links || []).join(' | '),
      wordCount: entry.content ? entry.content.split(/\s+/).filter(w => w).length : 0,
      updatedAt: new Date().toISOString()
    });
  },
  
  async syncCRMContact(contact) {
    return this.sync('CRM_Contacts', {
      id: contact.id,
      name: contact.name || '',
      company: contact.company || '',
      title: contact.title || '',
      email: contact.email || '',
      phone: contact.phone || '',
      linkedin: contact.linkedin || '',
      website: contact.website || '',
      notes: contact.notes || '',
      stage: contact.stage || '',
      customerTier: contact.customerTier || '',
      divisionFit: contact.divisionFit || '',
      tier: contact.tier || '',
      isPrimaryMarket: contact.isPrimaryMarket || false,
      industry: contact.industry || '',
      painPoints: contact.painPoints || '',
      whyNatoli: contact.whyNatoli || '',
      source: contact.source || '',
      createdAt: contact.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  },
  
  async syncApolloAccount(account) {
    return this.sync('Apollo_Accounts', {
      id: account.id || account.account_id,
      company: account.company || '',
      website: account.website || '',
      industry: account.detected_industry || account.industry || '',
      employees: account.employees || 0,
      revenue: account.revenue || '',
      divisionFit: account.division_fit || '',
      isPrimaryMarket: account.is_primary_market || false,
      isQualified: account.is_qualified || false,
      tier: account.tier || '',
      tierReason: account.tier_reason || '',
      painPoints: Array.isArray(account.pain_points) ? account.pain_points.join(' | ') : (account.pain_points || ''),
      whyNatoli: account.why_natoli || '',
      enrichedAt: account.enriched_at || new Date().toISOString()
    });
  },
  
  async syncContactSubmission(submission) {
    return this.sync('Contact_Submissions', {
      id: submission.id,
      name: submission.name || '',
      email: submission.email || '',
      company: submission.company || '',
      phone: submission.phone || '',
      message: (submission.message || '').substring(0, 5000),
      createdAt: submission.createdAt || new Date().toISOString()
    });
  },
  
  async syncCRMActivity(activity) {
    return this.sync('CRM_Activity', {
      id: activity.id,
      contactId: activity.contactId || '',
      contactName: activity.contactName || '',
      channel: activity.channel || '',
      type: activity.type || '',
      outcome: activity.outcome || '',
      notes: activity.notes || '',
      date: activity.date || new Date().toISOString()
    });
  },
  
  async syncBudgetEntry(entry) {
    return this.sync('Budget', {
      id: entry.id,
      type: entry.type || '',
      category: entry.category || '',
      description: entry.description || '',
      amount: entry.amount || 0,
      date: entry.date || new Date().toISOString(),
      recurring: entry.recurring || false
    });
  },
  
  async syncDailyEntry(entry) {
    return this.sync('Daily', {
      date: new Date().toISOString().split('T')[0],
      oneWin: entry.one_win || '',
      pressure: entry.pressure || '',
      nextStep: entry.next_step || '',
      result: entry.result || '',
      timestamp: new Date().toISOString()
    });
  },
  
  async syncJobEntry(entry) {
    return this.sync('Jobs', {
      id: entry.id,
      company: entry.company || '',
      title: entry.title || '',
      status: entry.status || '',
      applied: entry.applied || '',
      notes: entry.notes || '',
      url: entry.url || '',
      updatedAt: new Date().toISOString()
    });
  },
  
  async syncGovernorAssumption(assumption) {
    return this.sync('CRM_Assumptions', {
      accountId: assumption.account_id || '',
      accountName: assumption.account_name || '',
      assumption: assumption.assumption || '',
      confidence: assumption.confidence || 'medium',
      context: assumption.context || '',
      validated: assumption.validated || null,
      validationNote: assumption.validation_note || '',
      time: assumption.time || new Date().toISOString()
    });
  },
  
  async syncGovernorOutcome(outcome) {
    return this.sync('CRM_Outcomes', {
      accountId: outcome.account_id || '',
      accountName: outcome.account_name || '',
      action: outcome.action || '',
      outcome: outcome.outcome || 'neutral',
      notes: outcome.notes || '',
      learnings: outcome.learnings || '',
      time: outcome.time || new Date().toISOString()
    });
  },
  
  async syncGovernorSession(session) {
    return this.sync('CRM_Sessions', {
      summary: session.summary || '',
      wins: Array.isArray(session.wins) ? session.wins.join(' | ') : (session.wins || ''),
      learnings: Array.isArray(session.learnings) ? session.learnings.join(' | ') : (session.learnings || ''),
      nextFocus: session.next_focus || '',
      time: session.time || new Date().toISOString()
    });
  },
  
  showConfigModal() {
    const config = this.getConfig();
    const modal = document.createElement('div');
    modal.id = 'sheets-config-modal';
    modal.innerHTML = `
      <div style="position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:10000;display:flex;align-items:center;justify-content:center;">
        <div style="background:#1e293b;border-radius:16px;padding:2rem;max-width:500px;width:90%;border:1px solid rgba(255,255,255,0.1);">
          <h2 style="color:#fff;margin:0 0 1rem 0;font-size:1.5rem;">Google Sheets Sync</h2>
          <p style="color:#94a3b8;margin-bottom:1.5rem;font-size:0.9rem;">
            Connect TonyOS to your master Google Sheet. All apps will sync data to one sheet with separate tabs.
          </p>
          <div style="margin-bottom:1rem;">
            <label style="display:block;color:#e2e8f0;margin-bottom:0.5rem;font-size:0.9rem;">Web App URL</label>
            <input type="text" id="sheets-url" value="${config.webAppUrl || ''}" 
              placeholder="https://script.google.com/macros/s/..." 
              style="width:100%;padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:#0f172a;color:#e2e8f0;font-size:0.9rem;">
          </div>
          <div style="margin-bottom:1rem;">
            <label style="display:block;color:#e2e8f0;margin-bottom:0.5rem;font-size:0.9rem;">API Key (must match your Apps Script)</label>
            <input type="password" id="sheets-apikey" value="${config.apiKey || ''}" 
              placeholder="Your secret API key..." 
              style="width:100%;padding:0.75rem;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:#0f172a;color:#e2e8f0;font-size:0.9rem;">
            <p style="color:#64748b;font-size:0.75rem;margin-top:0.25rem;">Use the same key you set in the Apps Script code</p>
          </div>
          <div style="margin-bottom:1.5rem;">
            <label style="display:flex;align-items:center;gap:0.5rem;color:#e2e8f0;cursor:pointer;">
              <input type="checkbox" id="sheets-enabled" ${config.enabled ? 'checked' : ''} style="width:18px;height:18px;">
              <span>Enable Google Sheets sync</span>
            </label>
          </div>
          <div style="display:flex;gap:0.75rem;justify-content:flex-end;">
            <button id="sheets-cancel" style="padding:0.6rem 1.2rem;border-radius:8px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#94a3b8;cursor:pointer;">Cancel</button>
            <button id="sheets-save" style="padding:0.6rem 1.2rem;border-radius:8px;border:none;background:linear-gradient(135deg,#e11d48,#be185d);color:#fff;cursor:pointer;">Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    
    document.getElementById('sheets-cancel').onclick = () => modal.remove();
    document.getElementById('sheets-save').onclick = () => {
      const url = document.getElementById('sheets-url').value.trim();
      const apiKey = document.getElementById('sheets-apikey').value.trim();
      const enabled = document.getElementById('sheets-enabled').checked;
      this.setConfig({ webAppUrl: url, apiKey: apiKey, enabled: enabled });
      modal.remove();
      if (enabled && url) {
        this.processRetryQueue();
      }
    };
  }
};

if (navigator.onLine) {
  SheetsSync.processRetryQueue();
}

window.addEventListener('online', () => {
  SheetsSync.processRetryQueue();
});

window.SheetsSync = SheetsSync;

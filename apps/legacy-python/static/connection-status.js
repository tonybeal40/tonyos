/**
 * TonyOS Connection Status Indicator
 *
 * Shows Live/Offline status on every page.
 * Import this script on all TonyOS pages.
 */

const ConnectionStatus = {
  init() {
    this.createIndicator();
    this.updateStatus();

    window.addEventListener("online", () => this.updateStatus());
    window.addEventListener("offline", () => this.updateStatus());

    setInterval(() => this.checkApiConnection(), 30000);
  },

  createIndicator() {
    if (document.getElementById("connection-status")) return;

    const indicator = document.createElement("div");
    indicator.id = "connection-status";
    indicator.innerHTML = `
      <style>
        #connection-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(30, 41, 59, 0.95);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #94a3b8;
          z-index: 9999;
          backdrop-filter: blur(8px);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        #connection-status:hover {
          background: rgba(30, 41, 59, 1);
        }
        #connection-status .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          transition: background 0.3s ease;
        }
        #connection-status.online .status-dot {
          background: #22c55e;
          box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
        }
        #connection-status.offline .status-dot {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
        }
        #connection-status.checking .status-dot {
          background: #eab308;
          animation: pulse 1s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        #connection-status .status-text {
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        #connection-status .sheets-icon {
          width: 14px;
          height: 14px;
          opacity: 0.5;
        }
        #connection-status.sheets-connected .sheets-icon {
          opacity: 1;
        }
      </style>
      <span class="status-dot"></span>
      <span class="status-text">Checking...</span>
      <svg class="sheets-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9" x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="3" x2="9" y2="21"/>
      </svg>
    `;
    document.body.appendChild(indicator);

    indicator.addEventListener("click", () => {
      if (window.SheetsSync) {
        window.SheetsSync.showConfigModal();
      }
    });
  },

  updateStatus() {
    const indicator = document.getElementById("connection-status");
    if (!indicator) return;

    const isOnline = navigator.onLine;
    const textEl = indicator.querySelector(".status-text");

    indicator.className = isOnline ? "online" : "offline";
    textEl.textContent = isOnline ? "Live" : "Offline";

    if (window.SheetsSync && window.SheetsSync.isEnabled()) {
      indicator.classList.add("sheets-connected");
    }
  },

  async checkApiConnection() {
    const indicator = document.getElementById("connection-status");
    if (!indicator || !navigator.onLine) return;

    indicator.classList.add("checking");

    try {
      const response = await fetch("/api/health", {
        method: "GET",
        timeout: 5000,
      });

      if (response.ok) {
        this.updateStatus();
      } else {
        indicator.className = "offline";
        indicator.querySelector(".status-text").textContent = "API Error";
      }
    } catch (e) {
      if (navigator.onLine) {
        indicator.className = "offline";
        indicator.querySelector(".status-text").textContent = "API Down";
      }
    }
  },
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => ConnectionStatus.init());
} else {
  ConnectionStatus.init();
}

window.ConnectionStatus = ConnectionStatus;

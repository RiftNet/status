import http from 'node:http';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const PORT = parseInt(process.env.PORT || '9000', 10);

// Status data structure
interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'offline';
  uptime: number;
}

interface IncidentUpdate {
  time: string;
  message: string;
}

interface Incident {
  id: string;
  title: string;
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
  startTime: string;
  endTime?: string;
  updates: IncidentUpdate[];
}

// Mock data
const services: ServiceStatus[] = [
  { name: 'API Server', status: 'operational', uptime: 99.98 },
  { name: 'Gateway (WebSocket)', status: 'operational', uptime: 99.97 },
  { name: 'Media Service', status: 'operational', uptime: 99.99 },
  { name: 'Database', status: 'operational', uptime: 100.0 },
];

const incidents: Incident[] = [
  {
    id: '1',
    title: 'Gateway Maintenance Window',
    status: 'resolved',
    startTime: '2026-07-28T14:00:00Z',
    endTime: '2026-07-28T14:30:00Z',
    updates: [
      { time: '2026-07-28T14:00:00Z', message: 'Scheduled maintenance began on Gateway service' },
      { time: '2026-07-28T14:30:00Z', message: 'Maintenance completed successfully' },
    ],
  },
];

const statusMap = {
  operational: { color: '#10b981', icon: 'check', label: 'Operational' },
  degraded: { color: '#f59e0b', icon: 'alert', label: 'Degraded' },
  offline: { color: '#ef4444', icon: 'x', label: 'Offline' },
};

const incidentStatusMap = {
  investigating: { color: '#3b82f6', label: 'Investigating' },
  identified: { color: '#f59e0b', label: 'Identified' },
  monitoring: { color: '#06b6d4', label: 'Monitoring' },
  resolved: { color: '#10b981', label: 'Resolved' },
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getOverallStatus(): 'operational' | 'degraded' | 'offline' {
  if (services.some(s => s.status === 'offline')) return 'offline';
  if (services.some(s => s.status === 'degraded')) return 'degraded';
  return 'operational';
}

function renderIcon(name: 'check' | 'alert' | 'x'): string {
  const icons = {
    check: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>',
    alert: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>',
    x: '<svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>',
  };
  return icons[name];
}

function renderHTML(): string {
  const overallStatus = getOverallStatus();
  const statusColor = statusMap[overallStatus].color;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rift Status</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
      color: #e0e0e0;
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
    }

    header {
      text-align: center;
      margin-bottom: 3rem;
      padding-top: 2rem;
    }

    .logo {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #0099bb 0%, #00d4ff 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .status-banner {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      flex-shrink: 0;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .status-text {
      flex: 1;
    }

    .status-title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .status-subtitle {
      color: #9aabbd;
      font-size: 0.9rem;
    }

    .section {
      margin-bottom: 2rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9aabbd;
    }

    .service-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .service-card {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1.25rem;
      transition: all 0.2s ease;
    }

    .service-card:hover {
      background: rgba(255, 255, 255, 0.08);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .service-name {
      font-weight: 500;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .service-icon {
      width: 20px;
      height: 20px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .service-status {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 0.9rem;
      color: #9aabbd;
    }

    .uptime {
      font-weight: 500;
    }

    .incidents {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 1.5rem;
    }

    .incident {
      padding-bottom: 1.5rem;
      margin-bottom: 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .incident:last-child {
      border-bottom: none;
      padding-bottom: 0;
      margin-bottom: 0;
    }

    .incident-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.75rem;
    }

    .incident-title {
      font-weight: 600;
      font-size: 1rem;
    }

    .incident-status {
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.4rem 0.75rem;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
    }

    .incident-time {
      color: #9aabbd;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }

    .incident-updates {
      margin-left: 0;
      padding-left: 0;
    }

    .incident-update {
      padding: 0.5rem 0;
      color: #9aabbd;
      font-size: 0.9rem;
      list-style: none;
    }

    .update-time {
      font-weight: 500;
      color: #e0e0e0;
    }

    .no-incidents {
      text-align: center;
      padding: 2rem;
      color: #9aabbd;
    }

    footer {
      text-align: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      color: #9aabbd;
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .service-grid {
        grid-template-columns: 1fr;
      }

      .status-banner {
        flex-direction: column;
        text-align: center;
      }

      .status-text {
        flex: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Rift Status</div>
    </header>

    <div class="status-banner">
      <div class="status-indicator" style="background-color: ${statusColor}"></div>
      <div class="status-text">
        <div class="status-title">${statusMap[overallStatus].label}</div>
        <div class="status-subtitle">All systems operational</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Services</div>
      <div class="service-grid">
        ${services
          .map(service => {
            const statusInfo = statusMap[service.status];
            return `
          <div class="service-card">
            <div class="service-name">
              <span class="service-icon" style="color: ${statusInfo.color}">
                ${renderIcon(statusInfo.icon as 'check' | 'alert' | 'x')}
              </span>
              ${service.name}
            </div>
            <div class="service-status">
              <span>${statusInfo.label}</span>
              <span class="uptime">${service.uptime}% uptime</span>
            </div>
          </div>
          `;
          })
          .join('')}
      </div>
    </div>

    ${incidents.length > 0
      ? `
    <div class="section">
      <div class="section-title">Recent Incidents</div>
      <div class="incidents">
        ${incidents
          .map(incident => {
            const incidentInfo = incidentStatusMap[incident.status];
            return `
          <div class="incident">
            <div class="incident-header">
              <div class="incident-title">${incident.title}</div>
              <div class="incident-status" style="background-color: rgba(0, 0, 0, 0.3); border-left: 3px solid ${incidentInfo.color}; padding-left: 0.5rem;">
                ${incidentInfo.label}
              </div>
            </div>
            <div class="incident-time">
              Started: ${formatTime(incident.startTime)}
              ${incident.endTime ? ` • Resolved: ${formatTime(incident.endTime)}` : ''}
            </div>
            <ul class="incident-updates">
              ${incident.updates
                .map(
                  update => `
              <li class="incident-update">
                <span class="update-time">${formatTime(update.time)}</span> — ${update.message}
              </li>
              `,
                )
                .join('')}
            </ul>
          </div>
          `;
          })
          .join('')}
      </div>
    </div>
    `
      : ''
    }

    <footer>
      <p>&copy; 2026 Rift. Status page powered by Node.js</p>
    </footer>
  </div>
</body>
</html>
  `;
}

const server = http.createServer((req, res) => {
  if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'max-age=60',
    });
    res.end(renderHTML());
  } else if (req.url === '/api/status' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Cache-Control': 'max-age=30',
    });
    res.end(
      JSON.stringify({
        status: getOverallStatus(),
        services,
        incidents,
        timestamp: new Date().toISOString(),
      }),
    );
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(`✅ Status page running at http://localhost:${PORT}`);
});

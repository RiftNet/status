# Rift Status Page

A beautiful, Discord-inspired status page for monitoring Rift platform services. Built with TypeScript and Node.js using the `node:http` module for zero dependencies.

## Features

- **Discord-style Dark Theme** — Modern UI matching Rift's visual identity with gradient accents
- **Service Monitoring** — Real-time status indicators for API, Gateway, Media, and Database services
- **Incident Tracking** — Display historical incidents with resolution status and update timeline
- **SVG Icon Library** — Crisp, scalable icons without emoji
- **JSON API** — Programmatic access to status data via `/api/status` endpoint
- **Mobile Responsive** — CSS Grid-based design that adapts to all screen sizes
- **TypeScript Strict Mode** — Type-safe implementation with zero any's
- **Pure Node.js** — No frameworks, no build tooling (aside from TypeScript)

## Architecture

```
node:http Server → HTML Template → CSS Styling → SVG Icons
                 → JSON API → Status Data
```

## Getting Started

### Install Dependencies

```bash
cd /root/rift/status
npm install
```

### Development

```bash
npm run dev
```

Server runs on `http://localhost:9000` with hot reload via tsx.

### Build

```bash
npm run build
```

Compiles TypeScript to `dist/server.js`.

### Production

```bash
npm start
```

### Type Checking

```bash
npm run type-check
```

## Environment Variables

- `PORT` — Server port (default: 9000)

## API Endpoints

### `GET /`

Returns the HTML status page.

```bash
curl http://localhost:9000/
```

### `GET /api/status`

Returns JSON status data.

```bash
curl http://localhost:9000/api/status | jq .
```

**Response:**

```json
{
  "status": "operational",
  "services": [
    {
      "name": "API Server",
      "status": "operational",
      "uptime": 99.98
    }
  ],
  "incidents": [],
  "timestamp": "2026-07-30T00:30:00.000Z"
}
```

## Status Values

- **operational** — Green, service is running normally
- **degraded** — Yellow, service is experiencing issues
- **offline** — Red, service is unavailable

## Customization

Edit `/src/server.ts` to:

- Modify service names and status in the `services` array
- Add or update incidents in the `incidents` array
- Change colors in the `statusMap` and `incidentStatusMap` objects
- Customize styling in the CSS section of `renderHTML()`

## Architecture Notes

- **No external dependencies** (except TypeScript for development)
- **No JSX, React, or frameworks** — Pure HTML string rendering
- **SVG icons** generated inline for zero external requests
- **CSS-in-HTML** for single-file deployment
- **HTTP caching headers** for performance optimization

## License

Proprietary — See LICENSE file

# 🎥 CCTV Multi-Camera Monitoring System

A professional-grade, cross-platform desktop application for monitoring multiple CCTV cameras simultaneously with real-time video streaming, built with Electron and Node.js.

---

## 📋 Table of Contents
1. [Features](#features)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Configuration](#configuration)
6. [Usage](#usage)
7. [API Reference](#api-reference)
8. [Development](#development)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)
11. [License](#license)

---

## ✨ Features

- **Multi-Camera Grid View**: Display 1-16 cameras simultaneously with dynamic grid layout
- **Real-Time Streaming**: Low-latency video streaming using WebRTC
- **Protocol Support**: RTSP, RTMP, HTTP (MJPEG), and other streaming protocols
- **Cross-Platform**: Runs on Windows, macOS, and Linux
- **Responsive UI**: Adaptive grid layout that adjusts to camera count
- **Camera Management**: Add, remove, and configure cameras dynamically
- **Fullscreen Mode**: Individual camera fullscreen support
- **Connection Status**: Real-time connection status indicators
- **Dark Theme**: Professional dark interface optimized for monitoring

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         Electron Client (UI)            │
│  ┌──────────────────────────────────┐   │
│  │  Camera Grid (1-16 cells)        │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐     │   │
│  │  │Video │ │Video │ │Video │ ... │   │
│  │  └──────┘ └──────┘ └──────┘     │   │
│  └──────────────────────────────────┘   │
│           ▲ WebRTC                      │
└───────────┼─────────────────────────────┘
            │
┌───────────┼─────────────────────────────┐
│           ▼                             │
│      Backend Server (Node.js)           │
│  ┌──────────────────────────────────┐   │
│  │  REST API  │  WebRTC Server      │   │
│  ├────────────┼─────────────────────┤   │
│  │  Camera DB │  Stream Manager     │   │
│  └────────────┴─────────────────────┘   │
│           ▲                             │
└───────────┼─────────────────────────────┘
            │ RTSP/RTMP/HTTP
┌───────────▼─────────────────────────────┐
│        CCTV Cameras (1-N)               │
│  📹 Camera 1  📹 Camera 2  📹 Camera 3  │
└─────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Desktop UI** | Electron 28, HTML5, CSS3 |
| **Backend** | Node.js 20, Express.js 4 |
| **Video Streaming** | WebRTC, FFmpeg, node-rtsp-stream |
| **Database** | JSON file storage (SQLite ready) |
| **Build System** | Makefile, npm scripts |
| **Deployment** | Docker, electron-builder |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.0.0
- **FFmpeg** (required for RTSP streaming)
- **npm** or **yarn**

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/cctv-monitor.git
cd cctv-monitor

# Install all dependencies
make install

# Start development environment
make dev
```

The backend server will start on `http://localhost:3000` and the Electron app will launch automatically.

---

## ⚙️ Configuration

### Backend Configuration

Edit `backend/.env`:

```env
PORT=3000
RTSP_PORT=8554
MAX_CAMERAS=16
STREAM_QUALITY=high
LOG_LEVEL=info
```

### Supported Stream Types

| Type | Example URL | Notes |
|------|-------------|-------|
| RTSP | `rtsp://camera-ip:554/stream` | Most IP cameras |
| RTMP | `rtmp://server/live/stream` | Streaming servers |
| HTTP | `http://camera-ip/mjpeg` | MJPEG streams |

---

## 💻 Usage

### Adding a Camera

1. Click the **+ Add Camera** button in an empty grid cell
2. Enter camera details:
   - **Name**: Descriptive name (e.g., "Front Door")
   - **Stream URL**: Full RTSP/RTMP/HTTP URL
   - **Stream Type**: Select protocol type
3. Click **Add Camera**

### Managing Cameras

- **Fullscreen**: Click ⛶ button on camera header
- **Remove**: Click × button on camera header
- **Grid Layout**: Automatically adjusts based on camera count

### Keyboard Shortcuts

- `Esc`: Exit fullscreen or close modal
- `F11`: Toggle application fullscreen

---

## 📡 API Reference

### Endpoints

#### Get All Cameras
```http
GET /api/cameras
```

**Response:**
```json
[
  {
    "id": "cam-001",
    "name": "Front Door",
    "url": "rtsp://192.168.1.100:554/stream",
    "type": "rtsp",
    "status": "connected"
  }
]
```

#### Add Camera
```http
POST /api/cameras
Content-Type: application/json

{
  "name": "Front Door",
  "url": "rtsp://192.168.1.100:554/stream",
  "type": "rtsp"
}
```

#### Delete Camera
```http
DELETE /api/cameras/:id
```

#### Get Stream
```http
GET /api/cameras/:id/stream
```

Returns WebRTC SDP offer for the camera stream.

---

## 🔧 Development

### Project Structure

```
cctv-monitor/
├── backend/              # Node.js backend server
│   ├── src/
│   │   ├── index.js     # Express server
│   │   ├── routes/      # API routes
│   │   └── services/    # Stream services
│   └── package.json
├── electron-client/      # Electron desktop app
│   ├── src/
│   │   ├── main.js      # Main process
│   │   ├── renderer.js  # Renderer process
│   │   ├── index.html   # UI markup
│   │   └── styles.css   # Styling
│   └── package.json
├── Makefile             # Build automation
├── Dockerfile           # Docker configuration
└── README.md
```

### Available Commands

```bash
make help          # Show all commands
make install       # Install dependencies
make dev           # Start development
make build         # Build for production
make test          # Run tests
make lint          # Run linter
make clean         # Clean build artifacts
```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Full test suite
make test
```

---

## 🐳 Deployment

### Docker

```bash
# Build image
make docker-build

# Run container
make docker-run
```

### Production Build

```bash
# Build all components
make build

# Package Electron app (creates installers)
cd electron-client
npm run package
```

Installers will be in `electron-client/dist/`.

---

## 🔍 Troubleshooting

### Common Issues

**Camera not connecting:**
- Verify stream URL is accessible
- Check firewall settings
- Ensure FFmpeg is installed
- Test stream URL with VLC media player

**High CPU usage:**
- Reduce number of simultaneous streams
- Lower stream quality in backend config
- Use hardware acceleration if available

**Black screen on camera:**
- Check camera credentials
- Verify network connectivity
- Review browser console for errors

### Logs

Backend logs: `backend/logs/app.log`  
Electron logs: Check developer console (`Ctrl+Shift+I`)

---

## 📄 License

This project is licensed under the MIT License - see LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📞 Support

For issues and questions:
- **GitHub Issues**: [github.com/your-org/cctv-monitor/issues](https://github.com/your-org/cctv-monitor/issues)
- **Email**: support@your-org.com

---

**Built with ❤️ by Your Team**
# CamViewport — Enhanced IP Camera Video Wall

A modern, low-latency IP camera video wall with:

- **React/Vite web UI** — browser-based video wall (WebRTC, HLS, MJPEG, RTMP, iframe)
- **go2rtc** — best-in-class WebRTC WHEP re-streamer (port 1984)
- **mediamtx** — multi-protocol relay: RTSP · RTMP · HLS · WebRTC/WHEP · SRT (ports 8554/1935/8888/8889)
- **camviewport** — original C/X11/mpv native video wall (headless Xvfb + VNC, optional profile)
- **Tauri desktop client** — native desktop wrapper built on the same React frontend
- **Nginx** — reverse proxy with auto-generated self-signed TLS

---

## Quick Start

```bash
# 1. Copy and edit environment variables
cp .env.example .env

# 2. Add your camera URLs
#    Edit go2rtc/go2rtc.yaml   → streams section
#    Edit mediamtx/mediamtx.yml → paths section

# 3. Start the stack (web + go2rtc + mediamtx)
docker compose up -d

# 4. Open the video wall
#    https://localhost  (accept the self-signed cert warning)
```

> **WebRTC in browsers requires HTTPS** — this is why the Nginx self-signed cert is auto-generated. For LAN use, add the cert to your trusted store or use `localhost`.

---

## Services & Ports

| Service      | Port(s)                  | Description                          |
|-------------|--------------------------|--------------------------------------|
| `web`        | 80 (redirect), **443**   | React SPA + Nginx reverse proxy      |
| `go2rtc`     | **1984**                 | WebRTC WHEP + RTSP + RTMP + HTTP     |
| `mediamtx`   | 8554 / 1935 / **8888** / **8889** / 8890 | RTSP / RTMP / HLS / WebRTC / SRT |
| `camviewport`| **5900** (VNC)           | Native C/mpv wall (profile: native)  |

---

## Adding Cameras (Web UI)

1. Click **Add Camera** in the top bar.
2. Choose protocol:
   - **WebRTC via go2rtc** — enter the stream name from `go2rtc.yaml`
   - **WebRTC via mediamtx** — enter the path from `mediamtx.yml`
   - **HLS** — full URL e.g. `http://localhost:8888/cam_front/index.m3u8`
   - **MJPEG** — direct camera MJPEG URL
   - **HTTP iframe** — any embeddable HTTP stream
3. Optionally enter an auth token.
4. Select grid layout (1×1 → 4×4) from the top-right dropdown.

---

## go2rtc — Adding Streams

Edit [`go2rtc/go2rtc.yaml`](go2rtc/go2rtc.yaml):

```yaml
streams:
  my_camera:
    - rtsp://admin:pass@192.168.1.x:554/stream
```

Then in the web UI use `my_camera` as the stream name with **WebRTC via go2rtc**.

WHEP URL (direct): `https://your-host/go2rtc/api/whep?src=my_camera`

---

## mediamtx — Adding Streams / Protocols

Edit [`mediamtx/mediamtx.yml`](mediamtx/mediamtx.yml) `paths:` section.  
Cameras can **push** via RTMP/RTSP/WHIP or mediamtx can **pull** from a source URL.

| Ingest method        | URL                                           |
|---------------------|-----------------------------------------------|
| RTSP push           | `rtsp://localhost:8554/<path>`                |
| RTMP push           | `rtmp://localhost:1935/<path>`                |
| WHIP (WebRTC push)  | `http://localhost:8889/<path>`                |

| Playback method     | URL                                            |
|--------------------|------------------------------------------------|
| HLS                | `http://localhost:8888/<path>/index.m3u8`      |
| WebRTC WHEP        | `http://localhost:8889/<path>`                 |
| RTSP pull          | `rtsp://localhost:8554/<path>`                 |

---

## camviewport Native Client (X11/mpv)

The original C-based video wall runs headless via Xvfb and exposes a VNC display.

```bash
# Start with the native profile
docker compose --profile native up camviewport

# Connect via VNC viewer at localhost:5900
# Default password: camviewport  (change VNC_PASSWORD in .env)
```

Edit [`camviewport/camviewport.ini`](camviewport/camviewport.ini) to configure streams and key bindings. All standard `camviewport` options apply.

---

## Tauri Desktop Client

Build a native desktop app (.AppImage / .deb on Linux) that wraps the same React video wall:

```bash
# Option A — Docker build (Linux targets only)
docker build -f Dockerfile.tauri -t camviewport-tauri-builder .
docker run --rm \
  -v "$(pwd)/src-tauri/target:/app/src-tauri/target" \
  camviewport-tauri-builder

# Artefacts: src-tauri/target/release/bundle/

# Option B — Local build (requires Rust + Tauri CLI + system WebKit deps)
cargo install tauri-cli --version "^2"
cargo tauri build
```

> **macOS builds** must be done on macOS. **Windows cross-compilation** requires additional toolchains — build natively on Windows or use GitHub Actions.

The Tauri app auto-connects to `http://localhost:1984` (go2rtc) and `http://localhost:8888` (mediamtx) by default. Override via environment variables:

```bash
GO2RTC_BASE_URL=http://192.168.1.10:1984 \
MEDIAMTX_BASE_URL=http://192.168.1.10:8888 \
./camviewport
```

---

## Authentication

| Backend   | Method                  | Configuration                                |
|-----------|-------------------------|----------------------------------------------|
| go2rtc    | Token (query param)     | `api.token` in `go2rtc.yaml` → `?token=...` |
| mediamtx  | Internal username/pass  | `authInternalUsers` in `mediamtx.yml`        |
| Nginx     | TLS only (self-signed)  | Upgrade to Let's Encrypt by replacing certs  |

---

## File Structure

```
├── Dockerfile               # Web (Nginx + React SPA)
├── Dockerfile.camviewport   # Native C/mpv wall (Xvfb + VNC)
├── Dockerfile.tauri         # Tauri desktop build environment
├── docker-compose.yml
├── .env.example
├── nginx/
│   ├── nginx.conf
│   └── entrypoint.sh        # Auto-generates self-signed cert
├── go2rtc/
│   └── go2rtc.yaml
├── mediamtx/
│   └── mediamtx.yml
├── camviewport/
│   ├── camviewport.ini
│   └── supervisord.conf
├── src/                     # React/Vite frontend
│   ├── pages/Index.tsx      # Video wall grid
│   ├── components/
│   │   ├── CameraTile.tsx   # WebRTC/HLS/MJPEG player tile
│   │   └── AddCameraDialog.tsx
│   └── index.css
└── src-tauri/               # Tauri desktop wrapper
    ├── tauri.conf.json
    ├── Cargo.toml
    ├── build.rs
    └── src/
        ├── main.rs
        └── lib.rs
```

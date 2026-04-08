import { useRef, useEffect, useState, useCallback } from "react";
import Hls from "hls.js";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Maximize2, Minimize2, Settings, Trash2, AlertCircle, RefreshCw, Wifi, Radio, Monitor } from "lucide-react";
import type { Camera } from "@/pages/Index";

interface CameraTileProps {
  camera: Camera;
  isFullscreen: boolean;
  onFullscreen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

type StreamState = "connecting" | "playing" | "error" | "stalled";

const PROTOCOL_LABELS: Record<Camera["protocol"], { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  "webrtc-go2rtc":   { label: "WebRTC·go2rtc",   color: "bg-blue-900 text-blue-300 border-blue-800",   Icon: Wifi },
  "webrtc-mediamtx": { label: "WebRTC·mediamtx", color: "bg-sky-900 text-sky-300 border-sky-800",     Icon: Wifi },
  "hls":             { label: "HLS",              color: "bg-orange-900 text-orange-300 border-orange-800", Icon: Radio },
  "mjpeg":           { label: "MJPEG",            color: "bg-purple-900 text-purple-300 border-purple-800", Icon: Monitor },
  "iframe":          { label: "HTTP",             color: "bg-zinc-800 text-zinc-400 border-zinc-700",   Icon: Monitor },
};

// ──────────────────────────────────────────────
// WebRTC via go2rtc WHEP
// ──────────────────────────────────────────────
async function startWhepSession(
  videoEl: HTMLVideoElement,
  whepUrl: string,
  onState: (s: StreamState) => void,
  signal: AbortSignal
): Promise<RTCPeerConnection | null> {
  try {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (e) => {
      if (e.streams[0]) {
        videoEl.srcObject = e.streams[0];
        onState("playing");
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        onState("error");
      }
    };

    pc.addTransceiver("video", { direction: "recvonly" });
    pc.addTransceiver("audio", { direction: "recvonly" });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const resp = await fetch(whepUrl, {
      method: "POST",
      headers: { "Content-Type": "application/sdp" },
      body: offer.sdp,
      signal,
    });

    if (!resp.ok) throw new Error(`WHEP ${resp.status}`);
    const answerSdp = await resp.text();
    await pc.setRemoteDescription({ type: "answer", sdp: answerSdp });
    return pc;
  } catch (err: unknown) {
    if ((err as Error)?.name !== "AbortError") onState("error");
    return null;
  }
}

// ──────────────────────────────────────────────
// HLS via hls.js
// ──────────────────────────────────────────────
function useHlsPlayer(videoRef: React.RefObject<HTMLVideoElement>, url: string, enabled: boolean, onState: (s: StreamState) => void) {
  useEffect(() => {
    if (!enabled || !videoRef.current) return;
    const video = videoRef.current;

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native HLS (Safari / iOS)
      video.src = url;
      video.oncanplay = () => onState("playing");
      video.onerror = () => onState("error");
      return () => { video.src = ""; };
    }

    if (!Hls.isSupported()) { onState("error"); return; }

    const hls = new Hls({ lowLatencyMode: true, liveSyncDurationCount: 1 });
    hls.loadSource(url);
    hls.attachMedia(video);
    hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); onState("playing"); });
    hls.on(Hls.Events.ERROR, (_e, data) => { if (data.fatal) onState("error"); });

    return () => { hls.destroy(); };
  }, [enabled, url, videoRef, onState]);
}

// ──────────────────────────────────────────────
// CameraTile Component
// ──────────────────────────────────────────────
export function CameraTile({ camera, isFullscreen, onFullscreen, onEdit, onDelete }: CameraTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [state, setState] = useState<StreamState>("connecting");
  const [hover, setHover] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const protocol = camera.protocol;
  const meta = PROTOCOL_LABELS[protocol];

  const handleState = useCallback((s: StreamState) => setState(s), []);

  // ── WebRTC setup ──────────────────────────────
  useEffect(() => {
    if (protocol !== "webrtc-go2rtc" && protocol !== "webrtc-mediamtx") return;
    if (!videoRef.current) return;

    setState("connecting");
    const ctrl = new AbortController();

    let whepUrl: string;
    if (protocol === "webrtc-go2rtc") {
      // go2rtc WHEP: /api/whep?src={streamName}
      const base = (window as any).__GO2RTC_BASE__ || "/go2rtc";
      whepUrl = `${base}/api/whep?src=${encodeURIComponent(camera.streamUrl)}`;
      if (camera.token) whepUrl += `&token=${encodeURIComponent(camera.token)}`;
    } else {
      // mediamtx WHEP: /mediamtx/{streamName}/whep
      const base = (window as any).__MEDIAMTX_BASE__ || "/mediamtx";
      whepUrl = `${base}/${encodeURIComponent(camera.streamUrl)}/whep`;
    }

    startWhepSession(videoRef.current, whepUrl, handleState, ctrl.signal).then(pc => {
      pcRef.current = pc;
    });

    return () => {
      ctrl.abort();
      pcRef.current?.close();
      pcRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [protocol, camera.streamUrl, camera.token, retryKey, handleState]);

  // ── HLS setup ─────────────────────────────────
  useHlsPlayer(videoRef, camera.streamUrl, protocol === "hls", handleState);

  // ── MJPEG auto-playing ────────────────────────
  useEffect(() => {
    if (protocol === "mjpeg") setState("playing");
  }, [protocol]);

  const retry = () => {
    setState("connecting");
    setRetryKey(k => k + 1);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = "";
    }
  };

  const statusDot = state === "playing" ? "bg-green-500" : state === "connecting" ? "bg-yellow-500 animate-pulse" : "bg-red-500";

  return (
    <div
      className="relative bg-black rounded overflow-hidden group border border-zinc-900 hover:border-zinc-700 transition-colors"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* Video / MJPEG / iframe */}
      {protocol === "mjpeg" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`${camera.streamUrl}${camera.token ? `?token=${camera.token}` : ""}`}
          alt={camera.name}
          className="w-full h-full object-contain absolute inset-0"
          onLoad={() => setState("playing")}
          onError={() => setState("error")}
        />
      ) : protocol === "iframe" ? (
        <iframe
          src={camera.streamUrl}
          className="w-full h-full absolute inset-0 border-0"
          allow="autoplay; fullscreen"
          title={camera.name}
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-contain absolute inset-0"
          onCanPlay={() => handleState("playing")}
          onError={() => handleState("error")}
          onStalled={() => handleState("stalled")}
          onPlaying={() => handleState("playing")}
        />
      )}

      {/* Connecting overlay */}
      {state === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
          <div className="text-center">
            <RefreshCw className="h-6 w-6 text-zinc-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-zinc-500">Connecting…</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90">
          <div className="text-center">
            <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
            <p className="text-xs text-red-400 mb-3">Stream unavailable</p>
            <Button size="sm" variant="outline" className="h-6 text-xs border-zinc-700 bg-zinc-900 hover:bg-zinc-800" onClick={retry}>
              <RefreshCw className="h-3 w-3 mr-1" /> Retry
            </Button>
          </div>
        </div>
      )}

      {/* Top overlay: name + protocol */}
      <div className={`absolute top-0 inset-x-0 flex items-start justify-between p-2 transition-opacity duration-200 bg-gradient-to-b from-black/70 to-transparent ${hover || state !== "playing" ? "opacity-100" : "opacity-0"}`}>
        <div>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full flex-none ${statusDot}`} />
            <p className="text-xs font-medium text-white leading-none">{camera.name}</p>
          </div>
          {camera.location && (
            <p className="text-[10px] text-zinc-400 mt-0.5 ml-3">{camera.location}</p>
          )}
        </div>
        <Badge variant="outline" className={`text-[10px] py-0 h-4 border ${meta.color} ml-2 flex-none`}>
          <meta.Icon className="h-2.5 w-2.5 mr-1" />
          {meta.label}
        </Badge>
      </div>

      {/* Bottom overlay: controls */}
      <div className={`absolute bottom-0 inset-x-0 flex items-center justify-end gap-1 p-1.5 transition-opacity duration-200 bg-gradient-to-t from-black/70 to-transparent ${hover ? "opacity-100" : "opacity-0"}`}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-white/10" onClick={retry}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs">Reconnect</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-white/10" onClick={onEdit}>
              <Settings className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs">Edit camera</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-red-400 hover:bg-white/10" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs">Remove</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-white hover:bg-white/10" onClick={onFullscreen}>
              {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs">{isFullscreen ? "Exit fullscreen" : "Fullscreen"}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

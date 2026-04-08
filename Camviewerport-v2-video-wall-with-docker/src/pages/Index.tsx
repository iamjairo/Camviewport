import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Plus, Settings, Maximize2, Grid2x2, Grid3x3, LayoutGrid,
  Radio, Wifi, Camera, RefreshCw, Monitor, Square, FileCode2
} from "lucide-react";
import { CameraTile } from "@/components/CameraTile";
import { AddCameraDialog } from "@/components/AddCameraDialog";
import { ConfigExportDialog } from "@/components/ConfigExportDialog";
import { toast } from "sonner";

export type StreamProtocol = "webrtc-go2rtc" | "webrtc-mediamtx" | "hls" | "mjpeg" | "iframe";

export interface Camera {
  id: string;
  name: string;
  location: string;
  protocol: StreamProtocol;
  streamUrl: string;
  sourceUrl?: string;   // raw RTSP/RTMP source — used for config generation
  token?: string;
  enabled: boolean;
}

export type GridLayout = "1x1" | "2x2" | "3x3" | "4x4" | "2x3" | "3x4";

const GRID_CONFIGS: Record<GridLayout, { cols: number; rows: number; label: string; icon?: React.ReactNode }> = {
  "1x1": { cols: 1, rows: 1, label: "1×1 — Single" },
  "2x2": { cols: 2, rows: 2, label: "2×2 — Quad" },
  "2x3": { cols: 3, rows: 2, label: "2×3 — Six" },
  "3x3": { cols: 3, rows: 3, label: "3×3 — Nine" },
  "3x4": { cols: 4, rows: 3, label: "3×4 — Twelve" },
  "4x4": { cols: 4, rows: 4, label: "4×4 — Sixteen" },
};

const DEMO_CAMERAS: Camera[] = [
  { id: "demo-1", name: "Front Entrance", location: "Building A", protocol: "webrtc-go2rtc", streamUrl: "cam_front", enabled: true },
  { id: "demo-2", name: "Parking Lot", location: "Exterior", protocol: "hls", streamUrl: "http://localhost:8888/cam_parking/index.m3u8", enabled: true },
  { id: "demo-3", name: "Lobby", location: "Building A", protocol: "webrtc-mediamtx", streamUrl: "cam_lobby", enabled: true },
  { id: "demo-4", name: "Server Room", location: "Building B", protocol: "mjpeg", streamUrl: "http://localhost:8888/cam_server/stream.mjpeg", enabled: true },
];

const STORAGE_KEY = "camviewport_cameras";
const LAYOUT_KEY = "camviewport_layout";

export default function Index() {
  const [cameras, setCameras] = useState<Camera[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEMO_CAMERAS;
    } catch { return DEMO_CAMERAS; }
  });

  const [layout, setLayout] = useState<GridLayout>(() => {
    return (localStorage.getItem(LAYOUT_KEY) as GridLayout) || "2x2";
  });

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editCamera, setEditCamera] = useState<Camera | null>(null);
  const [fullscreenCamera, setFullscreenCamera] = useState<Camera | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [configExportOpen, setConfigExportOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cameras));
  }, [cameras]);

  useEffect(() => {
    localStorage.setItem(LAYOUT_KEY, layout);
  }, [layout]);

  const handleAddCamera = useCallback((cam: Omit<Camera, "id">) => {
    const newCam: Camera = { ...cam, id: `cam-${Date.now()}` };
    setCameras(prev => [...prev, newCam]);
    toast.success(`Camera "${cam.name}" added`);
  }, []);

  const handleEditCamera = useCallback((cam: Camera) => {
    setCameras(prev => prev.map(c => c.id === cam.id ? cam : c));
    toast.success(`Camera "${cam.name}" updated`);
  }, []);

  const handleDeleteCamera = useCallback((id: string) => {
    setCameras(prev => {
      const cam = prev.find(c => c.id === id);
      if (cam) toast.info(`Camera "${cam.name}" removed`);
      return prev.filter(c => c.id !== id);
    });
    if (fullscreenCamera?.id === id) setFullscreenCamera(null);
  }, [fullscreenCamera]);

  const handleToggleCamera = useCallback((id: string) => {
    setCameras(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  }, []);

  const handleRefreshAll = () => {
    setRefreshKey(k => k + 1);
    toast.info("Refreshing all streams…");
  };

  const { cols } = GRID_CONFIGS[layout];
  const activeCameras = cameras.filter(c => c.enabled);
  const slots = fullscreenCamera
    ? [fullscreenCamera]
    : activeCameras.slice(0, cols * GRID_CONFIGS[layout].rows);

  const protocolStats = {
    webrtc: cameras.filter(c => c.protocol.startsWith("webrtc")).length,
    hls: cameras.filter(c => c.protocol === "hls").length,
    mjpeg: cameras.filter(c => c.protocol === "mjpeg").length,
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Topbar */}
      <header className="flex-none flex items-center justify-between px-4 h-12 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-sm tracking-tight text-zinc-100">CamViewport</span>
          </div>
          <Separator orientation="vertical" className="h-4 bg-zinc-700" />
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs py-0 h-5">
              <Wifi className="h-3 w-3 mr-1 text-green-400" />
              {protocolStats.webrtc} WebRTC
            </Badge>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs py-0 h-5">
              <Radio className="h-3 w-3 mr-1 text-orange-400" />
              {protocolStats.hls} HLS
            </Badge>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs py-0 h-5">
              <Monitor className="h-3 w-3 mr-1 text-purple-400" />
              {protocolStats.mjpeg} MJPEG
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fullscreenCamera ? (
            <Button size="sm" variant="outline" className="h-7 text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700" onClick={() => setFullscreenCamera(null)}>
              <Square className="h-3 w-3 mr-1" /> Exit Fullscreen
            </Button>
          ) : (
            <Select value={layout} onValueChange={(v) => setLayout(v as GridLayout)}>
              <SelectTrigger className="h-7 w-36 text-xs border-zinc-700 bg-zinc-800 text-zinc-200">
                <LayoutGrid className="h-3 w-3 mr-1.5 text-zinc-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                {Object.entries(GRID_CONFIGS).map(([key, cfg]) => (
                  <SelectItem key={key} value={key} className="text-xs focus:bg-zinc-800">
                    {cfg.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800" onClick={handleRefreshAll}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs">Refresh all streams</TooltipContent>
          </Tooltip>

          <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500 text-white border-0 gap-1" onClick={() => { setEditCamera(null); setAddDialogOpen(true); }}>
            <Plus className="h-3 w-3" /> Add Camera
          </Button>

          {/* Settings Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="h-7 w-7 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-900 border-zinc-800 text-zinc-100 w-[380px]">
              <SheetHeader>
                <SheetTitle className="text-zinc-100 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-blue-400" /> Camera Management
                </SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-2">
                {cameras.length === 0 ? (
                  <p className="text-zinc-500 text-sm text-center py-8">No cameras configured.</p>
                ) : (
                  cameras.map(cam => (
                    <div key={cam.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800 border border-zinc-700">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`h-1.5 w-1.5 rounded-full flex-none ${cam.enabled ? "bg-green-400" : "bg-zinc-600"}`} />
                          <p className="text-sm font-medium text-zinc-100 truncate">{cam.name}</p>
                        </div>
                        <p className="text-xs text-zinc-500 ml-3.5 mt-0.5 truncate">{cam.location} · {cam.protocol}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-none">
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-zinc-100" onClick={() => { setEditCamera(cam); setAddDialogOpen(true); }}>
                          <Settings className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-400 hover:text-blue-400" onClick={() => handleToggleCamera(cam.id)}>
                          {cam.enabled ? <Square className="h-3 w-3" /> : <Grid2x2 className="h-3 w-3" />}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Button className="w-full mt-2 h-8 text-xs bg-blue-600 hover:bg-blue-500 border-0 gap-1" onClick={() => { setEditCamera(null); setAddDialogOpen(true); }}>
                  <Plus className="h-3 w-3" /> Add Camera
                </Button>
              </div>

              <Separator className="my-6 bg-zinc-800" />
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wide">Stream Backends</h3>
                <div className="space-y-2">
                  <BackendStatusRow label="go2rtc" port="1984" color="blue" hint="WebRTC / RTSP / RTMP / HTTP" />
                  <BackendStatusRow label="mediamtx" port="8554/8888/8889" color="orange" hint="RTSP / RTMP / HLS / WebRTC / SRT" />
                  <BackendStatusRow label="nginx" port="443" color="green" hint="Reverse proxy + TLS termination" />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Video Wall Grid */}
      <main className="flex-1 overflow-hidden p-1.5 bg-black">
        {activeCameras.length === 0 ? (
          <EmptyState onAdd={() => { setEditCamera(null); setAddDialogOpen(true); }} />
        ) : (
          <div
            className="h-full w-full grid gap-1"
            style={{
              gridTemplateColumns: fullscreenCamera ? "1fr" : `repeat(${cols}, 1fr)`,
              gridTemplateRows: fullscreenCamera ? "1fr" : `repeat(${GRID_CONFIGS[layout].rows}, 1fr)`,
            }}
          >
            {slots.map((cam) => (
              <CameraTile
                key={`${cam.id}-${refreshKey}`}
                camera={cam}
                isFullscreen={fullscreenCamera?.id === cam.id}
                onFullscreen={() => setFullscreenCamera(fullscreenCamera?.id === cam.id ? null : cam)}
                onEdit={() => { setEditCamera(cam); setAddDialogOpen(true); }}
                onDelete={() => handleDeleteCamera(cam.id)}
              />
            ))}
            {/* Fill empty slots with placeholder */}
            {!fullscreenCamera && Array.from({ length: Math.max(0, cols * GRID_CONFIGS[layout].rows - slots.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-zinc-900 rounded border border-zinc-800 border-dashed flex items-center justify-center cursor-pointer hover:border-blue-800 hover:bg-zinc-900/80 transition-colors group" onClick={() => { setEditCamera(null); setAddDialogOpen(true); }}>
                <div className="text-center">
                  <Plus className="h-5 w-5 text-zinc-700 group-hover:text-zinc-500 mx-auto mb-1 transition-colors" />
                  <p className="text-xs text-zinc-700 group-hover:text-zinc-500 transition-colors">Add camera</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Status Bar */}
      <footer className="flex-none flex items-center justify-between px-4 h-6 bg-zinc-900/90 border-t border-zinc-800 text-zinc-600 text-[11px]">
        <span>{cameras.length} camera{cameras.length !== 1 ? "s" : ""} · {activeCameras.length} active</span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Live
        </span>
        <span>CamViewport · go2rtc + mediamtx</span>
      </footer>

      <AddCameraDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        initialCamera={editCamera}
        onSave={editCamera ? (cam) => handleEditCamera({ ...cam, id: editCamera.id }) : handleAddCamera}
        onDelete={editCamera ? () => { handleDeleteCamera(editCamera.id); setAddDialogOpen(false); } : undefined}
      />
    </div>
  );
}

function BackendStatusRow({ label, port, color, hint }: { label: string; port: string; color: string; hint: string }) {
  const colors: Record<string, string> = { blue: "text-blue-400 bg-blue-950 border-blue-900", orange: "text-orange-400 bg-orange-950 border-orange-900", green: "text-green-400 bg-green-950 border-green-900" };
  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg border ${colors[color]}`}>
      <div>
        <p className="text-xs font-semibold">{label}</p>
        <p className="text-[10px] opacity-70 mt-0.5">{hint}</p>
      </div>
      <code className="text-[10px] opacity-60">:{port}</code>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center">
        <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto mb-4">
          <Camera className="h-7 w-7 text-zinc-600" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-300 mb-1">No cameras configured</h2>
        <p className="text-sm text-zinc-600 max-w-xs mb-6">
          Add your go2rtc or mediamtx streams to start your video wall. Supports WebRTC, HLS, MJPEG, RTSP and RTMP.
        </p>
        <Button onClick={onAdd} className="bg-blue-600 hover:bg-blue-500 border-0 gap-2">
          <Plus className="h-4 w-4" /> Add first camera
        </Button>
      </div>
    </div>
  );
}

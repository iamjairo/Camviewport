import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Pencil, Eye, EyeOff, Trash2, Plus, Search, X,
  Wifi, Radio, Monitor, GripVertical, CheckCircle2
} from "lucide-react";
import type { Camera, StreamProtocol } from "@/pages/Index";

interface CameraManagementPanelProps {
  cameras: Camera[];
  onEdit: (cam: Camera) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onAdd: () => void;
  onReorder: (cameras: Camera[]) => void;
}

const PROTOCOL_META: Record<StreamProtocol, { label: string; color: string; Icon: React.FC<{ className?: string }> }> = {
  "webrtc-go2rtc":   { label: "WebRTC·go2rtc",   color: "border-blue-800 text-blue-400 bg-blue-950/40",    Icon: Wifi },
  "webrtc-mediamtx": { label: "WebRTC·mediamtx", color: "border-sky-800 text-sky-400 bg-sky-950/40",       Icon: Wifi },
  "hls":             { label: "HLS",              color: "border-orange-800 text-orange-400 bg-orange-950/40", Icon: Radio },
  "mjpeg":           { label: "MJPEG",            color: "border-purple-800 text-purple-400 bg-purple-950/40", Icon: Monitor },
  "iframe":          { label: "HTTP",             color: "border-zinc-700 text-zinc-400 bg-zinc-800",        Icon: Monitor },
};

export function CameraManagementPanel({
  cameras, onEdit, onDelete, onToggle, onAdd, onReorder,
}: CameraManagementPanelProps) {
  const [search, setSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const filtered = cameras.filter(
    c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.location.toLowerCase().includes(search.toLowerCase()) ||
      c.protocol.toLowerCase().includes(search.toLowerCase())
  );

  // ── Drag-to-reorder helpers ──────────────────────────────────────
  const handleDragStart = (id: string) => setDraggedId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) setDragOverId(id);
  };
  const handleDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) { resetDrag(); return; }
    const from = cameras.findIndex(c => c.id === draggedId);
    const to = cameras.findIndex(c => c.id === targetId);
    if (from === -1 || to === -1) { resetDrag(); return; }
    const reordered = [...cameras];
    const [moved] = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    onReorder(reordered);
    resetDrag();
  };
  const resetDrag = () => { setDraggedId(null); setDragOverId(null); };

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search cameras…"
          className="h-8 text-xs pl-8 pr-7 bg-zinc-800 border-zinc-700 text-zinc-200 placeholder:text-zinc-600 focus-visible:ring-blue-600"
        />
        {search && (
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            onClick={() => setSearch("")}
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 text-[11px] text-zinc-500">
        <span>{cameras.length} camera{cameras.length !== 1 ? "s" : ""}</span>
        <span>·</span>
        <span className="text-green-400">{cameras.filter(c => c.enabled).length} active</span>
        <span>·</span>
        <span className="text-zinc-600">{cameras.filter(c => !c.enabled).length} disabled</span>
      </div>

      {/* Camera list */}
      {filtered.length === 0 ? (
        <div className="py-10 text-center">
          {search ? (
            <p className="text-zinc-500 text-sm">No cameras match "{search}"</p>
          ) : (
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto">
                <Plus className="h-5 w-5 text-zinc-600" />
              </div>
              <p className="text-zinc-500 text-sm">No cameras yet</p>
              <Button size="sm" className="h-7 text-xs bg-blue-600 hover:bg-blue-500 border-0 gap-1" onClick={onAdd}>
                <Plus className="h-3 w-3" /> Add your first camera
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map(cam => {
            const meta = PROTOCOL_META[cam.protocol];
            const isDragging = draggedId === cam.id;
            const isDragOver = dragOverId === cam.id;
            const isConfirmingDelete = confirmDeleteId === cam.id;

            return (
              <div
                key={cam.id}
                draggable
                onDragStart={() => handleDragStart(cam.id)}
                onDragOver={e => handleDragOver(e, cam.id)}
                onDrop={() => handleDrop(cam.id)}
                onDragEnd={resetDrag}
                className={`
                  rounded-lg border transition-all duration-150
                  ${isDragOver ? "border-blue-600 bg-blue-950/20" : "border-zinc-700 bg-zinc-800"}
                  ${isDragging ? "opacity-40 scale-[0.98]" : "opacity-100"}
                  ${!cam.enabled ? "opacity-60" : ""}
                `}
              >
                {/* Main row */}
                <div className="flex items-center gap-2 p-2.5">
                  {/* Drag handle */}
                  <GripVertical className="h-3.5 w-3.5 text-zinc-600 cursor-grab flex-none hover:text-zinc-400 transition-colors" />

                  {/* Status dot */}
                  <span className={`h-1.5 w-1.5 rounded-full flex-none ${cam.enabled ? "bg-green-400" : "bg-zinc-600"}`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-medium truncate leading-none ${cam.enabled ? "text-zinc-100" : "text-zinc-400"}`}>
                        {cam.name}
                      </p>
                    </div>
                    {cam.location && (
                      <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{cam.location}</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-0.5 truncate font-mono">
                      {cam.streamUrl.length > 32 ? cam.streamUrl.slice(0, 32) + "…" : cam.streamUrl}
                    </p>
                  </div>

                  {/* Protocol badge */}
                  <Badge variant="outline" className={`text-[9px] py-0 h-4 border flex-none hidden sm:flex ${meta.color}`}>
                    <meta.Icon className="h-2 w-2 mr-0.5" />
                    {cam.protocol.startsWith("webrtc") ? "WebRTC" : meta.label}
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 flex-none ml-1">
                    <button
                      title={cam.enabled ? "Disable" : "Enable"}
                      onClick={() => onToggle(cam.id)}
                      className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                        cam.enabled
                          ? "text-green-400 hover:text-zinc-400 hover:bg-zinc-700"
                          : "text-zinc-600 hover:text-green-400 hover:bg-zinc-700"
                      }`}
                    >
                      {cam.enabled ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    </button>
                    <button
                      title="Edit camera"
                      onClick={() => { setConfirmDeleteId(null); onEdit(cam); }}
                      className="h-6 w-6 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-100 hover:bg-zinc-700 transition-colors"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      title="Delete camera"
                      onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : cam.id)}
                      className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
                        isConfirmingDelete
                          ? "text-red-400 bg-red-950/40"
                          : "text-zinc-500 hover:text-red-400 hover:bg-zinc-700"
                      }`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Inline delete confirmation */}
                {isConfirmingDelete && (
                  <div className="border-t border-zinc-700/60 px-2.5 py-2 flex items-center justify-between bg-red-950/20">
                    <p className="text-[11px] text-red-400">Remove <span className="font-medium">{cam.name}</span>?</p>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-5 text-[10px] text-zinc-400 hover:text-zinc-200 px-2"
                        onClick={() => setConfirmDeleteId(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-5 text-[10px] bg-red-600 hover:bg-red-500 text-white border-0 px-2 gap-1"
                        onClick={() => { onDelete(cam.id); setConfirmDeleteId(null); }}
                      >
                        <CheckCircle2 className="h-2.5 w-2.5" /> Confirm
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add camera CTA */}
      {cameras.length > 0 && (
        <Button
          className="w-full h-8 text-xs bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 border-dashed text-zinc-400 hover:text-zinc-100 gap-1.5"
          variant="ghost"
          onClick={onAdd}
        >
          <Plus className="h-3 w-3" /> Add camera
        </Button>
      )}

      <Separator className="bg-zinc-800" />

      {/* Tip */}
      <p className="text-[10px] text-zinc-600 text-center">
        Drag <GripVertical className="h-2.5 w-2.5 inline-block -mt-0.5 mx-0.5" /> to reorder · Click <Eye className="h-2.5 w-2.5 inline-block -mt-0.5 mx-0.5" /> to show/hide from wall
      </p>
    </div>
  );
}

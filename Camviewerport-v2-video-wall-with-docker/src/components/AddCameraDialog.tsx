import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Trash2, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Camera, StreamProtocol } from "@/pages/Index";

interface AddCameraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCamera: Camera | null;
  onSave: (cam: Omit<Camera, "id">) => void;
  onDelete?: () => void;
}

const PROTOCOL_OPTIONS: { value: StreamProtocol; label: string; hint: string; placeholder: string }[] = [
  { value: "webrtc-go2rtc",   label: "WebRTC via go2rtc",   hint: "Stream name registered in go2rtc.yaml", placeholder: "cam_front" },
  { value: "webrtc-mediamtx", label: "WebRTC via mediamtx", hint: "MediaMTX path/stream name (WHEP)",      placeholder: "cam_parking" },
  { value: "hls",             label: "HLS (mediamtx / m3u8)",hint: "Full HLS .m3u8 playlist URL",          placeholder: "http://localhost:8888/cam_lobby/index.m3u8" },
  { value: "mjpeg",           label: "MJPEG",               hint: "Full MJPEG stream URL",                 placeholder: "http://192.168.1.100/video.cgi" },
  { value: "iframe",          label: "HTTP iframe",         hint: "Any embeddable HTTP stream URL",        placeholder: "http://192.168.1.100:8080/stream.html" },
];

type FormValues = Omit<Camera, "id"> & { sourceUrl?: string };

export function AddCameraDialog({ open, onOpenChange, initialCamera, onSave, onDelete }: AddCameraDialogProps) {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      name: "",
      location: "",
      protocol: "webrtc-go2rtc",
      streamUrl: "",
      sourceUrl: "",
      token: "",
      enabled: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(initialCamera ? {
        name: initialCamera.name,
        location: initialCamera.location,
        protocol: initialCamera.protocol,
        streamUrl: initialCamera.streamUrl,
        sourceUrl: initialCamera.sourceUrl || "",
        token: initialCamera.token || "",
        enabled: initialCamera.enabled,
      } : {
        name: "",
        location: "",
        protocol: "webrtc-go2rtc",
        streamUrl: "",
        sourceUrl: "",
        token: "",
        enabled: true,
      });
    }
  }, [open, initialCamera, reset]);

  const selectedProtocol = watch("protocol");
  const protoMeta = PROTOCOL_OPTIONS.find(p => p.value === selectedProtocol);

  const onSubmit = (data: FormValues) => {
    onSave(data);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-zinc-100">{initialCamera ? "Edit Camera" : "Add Camera"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Camera Name *</Label>
              <Input
                {...register("name", { required: true })}
                placeholder="Front Entrance"
                className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-600"
              />
              {errors.name && <p className="text-[11px] text-red-400">Required</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-zinc-400">Location</Label>
              <Input
                {...register("location")}
                placeholder="Building A"
                className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-blue-600"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Protocol</Label>
            <Select value={selectedProtocol} onValueChange={(v) => setValue("protocol", v as StreamProtocol)}>
              <SelectTrigger className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-700 text-zinc-200">
                {PROTOCOL_OPTIONS.map(opt => (
                  <SelectItem key={opt.value} value={opt.value} className="text-sm focus:bg-zinc-800">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {protoMeta && (
              <p className="text-[11px] text-zinc-500">{protoMeta.hint}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">
              {selectedProtocol?.startsWith("webrtc") ? "Stream Name" : "Stream URL"} *
            </Label>
            <Input
              {...register("streamUrl", { required: true })}
              placeholder={protoMeta?.placeholder}
              className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono focus-visible:ring-blue-600"
            />
            {errors.streamUrl && <p className="text-[11px] text-red-400">Required</p>}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs text-zinc-400">Source URL <span className="text-zinc-600">(optional — for config export)</span></Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-zinc-600 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 border-zinc-700 text-xs max-w-56">
                  Raw RTSP/RTMP input URL. Used to auto-generate go2rtc.yaml and mediamtx.yml via Export Config.
                </TooltipContent>
              </Tooltip>
            </div>
            <Input
              {...register("sourceUrl")}
              placeholder="rtsp://192.168.1.x:554/stream"
              className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono focus-visible:ring-blue-600"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-zinc-400">Auth Token <span className="text-zinc-600">(optional)</span></Label>
            <Input
              {...register("token")}
              placeholder="your-secret-token"
              type="password"
              className="h-8 text-sm bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 font-mono focus-visible:ring-blue-600"
            />
            <p className="text-[11px] text-zinc-500">go2rtc / mediamtx token-based auth</p>
          </div>

          <Separator className="bg-zinc-800" />

          {/* Protocol reference */}
          <div className="rounded-lg bg-zinc-800/60 border border-zinc-700/50 p-3 space-y-1.5">
            <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">Backend Reference</p>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="text-[10px] border-blue-900 text-blue-400 bg-blue-950/40">go2rtc :1984</Badge>
              <Badge variant="outline" className="text-[10px] border-orange-900 text-orange-400 bg-orange-950/40">mediamtx RTSP :8554</Badge>
              <Badge variant="outline" className="text-[10px] border-orange-900 text-orange-400 bg-orange-950/40">mediamtx RTMP :1935</Badge>
              <Badge variant="outline" className="text-[10px] border-orange-900 text-orange-400 bg-orange-950/40">mediamtx HLS :8888</Badge>
              <Badge variant="outline" className="text-[10px] border-sky-900 text-sky-400 bg-sky-950/40">mediamtx WebRTC :8889</Badge>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            {onDelete && (
              <Button type="button" variant="ghost" size="sm" className="text-red-400 hover:text-red-300 hover:bg-red-950/30 mr-auto" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
              </Button>
            )}
            <Button type="button" variant="ghost" size="sm" className="text-zinc-400 hover:text-zinc-200" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-500 border-0">
              {initialCamera ? "Save Changes" : "Add Camera"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

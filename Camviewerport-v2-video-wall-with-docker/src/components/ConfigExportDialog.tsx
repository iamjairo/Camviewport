import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Copy, Download, Check, AlertTriangle, FileCode2 } from "lucide-react";
import { toast } from "sonner";
import { generateGo2rtcConfig, generateMediamtxConfig } from "@/lib/configGenerator";
import type { Camera } from "@/pages/Index";

interface ConfigExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cameras: Camera[];
}

export function ConfigExportDialog({ open, onOpenChange, cameras }: ConfigExportDialogProps) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<"go2rtc" | "mediamtx">("go2rtc");

  const go2rtcConfig = useMemo(() => generateGo2rtcConfig(cameras), [cameras]);
  const mediamtxConfig = useMemo(() => generateMediamtxConfig(cameras), [cameras]);

  const active = tab === "go2rtc" ? go2rtcConfig : mediamtxConfig;
  const missingSource = active.cameras.filter((c) => !c.sourceUrl);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.content);
      setCopied(true);
      toast.success(`${active.filename} copied to clipboard`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Clipboard write failed");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([active.content], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = active.filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${active.filename}`);
  };

  const enabledCameras = cameras.filter((c) => c.enabled);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100 sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-none">
          <DialogTitle className="text-zinc-100 flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-blue-400" /> Export Stream Config
          </DialogTitle>
          <p className="text-xs text-zinc-500 mt-1">
            Auto-generated backend config from your {enabledCameras.length} active camera
            {enabledCameras.length !== 1 ? "s" : ""}. Place this file next to your Docker Compose stack.
          </p>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="flex-none bg-zinc-800 border border-zinc-700 w-fit">
            <TabsTrigger value="go2rtc" className="text-xs data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              go2rtc.yaml
            </TabsTrigger>
            <TabsTrigger value="mediamtx" className="text-xs data-[state=active]:bg-orange-600 data-[state=active]:text-white">
              mediamtx.yml
            </TabsTrigger>
          </TabsList>

          {missingSource.length > 0 && (
            <div className="flex-none mt-3 flex items-start gap-2 rounded-lg bg-amber-950/40 border border-amber-900/60 px-3 py-2.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 flex-none mt-0.5" />
              <div>
                <p className="text-xs font-medium text-amber-300">Source URL missing for {missingSource.length} stream{missingSource.length > 1 ? "s" : ""}</p>
                <p className="text-[11px] text-amber-500 mt-0.5">
                  Edit each camera and set a <strong>Source URL</strong> (e.g. <code className="font-mono">rtsp://192.168.1.x/stream</code>) to generate a complete config.
                  Placeholders are included below.
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {missingSource.map((c) => (
                    <Badge key={c.streamName} variant="outline" className="text-[10px] border-amber-900 text-amber-400 bg-amber-950/30">
                      {c.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <TabsContent value="go2rtc" className="flex-1 min-h-0 mt-3 data-[state=active]:flex flex-col">
            <pre className="flex-1 min-h-0 overflow-auto rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-[11px] leading-5 font-mono text-zinc-300 whitespace-pre">
              {go2rtcConfig.content}
            </pre>
          </TabsContent>

          <TabsContent value="mediamtx" className="flex-1 min-h-0 mt-3 data-[state=active]:flex flex-col">
            <pre className="flex-1 min-h-0 overflow-auto rounded-lg bg-zinc-950 border border-zinc-800 p-3 text-[11px] leading-5 font-mono text-zinc-300 whitespace-pre">
              {mediamtxConfig.content}
            </pre>
          </TabsContent>
        </Tabs>

        <Separator className="flex-none bg-zinc-800 mt-3" />

        <div className="flex-none flex items-center justify-between pt-1">
          <p className="text-[11px] text-zinc-600">
            {active.filename} · {active.cameras.length} stream{active.cameras.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700 gap-1.5"
              onClick={handleCopy}
            >
              {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied!" : "Copy"}
            </Button>
            <Button
              size="sm"
              className="h-7 text-xs bg-blue-600 hover:bg-blue-500 border-0 gap-1.5"
              onClick={handleDownload}
            >
              <Download className="h-3 w-3" /> Download
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

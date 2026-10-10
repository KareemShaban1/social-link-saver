import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function parseCsv(text: string): Array<Record<string, unknown>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    const cols: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cols.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
    cols.push(current);
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      row[h] = (cols[idx] ?? "").trim();
    });
    if (typeof row.tags === "string") {
      row.tags = row.tags
        ? String(row.tags)
            .split("|")
            .map((t) => t.trim())
            .filter(Boolean)
        : [];
    }
    if (typeof row.isFavorite === "string") {
      row.isFavorite = row.isFavorite.toLowerCase() === "true";
    }
    return row;
  });
}

interface ExportImportDialogProps {
  onImported?: () => void;
}

export function ExportImportDialog({ onImported }: ExportImportDialogProps) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async (format: "json" | "csv") => {
    setBusy(true);
    try {
      const result = await api.exportLinks(format);
      if (format === "csv" && "blob" in result && result.blob) {
        downloadBlob(result.blob, result.filename);
      } else if ("json" in result) {
        const blob = new Blob([JSON.stringify(result.json, null, 2)], {
          type: "application/json",
        });
        downloadBlob(blob, result.filename);
      }
      toast({ title: t("common.success"), description: t("library.exportDone") });
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("library.exportFailed"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleImportFile = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      let links: Array<Record<string, unknown>> = [];
      if (file.name.toLowerCase().endsWith(".csv") || file.type.includes("csv")) {
        links = parseCsv(text);
      } else {
        const parsed = JSON.parse(text);
        links = Array.isArray(parsed) ? parsed : parsed.links;
        if (!Array.isArray(links)) {
          throw new Error(t("library.importInvalid"));
        }
      }

      const result = await api.importLinks(links);
      toast({
        title: t("common.success"),
        description: t("library.importDone", {
          imported: result.imported,
          skipped: result.skipped,
        }),
      });
      onImported?.();
      setOpen(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: error instanceof Error ? error.message : t("library.importFailed"),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
          <Upload className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{t("library.exportImport")}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("library.exportImport")}</DialogTitle>
          <DialogDescription>{t("library.exportImportDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>{t("library.export")}</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void handleExport("json")}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => void handleExport("csv")}
                className="gap-1.5"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("library.import")}</Label>
            <p className="text-xs text-muted-foreground">{t("library.importHint")}</p>
            <input
              ref={fileRef}
              type="file"
              accept=".json,.csv,application/json,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleImportFile(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="h-4 w-4" />
              {t("library.chooseFile")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

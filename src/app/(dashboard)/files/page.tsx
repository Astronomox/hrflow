"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudUpload, FolderOpen, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useFiles, useUploadFile, useDeleteFile } from "@/hooks/use-files";
import { useCurrentUser } from "@/hooks/use-current-user";
import { FILE_TYPE_ICONS } from "@/lib/constants";
import { formatFileSize, formatDate, cn } from "@/lib/utils";

function FileGrid({ scope }: { scope: "mine" | "department" | "all" }) {
  const { data, isLoading } = useFiles(scope);
  const deleteFile = useDeleteFile();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const files = data?.data ?? [];

  if (isLoading) return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (files.length === 0) return (
    <EmptyState icon={FolderOpen} title="No files here" description="Upload a file to get started." />
  );

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {files.map((f: {
          id: string; name: string; mimeType: string; size: number;
          createdAt: string; url: string; uploader: { user: { name: string } };
        }) => (
          <Card key={f.id} className="group border-border/60 hover:border-primary/30 hover:shadow-md transition-all duration-200 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted text-xl shrink-0">
                  {FILE_TYPE_ICONS[f.mimeType] ?? "📎"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" title={f.name}>{f.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatFileSize(f.size)}</p>
                  <p className="text-xs text-muted-foreground">{f.uploader.user.name} · {formatDate(f.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="sm" variant="outline" className="h-7 text-xs flex-1" asChild>
                  <a href={f.url} download={f.name}><Download className="h-3 w-3 mr-1.5" />Download</a>
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => setDeleteId(f.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <ConfirmDialog
        open={!!deleteId} onOpenChange={() => setDeleteId(null)}
        title="Delete file?" description="This cannot be undone."
        confirmLabel="Delete" variant="destructive" isLoading={deleteFile.isPending}
        onConfirm={() => { if (deleteId) deleteFile.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
      />
    </>
  );
}

export default function FilesPage() {
  const [visibility, setVisibility] = useState<"private" | "department" | "all">("private");
  const uploadFile = useUploadFile();
  const { isAdminOrHR } = useCurrentUser();

  const onDrop = useCallback((accepted: File[]) => {
    accepted.forEach(file => uploadFile.mutate({ file, visibility }));
  }, [uploadFile, visibility]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 10 * 1024 * 1024,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/csv": [".csv"],
      "text/plain": [".txt"],
    },
  });

  return (
    <div className="animate-fade-up">
      <PageHeader title="Files" description="Upload and share documents" />

      {/* Visibility control */}
      <div className="flex items-center gap-3 mb-4">
        <Label className="text-sm text-muted-foreground shrink-0">Visible to:</Label>
        <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Only me</SelectItem>
            <SelectItem value="department">My department</SelectItem>
            {isAdminOrHR && <SelectItem value="all">Everyone</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/40 hover:bg-muted/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3">
          {uploadFile.isPending ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <div className={cn("flex items-center justify-center w-14 h-14 rounded-2xl transition-colors", isDragActive ? "bg-primary/15" : "bg-muted")}>
              <CloudUpload className={cn("h-7 w-7 transition-colors", isDragActive ? "text-primary" : "text-muted-foreground")} />
            </div>
          )}
          <div>
            <p className="font-semibold text-sm">{isDragActive ? "Drop files here" : "Drag & drop or click to browse"}</p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, images, Word, CSV — up to 10MB ·{" "}
              <span className="font-medium">
                {visibility === "private" ? "Only you will see this" : visibility === "department" ? "Your department will see this" : "Everyone will see this"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="mine">
        <TabsList className="mb-4">
          <TabsTrigger value="mine">My Files</TabsTrigger>
          <TabsTrigger value="department">Department Files</TabsTrigger>
          {isAdminOrHR && <TabsTrigger value="all">All Files</TabsTrigger>}
        </TabsList>
        <TabsContent value="mine"><FileGrid scope="mine" /></TabsContent>
        <TabsContent value="department"><FileGrid scope="department" /></TabsContent>
        {isAdminOrHR && <TabsContent value="all"><FileGrid scope="all" /></TabsContent>}
      </Tabs>
    </div>
  );
}

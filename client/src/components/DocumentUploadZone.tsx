import { useState } from "react";
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface UploadedFile {
  id: string;
  name: string;
  size: string;
  status: "uploading" | "success" | "error";
  progress: number;
  category?: string;
}

interface DocumentUploadZoneProps {
  category: string;
  acceptedFormats?: string;
  maxSize?: string;
  onUpload?: (files: File[]) => void;
}

export default function DocumentUploadZone({
  category,
  acceptedFormats = "PDF, JPEG, PNG, DOCX",
  maxSize = "50MB",
  onUpload
}: DocumentUploadZoneProps) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;
    
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map((file, index) => ({
      id: `${Date.now()}-${index}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      status: "uploading" as const,
      progress: 0,
      category
    }));

    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach((file, index) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, status: "success" as const, progress: 100 } : f
          ));
        } else {
          setFiles(prev => prev.map(f => 
            f.id === file.id ? { ...f, progress } : f
          ));
        }
      }, 200);
    });

    console.log('Files uploaded:', selectedFiles);
    onUpload?.(Array.from(selectedFiles));
  };

  const handleRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    console.log('File removed:', id);
  };

  return (
    <div className="space-y-4" data-testid={`upload-zone-${category}`}>
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFileSelect(e.dataTransfer.files);
        }}
      >
        <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h4 className="text-lg font-medium mb-2">{category}</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Drag and drop files here, or click to browse
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Accepted formats: {acceptedFormats} (Max size: {maxSize})
        </p>
        <input
          type="file"
          multiple
          className="hidden"
          id={`file-input-${category}`}
          onChange={(e) => handleFileSelect(e.target.files)}
          data-testid="input-file-upload"
        />
        <Button
          variant="outline"
          onClick={() => document.getElementById(`file-input-${category}`)?.click()}
          data-testid="button-browse-files"
        >
          Browse Files
        </Button>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-4 rounded-lg border bg-card"
              data-testid={`file-item-${file.id}`}
            >
              <File className="w-8 h-8 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {file.status === "success" && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {file.status === "error" && (
                      <AlertCircle className="w-4 h-4 text-destructive" />
                    )}
                    <span className="text-xs text-muted-foreground">{file.size}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemove(file.id)}
                      data-testid={`button-remove-${file.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                {file.status === "uploading" && (
                  <Progress value={file.progress} className="h-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

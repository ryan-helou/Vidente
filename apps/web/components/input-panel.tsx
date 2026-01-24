"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Link2, MessageSquare, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalyzeRequest } from "@/types";

interface InputPanelProps {
  onSubmit: (input: AnalyzeRequest) => void;
  isLoading: boolean;
}

export function InputPanel({ onSubmit, isLoading }: InputPanelProps) {
  const [activeTab, setActiveTab] = useState<"url" | "text" | "screenshot">(
    "url"
  );
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [screenshotName, setScreenshotName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just base64
        const base64 = result.split(",")[1];
        setScreenshot(base64);
        setScreenshotName(file.name);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
  });

  const handleSubmit = () => {
    if (activeTab === "url" && url) {
      onSubmit({ input_type: "url", url });
    } else if (activeTab === "text" && text) {
      onSubmit({ input_type: "text", query: text });
    } else if (activeTab === "screenshot" && screenshot) {
      onSubmit({ input_type: "screenshot", screenshot_base64: screenshot });
    }
  };

  const isSubmitDisabled =
    isLoading ||
    (activeTab === "url" && !url) ||
    (activeTab === "text" && !text) ||
    (activeTab === "screenshot" && !screenshot);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "url" | "text" | "screenshot")}
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="url" className="flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <span className="hidden sm:inline">Polymarket</span> URL
            </TabsTrigger>
            <TabsTrigger value="text" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Text</span> Query
            </TabsTrigger>
            <TabsTrigger value="screenshot" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Screenshot
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="mt-4">
            <Input
              placeholder="https://polymarket.com/event/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitDisabled) {
                  handleSubmit();
                }
              }}
            />
          </TabsContent>

          <TabsContent value="text" className="mt-4">
            <Input
              placeholder="Will Bitcoin hit $100k by December 2025?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitDisabled) {
                  handleSubmit();
                }
              }}
            />
          </TabsContent>

          <TabsContent value="screenshot" className="mt-4">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer",
                "transition-colors duration-200 mb-4",
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50",
                screenshot && "border-green-500 bg-green-500/5"
              )}
            >
              <input {...getInputProps()} />
              {screenshot ? (
                <div className="text-green-600 dark:text-green-400">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2" />
                  <p className="font-medium">{screenshotName}</p>
                  <p className="text-sm text-muted-foreground">
                    Click or drop to replace
                  </p>
                </div>
              ) : isDragActive ? (
                <p className="text-muted-foreground">Drop the screenshot here...</p>
              ) : (
                <div className="text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Drag & drop a screenshot, or click to select</p>
                  <p className="text-sm mt-1">PNG, JPG, or WebP</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Market"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

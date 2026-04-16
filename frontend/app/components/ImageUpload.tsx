"use client";

import { useState, useRef, useCallback } from "react";
import { useToast } from "./Toast";

interface ImageUploadProps {
  onImageSelected: (file: File) => void;
  onPreviewReady?: (url: string | null) => void;
  disabled: boolean;
}

export default function ImageUpload({ onImageSelected, onPreviewReady, disabled }: ImageUploadProps) {
  const { showToast } = useToast();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file", "warning");
        return;
      }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onPreviewReady?.(url);
      onImageSelected(file);
    },
    [onImageSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      if (e.dataTransfer.files?.[0]) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          disabled
            ? "opacity-50 cursor-not-allowed border-gray-600"
            : dragActive
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-400"
        }`}
      >
        {preview ? (
          <img
            src={preview}
            alt="Uploaded"
            className="max-h-64 mx-auto rounded-lg"
          />
        ) : (
          <div className="space-y-3">
            <svg
              className="mx-auto h-12 w-12 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-400">
              <span className="text-blue-400 font-medium">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-gray-500">Full body photo, front-facing, arms slightly away</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          disabled={disabled}
        />
      </div>
      {preview && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setPreview(null);
            onPreviewReady?.(null);
            if (inputRef.current) inputRef.current.value = "";
          }}
          className="text-sm text-gray-400 hover:text-white transition"
        >
          Remove image
        </button>
      )}
    </div>
  );
}

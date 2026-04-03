/**
 * FileUploader component for Lazy Footers.
 *
 * A drag-and-drop zone that also supports click-to-browse file selection.
 * Validates files immediately on selection:
 *   - File count must not exceed MAX_FILES
 *   - Combined size must not exceed MAX_TOTAL_SIZE_BYTES
 *   - Each file extension must be in ALLOWED_EXTENSIONS
 *
 * This component does NOT display the list of selected files — FileList does that.
 * This component does NOT send files to the server — that is handled by the page.
 */

"use client";

import { useCallback, useRef, useState } from "react";
import type { SelectedFile } from "@/types";
import {
  ALLOWED_EXTENSIONS,
  MAX_FILES,
  MAX_TOTAL_SIZE_BYTES,
  MAX_TOTAL_SIZE_MB,
} from "@/lib/constants";

/* --------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface FileUploaderProps {
  /** Current array of already-selected files (used to enforce cumulative limits). */
  currentFiles: SelectedFile[];
  /** Called with the NEW files to add when the user selects valid files. */
  onFilesAdded: (files: SelectedFile[]) => void;
  /** Whether the uploader should be disabled (e.g. during processing). */
  disabled?: boolean;
}

/* --------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export default function FileUploader({
  currentFiles,
  onFilesAdded,
  disabled = false,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Validate and process a FileList from either drag-drop or file input.
   *
   * Checks all three constraints (count, size, extensions) and shows the
   * first failing validation as an error message. If all pass, converts
   * the FileList to SelectedFile[] and calls onFilesAdded.
   */
  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      // Clear any previous validation error
      setValidationError(null);

      if (!fileList || fileList.length === 0) return;

      const newFiles = Array.from(fileList);

      // --- Validation 1: File count (cumulative) ---
      const totalFileCount = currentFiles.length + newFiles.length;
      if (totalFileCount > MAX_FILES) {
        setValidationError(
          `Too many files. You can upload up to ${MAX_FILES} files total, ` +
          `but you'd have ${totalFileCount}.`
        );
        return;
      }

      // --- Validation 2: File extensions ---
      const invalidFiles = newFiles.filter((file) => {
        const extension = "." + (file.name.split(".").pop()?.toLowerCase() || "");
        return !ALLOWED_EXTENSIONS.includes(extension);
      });

      if (invalidFiles.length > 0) {
        const invalidNames = invalidFiles.map((file) => file.name).join(", ");
        setValidationError(
          `Unsupported file type(s): ${invalidNames}. ` +
          `Only ${ALLOWED_EXTENSIONS.join(" and ")} files are accepted.`
        );
        return;
      }

      // --- Validation 3: Combined size (cumulative) ---
      const currentTotalSize = currentFiles.reduce(
        (sum, selectedFile) => sum + selectedFile.file.size,
        0
      );
      const newTotalSize = newFiles.reduce((sum, file) => sum + file.size, 0);
      const combinedSize = currentTotalSize + newTotalSize;

      if (combinedSize > MAX_TOTAL_SIZE_BYTES) {
        const combinedSizeMB = (combinedSize / (1024 * 1024)).toFixed(1);
        setValidationError(
          `Total file size (${combinedSizeMB} MB) exceeds the ${MAX_TOTAL_SIZE_MB} MB limit.`
        );
        return;
      }

      // --- All validations passed — build SelectedFile objects ---
      const selectedFiles: SelectedFile[] = newFiles.map((file) => ({
        file,
        // Generate a unique ID using filename + size + timestamp to avoid collisions
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      }));

      onFilesAdded(selectedFiles);
    },
    [currentFiles, onFilesAdded]
  );

  /* ----- Drag-and-drop handlers ----- */

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      if (!disabled) {
        handleFiles(event.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  /* ----- Click-to-browse handler ----- */

  const handleBrowseClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(event.target.files);
      // Reset the input so the same file can be selected again if removed and re-added
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles]
  );

  return (
    <div className="file-uploader-wrapper">
      <div
        className={`file-uploader-dropzone ${isDragOver ? "file-uploader-dragover" : ""} ${disabled ? "file-uploader-disabled" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        aria-label="Upload files by clicking or dragging"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            handleBrowseClick();
          }
        }}
      >
        {/* Hidden file input — triggered programmatically */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx"
          onChange={handleInputChange}
          className="file-uploader-hidden-input"
          tabIndex={-1}
          disabled={disabled}
        />

        <div className="file-uploader-content">
          <div className="file-uploader-icon">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20L28 8z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M28 8v12h12" />
              <line x1="24" y1="22" x2="24" y2="34" />
              <line x1="18" y1="28" x2="24" y2="22" />
              <line x1="30" y1="28" x2="24" y2="22" />
            </svg>
          </div>
          <p className="file-uploader-text-main">
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </p>
          <p className="file-uploader-text-sub">
            or <span className="file-uploader-browse-link">browse files</span>
          </p>
          <p className="file-uploader-text-hint">
            PDF & DOCX • Up to {MAX_FILES} files • {MAX_TOTAL_SIZE_MB} MB max
          </p>
        </div>
      </div>

      {/* Validation error message */}
      {validationError && (
        <div className="file-uploader-error" role="alert">
          <svg className="file-uploader-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{validationError}</span>
        </div>
      )}
    </div>
  );
}

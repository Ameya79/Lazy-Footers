/**
 * FileList component for Lazy Footers.
 *
 * Displays the list of files the user has selected for upload.
 * Each row shows filename, human-readable file size, and a remove button.
 * The total combined size is displayed at the bottom.
 *
 * This component does NOT handle file selection — that is FileUploader's job.
 * This component does NOT have a format toggle — output is always PDF.
 */

"use client";

import type { SelectedFile } from "@/types";

/* --------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface FileListProps {
  /** Array of selected files to display. */
  files: SelectedFile[];
  /** Called when the user clicks the remove button for a file. */
  onRemoveFile: (fileId: string) => void;
  /** Whether remove buttons should be disabled (e.g. during processing). */
  disabled?: boolean;
}

/* --------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * Convert a byte count into a human-readable string (e.g. "1.2 MB").
 *
 * Uses binary units (1 KB = 1024 bytes) which matches what most
 * operating systems display in file explorers.
 *
 * @param bytes - File size in bytes.
 * @returns Formatted string like "1.2 MB" or "340 KB".
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  // Determine the correct unit tier by dividing by 1024 repeatedly
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, unitIndex);

  // Show 1 decimal place for MB and above, 0 for KB and B
  const decimals = unitIndex >= 2 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

/**
 * Get the file type icon based on extension.
 *
 * @param filename - The file name to check.
 * @returns An emoji representing the file type.
 */
function getFileIcon(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return "📕";
  if (extension === "docx" || extension === "doc") return "📘";
  return "📄";
}

/* --------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export default function FileList({ files, onRemoveFile, disabled = false }: FileListProps) {
  // Don't render anything if no files are selected
  if (files.length === 0) {
    return null;
  }

  // Calculate total size once for the summary footer
  const totalSizeBytes = files.reduce((sum, selectedFile) => sum + selectedFile.file.size, 0);

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <h3 className="file-list-title">Selected Files</h3>
        <span className="file-list-count">{files.length} file{files.length !== 1 ? "s" : ""}</span>
      </div>

      <ul className="file-list">
        {files.map((selectedFile) => (
          <li key={selectedFile.id} className="file-list-item">
            <div className="file-list-item-info">
              <span className="file-list-item-icon">{getFileIcon(selectedFile.file.name)}</span>
              <span className="file-list-item-name" title={selectedFile.file.name}>
                {selectedFile.file.name}
              </span>
              <span className="file-list-item-size">
                {formatFileSize(selectedFile.file.size)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(selectedFile.id)}
              disabled={disabled}
              className="file-list-remove-button"
              aria-label={`Remove ${selectedFile.file.name}`}
              title="Remove file"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div className="file-list-footer">
        <span className="file-list-total-label">Total size:</span>
        <span className="file-list-total-size">{formatFileSize(totalSizeBytes)}</span>
        <span className="file-list-output-note">→ PDF stays PDF · DOCX stays DOCX</span>
      </div>
    </div>
  );
}

/**
 * DownloadPanel component for Lazy Footers.
 *
 * Shown after file processing completes. Offers two download modes:
 *   1. "Download All as ZIP" — single button, downloads a ZIP archive
 *   2. Individual file downloads — one download link per processed file
 *
 * The dual-mode design is critical for mobile users who often cannot
 * easily unzip files on their devices.
 *
 * This component does NOT handle processing — it only displays download options.
 */

"use client";

import type { ProcessedFileInfo, ProcessingError } from "@/types";
import { getDownloadFileUrl, getDownloadZipUrl } from "@/lib/api";

/* --------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface DownloadPanelProps {
  /** Session ID returned by the backend after processing. */
  sessionId: string;
  /** List of successfully processed files available for download. */
  files: ProcessedFileInfo[];
  /** List of files that failed processing (shown as warnings). */
  errors: ProcessingError[];
}

/* --------------------------------------------------------------------------
 * Helpers
 * -------------------------------------------------------------------------- */

/**
 * Convert a byte count into a human-readable string (e.g. "1.2 MB").
 *
 * @param bytes - File size in bytes.
 * @returns Formatted string like "1.2 MB" or "340 KB".
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / Math.pow(1024, unitIndex);
  const decimals = unitIndex >= 2 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[unitIndex]}`;
}

/* --------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export default function DownloadPanel({ sessionId, files, errors }: DownloadPanelProps) {
  // Total size for the ZIP download summary
  const totalSizeBytes = files.reduce((sum, file) => sum + file.sizeBytes, 0);

  return (
    <div className="download-panel">
      {/* ----- Header ----- */}
      <div className="download-panel-header">
        <h3 className="download-panel-title">Your Files Are Ready</h3>
        <p className="download-panel-subtitle">
          {files.length} PDF{files.length !== 1 ? "s" : ""} processed
          {errors.length > 0 && ` (${errors.length} failed)`}
        </p>
      </div>

      {/* ----- ZIP download button ----- */}
      <a
        href={getDownloadZipUrl(sessionId)}
        download="lazy_footers_output.zip"
        className="download-panel-zip-button"
      >
        <svg className="download-panel-zip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline strokeLinecap="round" strokeLinejoin="round" points="7 10 12 15 17 10" />
          <line strokeLinecap="round" x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <div className="download-panel-zip-text">
          <span className="download-panel-zip-label">Download All as ZIP</span>
          <span className="download-panel-zip-size">{formatFileSize(totalSizeBytes)}</span>
        </div>
      </a>

      {/* ----- Divider with "or" label ----- */}
      <div className="download-panel-divider">
        <span>or download individually</span>
      </div>

      {/* ----- Individual file download links ----- */}
      <ul className="download-panel-file-list">
        {files.map((processedFile) => (
          <li key={processedFile.name} className="download-panel-file-item">
            <div className="download-panel-file-info">
              <span className="download-panel-file-icon">📄</span>
              <span className="download-panel-file-name" title={processedFile.name}>
                {processedFile.name}
              </span>
              <span className="download-panel-file-size">
                {formatFileSize(processedFile.sizeBytes)}
              </span>
            </div>
            <a
              href={getDownloadFileUrl(sessionId, processedFile.name)}
              download={processedFile.name}
              className="download-panel-file-download-button"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="download-panel-file-download-icon">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline strokeLinecap="round" strokeLinejoin="round" points="7 10 12 15 17 10" />
                <line strokeLinecap="round" x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </a>
          </li>
        ))}
      </ul>

      {/* ----- Partial errors warning ----- */}
      {errors.length > 0 && (
        <div className="download-panel-errors">
          <p className="download-panel-errors-title">
            ⚠️ {errors.length} file{errors.length !== 1 ? "s" : ""} could not be processed:
          </p>
          <ul className="download-panel-errors-list">
            {errors.map((processingError) => (
              <li key={processingError.filename} className="download-panel-error-item">
                <strong>{processingError.filename}:</strong> {processingError.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

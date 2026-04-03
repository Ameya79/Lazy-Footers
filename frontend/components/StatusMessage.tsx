/**
 * StatusMessage component for Lazy Footers.
 *
 * Displays contextual feedback based on the current application status:
 * idle (hidden), uploading, processing, done (with optional partial errors),
 * and error states.
 *
 * This component does NOT trigger any actions — it is purely presentational.
 */

"use client";

import type { AppStatus, ProcessingError } from "@/types";

/* --------------------------------------------------------------------------
 * Props
 * -------------------------------------------------------------------------- */

interface StatusMessageProps {
  /** Current status of the processing workflow. */
  status: AppStatus;
  /** Human-readable error message shown when status is "error". */
  errorMessage?: string;
  /** List of per-file errors shown when status is "done" with partial failures. */
  processingErrors?: ProcessingError[];
  /** Total number of files that were submitted for processing. */
  totalFiles?: number;
}

/* --------------------------------------------------------------------------
 * Component
 * -------------------------------------------------------------------------- */

export default function StatusMessage({
  status,
  errorMessage,
  processingErrors = [],
  totalFiles = 0,
}: StatusMessageProps) {
  // Don't render anything when idle — no status to show
  if (status === "idle") {
    return null;
  }

  return (
    <div className="status-message-container">
      {/* ----- Uploading state ----- */}
      {status === "uploading" && (
        <div className="status-banner status-uploading">
          <div className="status-spinner" />
          <span>Uploading files to server…</span>
        </div>
      )}

      {/* ----- Processing state ----- */}
      {status === "processing" && (
        <div className="status-banner status-processing">
          <div className="status-spinner" />
          <span>Processing files — adding footers and converting to PDF…</span>
        </div>
      )}

      {/* ----- Done state (success or partial failure) ----- */}
      {status === "done" && (
        <div className="status-banner status-done">
          <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {processingErrors.length > 0 ? (
            <div className="status-content">
              <p className="status-text">
                {totalFiles - processingErrors.length} of {totalFiles} files processed successfully.
              </p>
              <details className="status-errors-details">
                <summary className="status-errors-summary">
                  {processingErrors.length} file{processingErrors.length > 1 ? "s" : ""} failed
                </summary>
                <ul className="status-errors-list">
                  {processingErrors.map((processingError) => (
                    <li key={processingError.filename} className="status-error-item">
                      <strong>{processingError.filename}:</strong> {processingError.message}
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ) : (
            <span>All {totalFiles} files processed successfully!</span>
          )}
        </div>
      )}

      {/* ----- Error state (full failure) ----- */}
      {status === "error" && (
        <div className="status-banner status-error">
          <svg className="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <span>{errorMessage || "An unexpected error occurred."}</span>
        </div>
      )}
    </div>
  );
}

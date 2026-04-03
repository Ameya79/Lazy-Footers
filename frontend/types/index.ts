/**
 * Shared TypeScript interfaces for Lazy Footers.
 *
 * This file defines all type shapes used across the frontend:
 * component props, API request/response contracts, and UI state types.
 *
 * This file does NOT contain any logic, React components, or side effects.
 */

/* --------------------------------------------------------------------------
 * File selection
 * -------------------------------------------------------------------------- */

/** Represents one file the user has selected for upload. */
export interface SelectedFile {
  /** The browser File object from the file input or drag-and-drop. */
  file: File;
  /** A unique ID for React key management and removal operations. */
  id: string;
}

/* --------------------------------------------------------------------------
 * API response shapes
 * -------------------------------------------------------------------------- */

/** Info about a successfully processed file returned by the backend. */
export interface ProcessedFileInfo {
  /** The output filename (e.g. "report_with_footer.pdf"). */
  name: string;
  /** Size of the output file in bytes. */
  sizeBytes: number;
}

/** Describes a per-file processing error from the backend. */
export interface ProcessingError {
  /** The original filename that failed to process. */
  filename: string;
  /** Human-readable error message explaining what went wrong. */
  message: string;
}

/** The JSON response shape from POST /api/process. */
export interface ProcessResponse {
  /** Unique session ID used to download processed files. */
  sessionId: string;
  /** List of successfully processed output files. */
  files: ProcessedFileInfo[];
  /** List of files that failed to process (empty if all succeeded). */
  errors: ProcessingError[];
}

/* --------------------------------------------------------------------------
 * UI state
 * -------------------------------------------------------------------------- */

/** All possible states of the main application workflow. */
export type AppStatus = "idle" | "uploading" | "processing" | "done" | "error";

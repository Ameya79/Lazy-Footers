/**
 * Frontend constants for Lazy Footers.
 *
 * These values MUST match the corresponding constants in backend/config.py.
 * They are duplicated here so the frontend can validate uploads client-side
 * before sending them to the server, giving users instant feedback.
 *
 * This file does NOT contain any logic or React components.
 */

/** Maximum number of files allowed per upload. Must match backend MAX_FILES. */
export const MAX_FILES = 10;

/** Maximum combined upload size in megabytes. Must match backend MAX_TOTAL_SIZE_MB. */
export const MAX_TOTAL_SIZE_MB = 50;

/** Maximum combined upload size in bytes — derived from MAX_TOTAL_SIZE_MB. */
export const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

/** File extensions the app accepts. Must match backend ALLOWED_EXTENSIONS. */
export const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

/**
 * Base URL of the backend API.
 * Read from NEXT_PUBLIC_API_URL environment variable at build time.
 * Falls back to localhost:8000 for local development convenience.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

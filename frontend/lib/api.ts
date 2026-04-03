/**
 * API client for Lazy Footers.
 *
 * This module is the ONLY place in the frontend that communicates with the
 * backend server. All HTTP calls are centralized here so components never
 * use fetch() directly.
 *
 * This file does NOT contain any React components or UI logic.
 */

import { API_BASE_URL } from "./constants";
import type { ProcessResponse } from "@/types";

/* --------------------------------------------------------------------------
 * Process files
 * -------------------------------------------------------------------------- */

/**
 * Upload files and footer text to the backend for processing.
 *
 * Builds a FormData payload, POSTs it to /api/process, and returns the
 * parsed JSON response containing the session ID and file list.
 *
 * @param files      - Array of browser File objects selected by the user.
 * @param footerText - The footer string to apply to every file.
 *
 * @returns A ProcessResponse with session_id, files array, and errors array.
 *
 * @throws Error if the HTTP request fails or the server returns an error status.
 */
export async function processFiles(
  files: File[],
  footerLeft: string,
  footerCenter: string,
  footerRight: string,
): Promise<ProcessResponse> {
  const formData = new FormData();

  // Append each file under the "files" key — FastAPI expects List[UploadFile]
  for (const file of files) {
    formData.append("files", file);
  }

  // Append footer fields
  formData.append("footer_left", footerLeft);
  formData.append("footer_center", footerCenter);
  formData.append("footer_right", footerRight);

  const response = await fetch(`${API_BASE_URL}/api/process`, {
    method: "POST",
    body: formData,
    // Do NOT set Content-Type header — the browser sets it automatically
    // with the correct multipart boundary string for FormData
  });

  if (!response.ok) {
    // Try to extract a meaningful error message from the response body
    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (typeof errorBody.detail === "string") {
        errorMessage = errorBody.detail;
      } else if (typeof errorBody.detail === "object" && errorBody.detail.message) {
        errorMessage = errorBody.detail.message;
      }
    } catch {
      // Response body wasn't JSON — use the default error message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Map snake_case backend response to camelCase frontend interface
  return {
    sessionId: data.session_id,
    files: data.files.map((file: { name: string; size_bytes: number }) => ({
      name: file.name,
      sizeBytes: file.size_bytes,
    })),
    errors: data.errors,
  };
}

/* --------------------------------------------------------------------------
 * Download URL builders
 * -------------------------------------------------------------------------- */

/**
 * Build the URL to download all processed files as a single ZIP archive.
 *
 * @param sessionId - The session UUID returned by processFiles().
 * @returns Absolute URL string that triggers a ZIP file download.
 */
export function getDownloadZipUrl(sessionId: string): string {
  return `${API_BASE_URL}/api/download/zip/${sessionId}`;
}

/**
 * Build the URL to download a single processed file.
 *
 * @param sessionId - The session UUID returned by processFiles().
 * @param filename  - The exact filename of the processed output file.
 * @returns Absolute URL string that triggers an individual file download.
 */
export function getDownloadFileUrl(sessionId: string, filename: string): string {
  return `${API_BASE_URL}/api/download/file/${sessionId}/${encodeURIComponent(filename)}`;
}

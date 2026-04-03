/**
 * Main page for Lazy Footers.
 *
 * State: selected files, 3 footer fields (left/center/right), status, results.
 * Flow: upload → fill footer fields → process → download
 */

"use client";

import { useCallback, useState } from "react";
import type { AppStatus, ProcessResponse, SelectedFile } from "@/types";
import { processFiles } from "@/lib/api";
import FileUploader from "@/components/FileUploader";
import FileList from "@/components/FileList";
import FooterInput from "@/components/FooterInput";
import StatusMessage from "@/components/StatusMessage";
import DownloadPanel from "@/components/DownloadPanel";

export default function HomePage() {
  /* ----- State ----- */
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [footerLeft, setFooterLeft] = useState("");
  const [footerCenter, setFooterCenter] = useState("");
  const [footerRight, setFooterRight] = useState("");
  const [status, setStatus] = useState<AppStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [processResult, setProcessResult] = useState<ProcessResponse | null>(null);

  /* ----- File callbacks ----- */
  const handleFilesAdded = useCallback((newFiles: SelectedFile[]) => {
    setSelectedFiles((prev) => [...prev, ...newFiles]);
    if (status === "done" || status === "error") {
      setStatus("idle");
      setProcessResult(null);
      setErrorMessage("");
    }
  }, [status]);

  const handleRemoveFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  /* ----- Submit ----- */
  const handleSubmit = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    const hasFooter = footerLeft.trim() || footerCenter.trim() || footerRight.trim();
    if (!hasFooter) return;

    setStatus("uploading");
    setErrorMessage("");
    setProcessResult(null);

    try {
      const rawFiles = selectedFiles.map((f) => f.file);
      setStatus("processing");
      const result = await processFiles(rawFiles, footerLeft, footerCenter, footerRight);
      setProcessResult(result);
      setStatus("done");
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : "An unexpected error occurred. Please try again.";
      setErrorMessage(message);
      setStatus("error");
    }
  }, [selectedFiles, footerLeft, footerCenter, footerRight]);

  /* ----- Reset ----- */
  const handleReset = useCallback(() => {
    setSelectedFiles([]);
    setFooterLeft("");
    setFooterCenter("");
    setFooterRight("");
    setStatus("idle");
    setErrorMessage("");
    setProcessResult(null);
  }, []);

  /* ----- Derived ----- */
  const isProcessing = status === "uploading" || status === "processing";
  const hasFooterText = !!(footerLeft.trim() || footerCenter.trim() || footerRight.trim());
  const canSubmit = selectedFiles.length > 0 && hasFooterText && !isProcessing;

  return (
    <div className="page-container">
      <header className="page-header">
        <h1 className="page-logo">Lazy Footers</h1>
        <p className="page-tagline">
          Upload PDFs & Word docs, add your footer details, and download them instantly.
          PDFs stay PDF, Word docs stay Word.
        </p>
      </header>

      <main className="page-main">
        <FileUploader
          currentFiles={selectedFiles}
          onFilesAdded={handleFilesAdded}
          disabled={isProcessing}
        />

        <FileList
          files={selectedFiles}
          onRemoveFile={handleRemoveFile}
          disabled={isProcessing}
        />

        {selectedFiles.length > 0 && (
          <FooterInput
            leftValue={footerLeft}
            centerValue={footerCenter}
            rightValue={footerRight}
            onLeftChange={setFooterLeft}
            onCenterChange={setFooterCenter}
            onRightChange={setFooterRight}
            disabled={isProcessing}
          />
        )}

        {canSubmit && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="page-submit-button"
            id="submit-button"
          >
            <svg className="page-submit-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            Process {selectedFiles.length} File{selectedFiles.length !== 1 ? "s" : ""}
          </button>
        )}

        <StatusMessage
          status={status}
          errorMessage={errorMessage}
          processingErrors={processResult?.errors}
          totalFiles={selectedFiles.length}
        />

        {status === "done" && processResult && processResult.files.length > 0 && (
          <DownloadPanel
            sessionId={processResult.sessionId}
            files={processResult.files}
            errors={processResult.errors}
          />
        )}

        {(status === "done" || status === "error") && (
          <button
            type="button"
            onClick={handleReset}
            className="page-reset-button"
            id="reset-button"
          >
            ↻ Start Over
          </button>
        )}
      </main>
    </div>
  );
}

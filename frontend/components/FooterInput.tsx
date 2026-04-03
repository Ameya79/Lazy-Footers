/**
 * FooterInput — Three-field footer input group.
 *
 * Provides three inline text inputs for the 3-column footer layout:
 *   - Left:   Name
 *   - Center: Class (e.g. SE IT-B)
 *   - Right:  Roll No
 *
 * No labels are shown in the footer output — only the values.
 */

"use client";

interface FooterInputProps {
  leftValue: string;
  centerValue: string;
  rightValue: string;
  onLeftChange: (value: string) => void;
  onCenterChange: (value: string) => void;
  onRightChange: (value: string) => void;
  disabled?: boolean;
}

export default function FooterInput({
  leftValue,
  centerValue,
  rightValue,
  onLeftChange,
  onCenterChange,
  onRightChange,
  disabled = false,
}: FooterInputProps) {
  return (
    <div className="footer-input-container">
      <label className="footer-input-label">Footer Details</label>

      <div className="footer-input-row">
        {/* Left: Name */}
        <div className="footer-input-group">
          <span className="footer-input-hint">Name</span>
          <input
            id="footer-left-input"
            type="text"
            className="footer-input-field"
            placeholder="e.g. Ameya Kulkarni"
            value={leftValue}
            onChange={(e) => onLeftChange(e.target.value)}
            disabled={disabled}
            maxLength={80}
          />
        </div>

        {/* Center: Class */}
        <div className="footer-input-group">
          <span className="footer-input-hint">Class</span>
          <input
            id="footer-center-input"
            type="text"
            className="footer-input-field"
            placeholder="e.g. SE IT-B"
            value={centerValue}
            onChange={(e) => onCenterChange(e.target.value)}
            disabled={disabled}
            maxLength={40}
          />
        </div>

        {/* Right: Roll No */}
        <div className="footer-input-group">
          <span className="footer-input-hint">Roll No</span>
          <input
            id="footer-right-input"
            type="text"
            className="footer-input-field"
            placeholder="e.g. 1"
            value={rightValue}
            onChange={(e) => onRightChange(e.target.value)}
            disabled={disabled}
            maxLength={20}
          />
        </div>
      </div>
    </div>
  );
}

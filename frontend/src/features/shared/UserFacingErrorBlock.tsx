import { useState } from "react";

type Props = {
  message: string;
  /** Raw message for support / debugging */
  technicalDetails?: string;
};

export function UserFacingErrorBlock({ message, technicalDetails }: Props) {
  const [copied, setCopied] = useState(false);
  const details = technicalDetails?.trim() || message;

  return (
    <div role="alert" aria-live="assertive">
      <p className="error">{message}</p>
      <p className="cost-note">
        Need a quick fix? Try a smaller file, another format, or refresh the page — nothing here is stored on our servers.
      </p>
      {details.length > 0 && (
        <p className="cost-note">
          <button
            type="button"
            className="text-like-button"
            onClick={() => {
              void navigator.clipboard.writeText(details).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? "Copied details" : "Copy technical details"}
          </button>
        </p>
      )}
    </div>
  );
}

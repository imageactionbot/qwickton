type Props = {
  what: string;
  bestFor: string;
  whatLabel?: string;
  bestForLabel?: string;
  /** Short privacy / ease-of-use line; omit with false for hubs that already repeat it. */
  privacyTip?: string | false;
};

const DEFAULT_PRIVACY_TIP =
  "Your files stay on this device for local tools — nothing is uploaded to our servers for core processing.";

export function ToolGuideBlurb({
  what,
  bestFor,
  whatLabel = "In simple terms:",
  bestForLabel = "Useful when:",
  privacyTip = DEFAULT_PRIVACY_TIP,
}: Props) {
  return (
    <div className="tool-guide-blurb">
      <p className="cost-note tool-guide-blurb-line">
        <strong>{whatLabel}</strong> {what}
      </p>
      <p className="cost-note tool-guide-blurb-line">
        <strong>{bestForLabel}</strong> {bestFor}
      </p>
      {privacyTip ? (
        <p className="cost-note tool-guide-blurb-line tool-guide-blurb-line--privacy">
          <strong>Privacy:</strong> {typeof privacyTip === "string" ? privacyTip : DEFAULT_PRIVACY_TIP}
        </p>
      ) : null}
    </div>
  );
}

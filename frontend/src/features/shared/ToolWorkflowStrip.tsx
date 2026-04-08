type Variant = "files" | "text";

const copy: Record<
  Variant,
  { aria: string; steps: [string, string, string] }
> = {
  files: {
    aria: "How it works",
    steps: ["Drop or choose files", "Process in this tab", "Download the result"],
  },
  text: {
    aria: "How it works",
    steps: ["Paste your text", "Run the tool here", "Copy result or keep editing"],
  },
};

export function ToolWorkflowStrip({ variant = "files" }: { variant?: Variant }) {
  const { aria, steps } = copy[variant];
  return (
    <p className="tool-flow-strip" role="group" aria-label={aria}>
      <span className="tool-flow-step">
        <span className="tool-flow-num">1</span>
        {steps[0]}
      </span>
      <span className="tool-flow-connector" aria-hidden="true" />
      <span className="tool-flow-step">
        <span className="tool-flow-num">2</span>
        {steps[1]}
      </span>
      <span className="tool-flow-connector" aria-hidden="true" />
      <span className="tool-flow-step">
        <span className="tool-flow-num">3</span>
        {steps[2]}
      </span>
    </p>
  );
}

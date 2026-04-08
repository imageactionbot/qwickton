import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProcessingStatusPanel } from "./ProcessingStatusPanel";

describe("ProcessingStatusPanel", () => {
  it("renders nothing when idle", () => {
    const { container } = render(
      <ProcessingStatusPanel state="idle" progress={0} elapsedMs={0} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows a friendly headline while processing", () => {
    render(<ProcessingStatusPanel state="processing" progress={40} elapsedMs={1200} etaSec={5} />);
    expect(screen.getByText("Working on your file…")).toBeInTheDocument();
    expect(screen.getByText(/About 40% done/)).toBeInTheDocument();
    expect(screen.getByText(/Show timing details/i)).toBeInTheDocument();
  });

  it("uses indeterminate bar when progress is still zero", () => {
    const { container } = render(
      <ProcessingStatusPanel state="processing" progress={0} elapsedMs={200} />
    );
    expect(container.querySelector(".is-indeterminate")).toBeTruthy();
  });
});

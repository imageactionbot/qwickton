import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToolPageShell } from "./ToolPageShell";

describe("ToolPageShell", () => {
  it("renders title and children", () => {
    render(
      <ToolPageShell title="Test Hub">
        <p>child</p>
      </ToolPageShell>
    );
    expect(screen.getByRole("heading", { name: "Test Hub" })).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });
});

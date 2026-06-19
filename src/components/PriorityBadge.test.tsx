import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PriorityBadge from "./PriorityBadge";

describe("PriorityBadge", () => {
  test("renders Critical priority correctly", () => {
    render(<PriorityBadge priority="Critical" />);

    const badge = screen.getByText("Critical");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("priority-badge--critical");
  });

  test("renders Low priority correctly", () => {
    render(<PriorityBadge priority="Low" />);

    const badge = screen.getByText("Low");

    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass("priority-badge--low");
  });
});
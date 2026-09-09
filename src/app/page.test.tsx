import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";

import Home from "./page";

it("K-water 경품추첨 제목을 표시한다", () => {
  render(<Home />);
  expect(
    screen.getByRole("heading", { name: "K-water 경품추첨" }),
  ).toBeInTheDocument();
});

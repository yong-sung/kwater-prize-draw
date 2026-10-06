"use client";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import QrStage from "./QrStage";

type QrProps = {
  value: string;
  size: number;
  level?: string;
  bgColor: string;
  fgColor: string;
  includeMargin?: boolean;
  imageSettings?: {
    src: string;
    width: number;
    height: number;
    excavate?: boolean;
  };
  "aria-label"?: string;
};

const qrCapture = vi.hoisted(() => ({
  props: null as QrProps | null,
}));

vi.mock("qrcode.react", () => ({
  QRCodeSVG: (props: QrProps) => {
    qrCapture.props = props;
    return <svg aria-label={props["aria-label"]} data-testid="qr-code" />;
  },
}));

describe("QrStage", () => {
  beforeEach(() => {
    qrCapture.props = null;
  });

  it("renders a larger Bangwool badge with a high-correction QR", () => {
    render(<QrStage title="제4차 AI 인사이트 라운드 개최" />);

    expect(
      screen.getByText("제4차 AI 인사이트 라운드 개최"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("QR코드를 스캔해 경품에 응모하세요"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("qr-code")).toHaveAttribute(
      "aria-label",
      "응모 페이지 QR 코드",
    );

    expect(qrCapture.props).toMatchObject({
      value: `${window.location.origin}/`,
      size: 360,
      level: "H",
      bgColor: "#ffffff",
      fgColor: "#0f172a",
      includeMargin: true,
      "aria-label": "응모 페이지 QR 코드",
      imageSettings: {
        src: "/images/bangwool-happy.png",
        width: 96,
        height: 96,
        excavate: true,
      },
    });
  });
});

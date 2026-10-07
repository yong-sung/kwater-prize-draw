"use client";

import { QRCodeSVG } from "qrcode.react";

export default function QrStage({ title }: { title: string }) {
  const url =
    typeof window === "undefined" ? "/" : `${window.location.origin}/`;
  return (
    <section
      aria-label="응모 QR"
      className="flex min-h-[100dvh] flex-col items-center justify-center gap-8 bg-slate-950 p-8 text-white"
    >
      <h1 className="text-4xl font-bold text-center leading-tight sm:text-5xl">
        {title}
      </h1>
      <QRCodeSVG
        value={url}
        size={360}
        bgColor="#ffffff"
        fgColor="#0f172a"
        includeMargin
        aria-label="응모 페이지 QR 코드"
      />
      <p className="text-xl">QR코드를 스캔해 경품에 응모하세요</p>
    </section>
  );
}

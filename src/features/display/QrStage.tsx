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
      <p className="text-2xl font-semibold">{title}</p>
      <div className="rounded-[2rem] bg-white p-4 shadow-2xl ring-4 ring-cyan-300/30">
        <QRCodeSVG
          value={url}
          size={360}
          level="H"
          bgColor="#ffffff"
          fgColor="#0f172a"
          includeMargin
          imageSettings={{
            src: "/images/bangwool-happy.png",
            width: 56,
            height: 56,
            excavate: true,
          }}
          aria-label="응모 페이지 QR 코드"
        />
      </div>
      <p className="text-xl">QR코드를 스캔해 경품에 응모하세요</p>
    </section>
  );
}

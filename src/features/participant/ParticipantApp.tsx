"use client";

import React from "react";
import { useParticipantState } from "./useParticipantState";
import EntryForm from "./EntryForm";
import WaitingScreen from "./WaitingScreen";
import ResultScreen from "./ResultScreen";

function ClosedScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <div className="card max-w-[720px] w-full p-8 bg-white shadow-sm rounded-[24px]">
        <h2 className="text-2xl font-bold text-[#08B9D6] mb-4">
          응모가 마감되었습니다
        </h2>
        <p className="text-gray-600">다음 행사에 참여해 주세요.</p>
      </div>
    </div>
  );
}

export default function ParticipantApp() {
  const { view, submitForm, error } = useParticipantState();

  switch (view.kind) {
    case "FORM":
      return <EntryForm onSubmit={submitForm} error={error} />;
    case "WAITING":
      return <WaitingScreen />;
    case "WINNER":
      return <ResultScreen isWinner={true} prizeName={view.prizeName} />;
    case "NOT_WINNER":
      return <ResultScreen isWinner={false} />;
    case "CLOSED":
      return <ClosedScreen />;
    case "PURGED":
      return <div className="p-8 text-center">데이터가 삭제되었습니다.</div>;
    case "ERROR":
      return (
        <main className="flex min-h-[50vh] items-center justify-center p-4 text-center">
          <p role="alert">{view.message}</p>
        </main>
      );
    case "LOADING":
    default:
      return <div>로딩 중...</div>;
  }
}

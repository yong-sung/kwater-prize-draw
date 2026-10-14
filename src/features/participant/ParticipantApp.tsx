"use client";

import React from "react";
import { useParticipantState } from "./useParticipantState";
import EntryForm from "./EntryForm";
import WaitingScreen from "./WaitingScreen";
import ResultScreen from "./ResultScreen";
import ClosedScreen from "./ClosedScreen";

export default function ParticipantApp() {
  const { view, submitForm, error } = useParticipantState();

  switch (view.kind) {
    case "FORM":
      return <EntryForm onSubmit={submitForm} error={error} />;
    case "WAITING":
      return <WaitingScreen />;
    case "WINNER":
      return (
        <ResultScreen
          isWinner={true}
          prizeCode={view.prizeCode}
          prizeName={view.prizeName}
          name={view.name}
          department={view.department}
        />
      );
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

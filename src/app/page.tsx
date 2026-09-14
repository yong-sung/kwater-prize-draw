import ParticipantApp from "@/features/participant/ParticipantApp";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] p-4">
      <h1 className="sr-only">K-water 경품추첨</h1>
      <ParticipantApp />
    </main>
  );
}

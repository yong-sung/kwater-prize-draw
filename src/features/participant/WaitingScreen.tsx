export default function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <div className="card max-w-[720px] w-full p-8 bg-white shadow-sm rounded-[24px]">
        <h2 className="text-2xl font-bold text-[#08B9D6] mb-4">
          응모가 완료되었습니다!
        </h2>
        <p className="text-gray-600">추첨은 행사 종료 직후 진행됩니다.</p>
        <p className="text-gray-600 mt-2">해당 페이지에서도 추첨 결과를 확인할 수 있습니다.</p>
      </div>
    </div>
  );
}

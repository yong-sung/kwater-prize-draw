export default function WaitingScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-4 text-center">
      <div className="card max-w-[720px] w-full p-8 bg-white shadow-sm rounded-[24px]">
        <h2 className="text-2xl font-bold text-[#08B9D6] mb-4">
          응모가 완료되었습니다!
        </h2>
        <p className="text-gray-600">
          행사 중 추첨 결과를 화면에서 확인해 주세요.
        </p>
        <p className="text-gray-600 mt-2">
          이 페이지를 새로고침해도 응모 내역은 유지됩니다.
        </p>
      </div>
    </div>
  );
}

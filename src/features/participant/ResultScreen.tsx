type ResultScreenProps = {
  isWinner: boolean;
  prizeName?: string;
};

export default function ResultScreen({ isWinner, prizeName }: ResultScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4 text-center">
      <div className="card max-w-[720px] w-full p-8 bg-white shadow-sm rounded-[24px] flex flex-col items-center">
        {isWinner ? (
          <>
            <img 
              src="/images/bangwool-happy.png" 
              alt="기뻐하는 방울이" 
              className="w-48 h-48 object-contain mb-6"
            />
            <h2 className="text-3xl font-bold text-[#08B9D6] mb-2">축하합니다!</h2>
            <p className="text-xl font-semibold">
              <span className="text-[#08B9D6]">{prizeName}</span>에 당첨되셨습니다.
            </p>
          </>
        ) : (
          <>
            <img 
              src="/images/bangwool-sad.png" 
              alt="슬퍼하는 방울이" 
              className="w-48 h-48 object-contain mb-6"
            />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">아쉽지만 꽝입니다</h2>
            <p className="text-gray-500">다음 기회를 기대해 주세요!</p>
          </>
        )}
      </div>
    </div>
  );
}

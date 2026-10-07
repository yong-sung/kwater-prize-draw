import React, { useState } from "react";

type EntryFormProps = {
  onSubmit: (data: {
    name: string;
    phone: string;
    department: string;
    privacyConsent: boolean;
  }) => void;
  error?: string | null;
};

export default function EntryForm({ onSubmit, error }: EntryFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState<boolean | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!privacyConsent) return;
    onSubmit({ name, phone, department, privacyConsent });
  };

  return (
    <div className="card max-w-[720px] mx-auto w-full p-5 bg-white shadow-sm rounded-[24px]">
      <h1 className="text-xl font-bold mb-6 text-center text-[#08B9D6]">
        제4차 AI 인사이트 라운드 경품 응모
      </h1>

      {error && (
        <div aria-live="assertive" className="text-[#EF3340] mb-4 text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="font-semibold text-gray-700">
            참석자 성함
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border p-3 rounded-lg min-h-[56px] bg-[#F5F7FA]"
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="phone" className="font-semibold text-gray-700">
            연락처 (010-0000-0000)
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="border p-3 rounded-lg min-h-[56px] bg-[#F5F7FA]"
            required
            pattern="^010-\d{4}-\d{4}$"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="department" className="font-semibold text-gray-700">
            소속부서명
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="border p-3 rounded-lg min-h-[56px] bg-[#F5F7FA]"
            required
          />
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <p className="font-semibold text-gray-700">
            개인정보 수집 및 이용 동의
          </p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="privacy"
              checked={privacyConsent === true}
              onChange={() => setPrivacyConsent(true)}
              className="w-5 h-5 accent-[#08B9D6]"
              required
            />
            <span>동의합니다</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="privacy"
              checked={privacyConsent === false}
              onChange={() => setPrivacyConsent(false)}
              className="w-5 h-5 accent-[#08B9D6]"
            />
            <span>동의하지 않습니다</span>
          </label>
        </div>

        <button
          type="submit"
          disabled={!privacyConsent}
          className="mt-6 min-h-[56px] bg-[#08B9D6] text-white font-bold rounded-lg disabled:bg-gray-300 transition-colors"
        >
          경품 응모
        </button>
      </form>
    </div>
  );
}

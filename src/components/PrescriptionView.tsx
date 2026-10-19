import React, { useState } from 'react';
import { Pill, Sparkles, Bookmark, Check, Copy, ArrowRight, RefreshCw, Heart } from 'lucide-react';
import { PrescriptionResult, SavedComfortNote } from '../types';

interface PrescriptionViewProps {
  onSaveNote: (note: Omit<SavedComfortNote, 'id' | 'date'>) => void;
}

const PRESET_TOPICS = [
  {
    title: '모의고사 성적 하락 & 정체기',
    desc: '점수가 오르지 않고 오히려 떨어져서 멘탈이 무너졌을 때',
    icon: '📉',
  },
  {
    title: '부모님께 느끼는 미안함과 죄책감',
    desc: '학원비와 서포트를 받으며 밥 먹을 자격도 없는 것 같을 때',
    icon: '🌧️',
  },
  {
    title: '대학 간 친구들과의 비교 & 박탈감',
    desc: 'SNS 속 친구들의 빛나는 일상을 보며 나만 고립된 것 같을 때',
    icon: '🪞',
  },
  {
    title: '극심한 슬럼프와 의욕 상실',
    desc: '책상 앞에는 앉아 있지만 글자가 머리에 전혀 안 들어올 때',
    icon: '🔋',
  },
  {
    title: '또 실패할지도 모른다는 극심한 공포',
    desc: '수능 당일 망치면 내 청춘이 물거품이 될 것 같을 때',
    icon: '⚡',
  },
];

export const PrescriptionView: React.FC<PrescriptionViewProps> = ({ onSaveNote }) => {
  const [selectedTopic, setSelectedTopic] = useState<string>(PRESET_TOPICS[0].title);
  const [customDetail, setCustomDetail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [prescription, setPrescription] = useState<PrescriptionResult | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGeneratePrescription = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          worryTopic: selectedTopic,
          detailNote: customDetail.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error('처방전을 조제하는 중 오류가 발생했습니다.');
      }

      const data: PrescriptionResult = await res.json();
      setPrescription(data);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '처방전을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!prescription) return;
    const text = `[토닥 마음 처방전: ${prescription.diagnosisTitle}]
    
💌 위로의 편지:
${prescription.empathyLetter}

💡 생각의 전환:
${prescription.reframeThought}

☕ 오늘 3분 미션:
${prescription.healingMission}

🌟 마음에 새길 말:
"${prescription.cheeringQuote}"`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = () => {
    if (!prescription) return;
    onSaveNote({
      title: `[처방전] ${prescription.diagnosisTitle}`,
      content: `${prescription.empathyLetter}\n\n[생각의 전환]\n${prescription.reframeThought}\n\n[3분 쉼표 미션]\n${prescription.healingMission}\n\n"${prescription.cheeringQuote}"`,
      author: '토닥 마음약국',
      sourceType: 'prescription',
    });
    setIsSaved(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
          <Pill className="w-3.5 h-3.5 text-amber-400" />
          <span>N수생 전용 마음 약국</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
          오늘의 마음 처방전
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          끝없는 수험생활로 아프고 멍든 마음에, 따뜻한 위로와 3분 회복 처방을 선물합니다.
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            1. 지금 가장 나를 무겁게 짓누르는 고민을 선택해주세요
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {PRESET_TOPICS.map((topic) => {
              const isSelected = selectedTopic === topic.title;
              return (
                <button
                  key={topic.title}
                  onClick={() => setSelectedTopic(topic.title)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{topic.icon}</span>
                    <span className="text-xs font-semibold text-slate-200">{topic.title}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{topic.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            2. 속마음을 조금 더 구체적으로 적어주셔도 좋아요 (선택)
          </label>
          <textarea
            value={customDetail}
            onChange={(e) => setCustomDetail(e.target.value)}
            placeholder="예: 오늘 9시간 공부 목표였는데 4시간밖에 못 하고 졸아서 제 자신이 너무 쓰레기 같아요..."
            rows={2}
            className="w-full rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs sm:text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
          />
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGeneratePrescription}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                <span>정성껏 마음 처방전 조제 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>나만을 위한 처방전 조제하기</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Prescription Result Display */}
      {prescription && (
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 relative overflow-hidden">
          {/* Decorative watermarked stamp */}
          <div className="absolute top-4 right-4 opacity-10 pointer-events-none">
            <Heart className="w-24 h-24 text-amber-400" />
          </div>

          <div className="border-b border-slate-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">
                TODAK PRESCRIPTION
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 mt-0.5">
                {prescription.diagnosisTitle}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '복사됨' : '복사'}</span>
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs flex items-center gap-1.5 border border-amber-500/30 transition-colors"
              >
                {isSaved ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                <span>{isSaved ? '쪽지함 저장됨' : '쪽지함 저장'}</span>
              </button>
            </div>
          </div>

          {/* Body Sections */}
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <h3 className="text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1.5">
                <span>💌</span>
                <span>너에게 전하는 위로의 편지</span>
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                {prescription.empathyLetter}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <h3 className="text-xs font-semibold text-teal-300 mb-1.5 flex items-center gap-1.5">
                  <span>💡</span>
                  <span>생각의 전환 (Cognitive Reframe)</span>
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                  {prescription.reframeThought}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <h3 className="text-xs font-semibold text-orange-300 mb-1.5 flex items-center gap-1.5">
                  <span>☕</span>
                  <span>오늘 3분 쉼표 미션</span>
                </h3>
                <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed">
                  {prescription.healingMission}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 text-center">
              <span className="text-[11px] text-slate-400 block mb-1">책상 앞 포스트잇에 적어둘 한마디</span>
              <p className="text-sm sm:text-base font-semibold text-amber-200">
                "{prescription.cheeringQuote}"
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

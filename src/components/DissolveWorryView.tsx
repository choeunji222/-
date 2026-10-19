import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Trash2, Heart, RefreshCw, Bookmark, Check } from 'lucide-react';
import { SavedComfortNote } from '../types';

interface DissolveWorryViewProps {
  onSaveNote: (note: Omit<SavedComfortNote, 'id' | 'date'>) => void;
}

export const DissolveWorryView: React.FC<DissolveWorryViewProps> = ({ onSaveNote }) => {
  const [worryText, setWorryText] = useState('');
  const [isDissolving, setIsDissolving] = useState(false);
  const [blessingMessage, setBlessingMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDissolve = async () => {
    if (!worryText.trim() || isDissolving) return;

    setIsDissolving(true);
    setErrorMsg(null);
    setBlessingMessage(null);
    setIsSaved(false);

    try {
      const res = await fetch('/api/dissolve-worry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawWorry: worryText }),
      });

      if (!res.ok) {
        throw new Error('마음을 떠나보내는 과정에서 오류가 발생했습니다.');
      }

      const data = await res.json();
      setBlessingMessage(data.message);
      setWorryText('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '오류가 발생했습니다.');
    } finally {
      setIsDissolving(false);
    }
  };

  const handleSaveBlessing = () => {
    if (!blessingMessage) return;
    onSaveNote({
      title: '밤하늘로 날려보낸 걱정과 축복',
      content: blessingMessage,
      author: '해방의 별빛',
      sourceType: 'self',
    });
    setIsSaved(true);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>마음의 응어리 비우기</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
          속마음 털어내기 & 별빛으로 보내기
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          누구에게도 털어놓지 못했던 자책, 질투, 후회, 두려움을 솔직하게 쏟아내세요.
          이곳에 쏟아진 모든 무거운 마음은 밤하늘의 평온한 별빛으로 흩어져 사라집니다.
        </p>
      </div>

      {/* Main Dissolving Container */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5 relative overflow-hidden">
        {/* Animated stars background */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="w-1.5 h-1.5 bg-amber-200 rounded-full absolute top-12 left-16 animate-ping" />
          <div className="w-1 h-1 bg-teal-200 rounded-full absolute top-24 right-20 animate-pulse" />
          <div className="w-1.5 h-1.5 bg-indigo-200 rounded-full absolute bottom-16 left-1/3 animate-ping" />
        </div>

        <AnimatePresence mode="wait">
          {!blessingMessage ? (
            <motion.div
              key="input-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <label className="block text-xs font-semibold text-slate-300">
                지금 내 안을 어지럽히는 날것의 생각들:
              </label>

              <textarea
                value={worryText}
                onChange={(e) => setWorryText(e.target.value)}
                placeholder="예: '솔직히 대학 간 친구들 너무 질투나고 밉다', '내가 재수를 선택한 게 내 인생 최대의 실수였을까?', '부모님 얼굴만 보면 죄인이 된 것 같아 숨이 막혀'..."
                rows={6}
                disabled={isDissolving}
                className="w-full rounded-xl bg-slate-950/70 border border-slate-800 p-4 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 leading-relaxed transition-all resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  * 작성한 내용은 저장되지 않으며, 별빛으로 흩어집니다.
                </span>

                <button
                  onClick={handleDissolve}
                  disabled={!worryText.trim() || isDissolving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-40"
                >
                  {isDissolving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>별빛으로 흩어지는 중...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>마음 털어내기</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="blessing-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center space-y-6 py-4"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-md">
                <Sparkles className="w-7 h-7 text-indigo-400" />
              </div>

              <div className="space-y-3 max-w-lg mx-auto">
                <span className="text-xs text-indigo-400 font-semibold tracking-wide">
                  당신의 무거운 짐을 떠나보낸 자리에 찾아온 평온
                </span>
                <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                  {blessingMessage}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setBlessingMessage(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                >
                  다른 고민 또 털어내기
                </button>
                <button
                  onClick={handleSaveBlessing}
                  className="px-4 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/40 text-indigo-300 text-xs font-medium border border-indigo-500/40 transition-colors flex items-center gap-1.5"
                >
                  {isSaved ? <Check className="w-3.5 h-3.5 text-indigo-400" /> : <Bookmark className="w-3.5 h-3.5" />}
                  <span>{isSaved ? '쪽지함에 담김' : '축복 쪽지함 보관'}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
      </div>
    </div>
  );
};

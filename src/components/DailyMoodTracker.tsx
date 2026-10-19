import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Sparkles,
  Trash2,
  Check,
  TrendingUp,
  Database,
  RefreshCw,
  Heart,
  MessageSquareHeart,
} from 'lucide-react';
import { MoodRecord, getMoodsFromServer, recordMoodOnServer, deleteMoodFromServer } from '../utils/api';

interface MoodOption {
  id: string;
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  comfortMessage: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  {
    id: 'anxious',
    name: '불안·초조',
    icon: '⚡',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    description: '시험이 다가올수록 가슴이 답답하고 결과가 두려운 상태',
    comfortMessage: '불안한 건 네가 목표에 진심이기 때문이야. 오늘의 한 걸음이 널 단단하게 지켜줄 거야.',
  },
  {
    id: 'guilty',
    name: '자책·미안함',
    icon: '💧',
    color: 'text-rose-400',
    bgColor: 'bg-rose-500/10',
    borderColor: 'border-rose-500/30',
    description: '공부량이 부족해 부모님께 죄송하고 내 자신이 미운 상태',
    comfortMessage: '오늘 조금 쉬어갔다고 해서 네 노력의 가치가 사라지지 않아. 자책 대신 오늘 밤은 푹 자자.',
  },
  {
    id: 'burnout',
    name: '번아웃·무기력',
    icon: '🍂',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    description: '글자가 눈에 안 들어오고 몸과 마음에 힘이 쭉 빠진 상태',
    comfortMessage: '스마트폰도 방전되면 꺼져. 지금의 멈춤은 포기가 아니라 마음의 재충전 시간이야.',
  },
  {
    id: 'lonely',
    name: '비교·외로움',
    icon: '🪞',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    description: '대학 간 친구들과 비교되고 세상에 나 혼자 갇힌 듯한 상태',
    comfortMessage: '남들의 시계에 널 맞추지 마. 너의 계절은 조금 늦게 오더라도 그 어떤 봄보다 화려할 거야.',
  },
  {
    id: 'calm',
    name: '잔잔한 집중',
    icon: '🌤️',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    description: '조급함을 내려놓고 오늘 하루치 분량에 차분히 몰입한 상태',
    comfortMessage: '아주 훌륭해! 이런 잔잔한 하루하루가 쌓여 결국 큰 기적을 만들어낸단다.',
  },
  {
    id: 'hopeful',
    name: '희망·의지충전',
    icon: '🌱',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    description: '다시 한 걸음 힘차게 달려나갈 긍정의 에너지가 차오른 상태',
    comfortMessage: '반짝이는 네 눈빛이 너무 멋져. 이 기세를 기억하며 호흡을 가다듬고 나아가자!',
  },
];

const QUICK_TAGS = [
  '#독서실퇴실후',
  '#모의고사성적확인',
  '#오답노트완성',
  '#산책20분',
  '#수면패턴회복',
  '#부모님과통화후',
];

export const DailyMoodTracker: React.FC = () => {
  const [selectedMoodId, setSelectedMoodId] = useState<string>(MOOD_OPTIONS[0].id);
  const [shortNote, setShortNote] = useState<string>('');
  const [moodLogs, setMoodLogs] = useState<MoodRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastSavedMessage, setLastSavedMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load mood logs from backend server on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    getMoodsFromServer()
      .then((data) => {
        if (isMounted) {
          setMoodLogs(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load moods from server:', err);
        if (isMounted) {
          setErrorMsg('서버에서 감정 기록을 불러오지 못했습니다.');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedOption = MOOD_OPTIONS.find((m) => m.id === selectedMoodId) || MOOD_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const saved = await recordMoodOnServer(selectedOption.name, shortNote.trim());
      setMoodLogs((prev) => [saved, ...prev]);
      setLastSavedMessage(selectedOption.comfortMessage);
      setShortNote('');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || '감정 기록 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 감정 기록을 삭제하시겠습니까?')) return;
    try {
      await deleteMoodFromServer(id);
      setMoodLogs((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      console.error(err);
      alert('기록 삭제에 실패했습니다.');
    }
  };

  const handleAppendTag = (tag: string) => {
    setShortNote((prev) => (prev ? `${prev} ${tag}` : tag));
  };

  // Compute emotion breakdown stats
  const totalCount = moodLogs.length;
  const moodCounts = moodLogs.reduce((acc, curr) => {
    acc[curr.mood] = (acc[curr.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="text-center space-y-2 py-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>데일리 감정 트래커 (Daily Mood Tracker)</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
          오늘 하루, 내 마음은 어땠나요?
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          감정의 오르내림을 솔직하게 기록하면, 막연한 불안이 잦아들고 나를 다독일 힘이 생깁니다.
          모든 기록은 백엔드 서버에 안전하게 영구 저장됩니다.
        </p>
      </div>

      {/* Record Mood Form Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm space-y-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Mood Icons Grid */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2.5">
              1. 오늘의 대표 감정 아이콘을 골라주세요
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MOOD_OPTIONS.map((option) => {
                const isSelected = selectedMoodId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setSelectedMoodId(option.id);
                      setLastSavedMessage(null);
                    }}
                    className={`text-left p-3.5 rounded-xl border transition-all relative ${
                      isSelected
                        ? `${option.bgColor} ${option.borderColor} ring-1 ring-amber-500/30 shadow-md`
                        : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <span className="text-xl shrink-0">{option.icon}</span>
                      <span
                        className={`text-xs font-bold ${
                          isSelected ? option.color : 'text-slate-200'
                        }`}
                      >
                        {option.name}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Note Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-300">
                2. 나에게 건네는 짧은 한 줄 메모 (선택)
              </label>
              <span className="text-[11px] text-slate-500">{shortNote.length}/100자</span>
            </div>

            <input
              type="text"
              maxLength={100}
              value={shortNote}
              onChange={(e) => setShortNote(e.target.value)}
              placeholder="예: '독서실에서 수학 3시간 풀고 옥상에서 찬 공기 마심. 내일도 내 페이스대로!'"
              className="w-full rounded-xl bg-slate-950/70 border border-slate-800 p-3 text-xs sm:text-[13px] text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />

            {/* Quick Tag Suggestion Chips */}
            <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
              <span className="text-[11px] text-slate-500 shrink-0">빠른 태그:</span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleAppendTag(tag)}
                  className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800/80 hover:border-slate-700 text-[11px] text-slate-400 hover:text-slate-200 shrink-0 transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <Database className="w-3.5 h-3.5 text-teal-400" />
              <span>백엔드 API(/api/moods)를 통해 실시간으로 데이터가 저장됩니다</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>서버에 저장 중...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>오늘의 감정 서버에 기록하기</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Instant Comfort Feedback */}
        {lastSavedMessage && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/15 border border-amber-500/30 text-center animate-in fade-in duration-300">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-amber-300">토닥의 따뜻한 응답</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 font-medium">
              "{lastSavedMessage}"
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}
      </div>

      {/* Mood History & Analytics Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              <span>내 감정 기록 타임라인</span>
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              총 {totalCount}일 기록됨
            </span>
          </div>

          {/* Quick Frequency Breakdown */}
          {totalCount > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-slate-400 overflow-x-auto no-scrollbar">
              {Object.entries(moodCounts).map(([moodName, count]) => (
                <span key={moodName} className="shrink-0">
                  {moodName} <span className="text-amber-400 font-mono font-semibold">{count}</span>회
                </span>
              ))}
            </div>
          )}
        </div>

        {/* History List */}
        {isLoading ? (
          <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
            <span>서버에서 감정 기록을 불러오는 중...</span>
          </div>
        ) : moodLogs.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-2">
            <MessageSquareHeart className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">아직 저장된 감정 기록이 없습니다.</p>
            <p className="text-[11px] text-slate-500">
              위의 감정 아이콘을 눌러 오늘 하루 마음을 처음으로 기록해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {moodLogs.map((log) => {
              // Match mood config or fallback
              const matchedOption =
                MOOD_OPTIONS.find((m) => m.name === log.mood) || MOOD_OPTIONS[0];

              return (
                <div
                  key={log.id}
                  className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-2.5 shadow-sm transition-all relative group"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{matchedOption.icon}</span>
                      <span className={`text-xs font-bold ${matchedOption.color}`}>
                        {log.mood}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">{log.date}</span>
                      <button
                        onClick={() => handleDelete(log.id)}
                        className="text-slate-600 hover:text-rose-400 transition-colors p-0.5"
                        title="기록 삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {log.note ? (
                    <p className="text-xs text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                      "{log.note}"
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">
                      작성된 한 줄 메모가 없습니다.
                    </p>
                  )}

                  <div className="pt-1.5 border-t border-slate-800/40 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="truncate max-w-[240px] text-slate-400">
                      💡 {matchedOption.comfortMessage}
                    </span>
                    <span className="shrink-0 text-slate-600 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

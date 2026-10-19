import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Sparkles, HeartHandshake, Wind, Flame, CloudRain } from 'lucide-react';
import { ambientAudio } from '../utils/ambientAudio';

interface HeaderProps {
  activeTab: 'chat' | 'prescription' | 'dissolve' | 'breathe' | 'mood' | 'pomodoro' | 'notes';
  setActiveTab: (tab: 'chat' | 'prescription' | 'dissolve' | 'breathe' | 'mood' | 'pomodoro' | 'notes') => void;
  savedNotesCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, savedNotesCount }) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [currentSound, setCurrentSound] = useState<'rain' | 'fire' | 'focus' | 'bell'>('rain');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [dDay, setDDay] = useState<number>(0);

  // Compute D-Day (Target: 2026 College Entrance Exam approx mid-November 2026)
  useEffect(() => {
    const targetDate = new Date('2026-11-19T08:40:00');
    const now = new Date();
    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDDay(diffDays > 0 ? diffDays : 0);
  }, []);

  const handleToggleSound = (mode: 'rain' | 'fire' | 'focus' | 'bell') => {
    if (isPlayingAudio && currentSound === mode) {
      ambientAudio.stop();
      setIsPlayingAudio(false);
    } else {
      ambientAudio.play(mode);
      setCurrentSound(mode);
      setIsPlayingAudio(true);
    }
  };

  const handleStopSound = () => {
    ambientAudio.stop();
    setIsPlayingAudio(false);
    setShowSoundMenu(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Top brand & ambient sound bar */}
        <div className="flex items-center justify-between py-3 border-b border-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 via-orange-500/20 to-teal-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-lg shadow-sm">
              토
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-100 text-base tracking-tight">토닥 (Todak)</span>
                <span className="text-xs text-amber-400/90 font-medium bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                  N수생 마음 안식처
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                수능과 도전의 긴 터널을 걷는 당신을 위한 다정한 심리 상담소
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* D-Day badge with gentle un-pressuring caption */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
              <span className="text-amber-400 font-semibold tabular-nums">D-{dDay}</span>
              <span className="text-slate-500 hidden md:inline">· 오늘 하루치만큼만 걷기</span>
            </div>

            {/* Ambient Sound Player */}
            <div className="relative">
              <button
                onClick={() => setShowSoundMenu(!showSoundMenu)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  isPlayingAudio
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/10'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
                title="안정 백색소음 듣기"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    <span className="hidden sm:inline">
                      {currentSound === 'rain' && '빗소리'}
                      {currentSound === 'fire' && '장작소리'}
                      {currentSound === 'focus' && '독서실'}
                      {currentSound === 'bell' && '싱잉볼'}
                    </span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">마음 소음</span>
                  </>
                )}
              </button>

              {showSoundMenu && (
                <div className="absolute right-0 mt-2 w-56 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-xs font-medium text-slate-400 px-2 py-1 mb-1 border-b border-slate-800 flex justify-between items-center">
                    <span>집중 & 이완 사운드</span>
                    {isPlayingAudio && (
                      <button
                        onClick={handleStopSound}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        끄기
                      </button>
                    )}
                  </div>
                  <div className="space-y-1">
                    <button
                      onClick={() => handleToggleSound('rain')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        isPlayingAudio && currentSound === 'rain'
                          ? 'bg-amber-500/20 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                      <span>창가에 내리는 밤 빗소리</span>
                    </button>
                    <button
                      onClick={() => handleToggleSound('fire')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        isPlayingAudio && currentSound === 'fire'
                          ? 'bg-amber-500/20 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>타닥타닥 따뜻한 모닥불</span>
                    </button>
                    <button
                      onClick={() => handleToggleSound('focus')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        isPlayingAudio && currentSound === 'focus'
                          ? 'bg-amber-500/20 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Wind className="w-3.5 h-3.5 text-teal-400" />
                      <span>조용한 독서실 백색소음</span>
                    </button>
                    <button
                      onClick={() => handleToggleSound('bell')}
                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-left transition-colors ${
                        isPlayingAudio && currentSound === 'bell'
                          ? 'bg-amber-500/20 text-amber-300 font-medium'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>432Hz 평온 싱잉볼</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <nav className="flex items-center gap-1 sm:gap-2 py-2 overflow-x-auto no-scrollbar text-xs font-medium">
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>💬</span>
            <span>1:1 마음 상담</span>
          </button>

          <button
            onClick={() => setActiveTab('prescription')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'prescription'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>💊</span>
            <span>오늘의 마음 처방전</span>
          </button>

          <button
            onClick={() => setActiveTab('dissolve')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'dissolve'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>✨</span>
            <span>속마음 털어내기</span>
          </button>

          <button
            onClick={() => setActiveTab('breathe')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'breathe'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>🫁</span>
            <span>4-7-8 이완 호흡</span>
          </button>

          <button
            onClick={() => setActiveTab('mood')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mood'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>📊</span>
            <span>감정 일기 (Mood)</span>
          </button>

          <button
            onClick={() => setActiveTab('pomodoro')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pomodoro'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span>⏱️</span>
            <span>뽀모도로 (Focus)</span>
          </button>

          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3 py-2 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ml-auto ${
              activeTab === 'notes'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            <span>응원 쪽지함</span>
            {savedNotesCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/30 text-amber-300 font-mono">
                {savedNotesCount}
              </span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

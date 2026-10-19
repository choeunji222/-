import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Maximize2,
  Minimize2,
  Bell,
  Coffee,
  Brain,
  CheckCircle2,
  Flame,
  CloudRain,
  Wind,
} from 'lucide-react';
import { ambientAudio } from '../utils/ambientAudio';

type SessionType = 'focus' | 'break';

const FOCUS_PRESETS = [
  { label: '25분', minutes: 25, tag: '클래식' },
  { label: '50분', minutes: 50, tag: '표준 수험' },
  { label: '80분', minutes: 80, tag: '수능 국어' },
  { label: '100분', minutes: 100, tag: '수능 수학' },
];

const BREAK_PRESETS = [
  { label: '5분', minutes: 5, tag: '스트레칭' },
  { label: '10분', minutes: 10, tag: '표준 쉼' },
  { label: '15분', minutes: 15, tag: '충분한 휴식' },
];

const FLOW_QUOTES = [
  '시계를 보지 마세요. 시간은 흐르고, 당신의 실력은 깊어지고 있습니다.',
  '남들의 속도가 아닌, 내 호흡에 맞추어 오늘의 한 페이지를 온전히 소화하기.',
  '지나간 시간은 잊고, 지금 마주한 이 순간에만 온전히 나를 선물하세요.',
  '수능 시험장의 긴장을 이겨낼 단단함은 지금 이 고요한 몰입에서 피어납니다.',
  '완벽하지 않아도 괜찮아요. 끝까지 자리를 지킨 그 자체가 대단한 승리입니다.',
];

export const PomodoroTimer: React.FC = () => {
  const [sessionType, setSessionType] = useState<SessionType>('focus');
  const [focusMinutes, setFocusMinutes] = useState<number>(25);
  const [breakMinutes, setBreakMinutes] = useState<number>(5);
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isZenMode, setIsZenMode] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeAmbience, setActiveAmbience] = useState<'rain' | 'fire' | 'focus' | 'bell' | null>(null);

  // Daily study progress tracking
  const [completedSessions, setCompletedSessions] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('todak_completed_pomodoros');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set initial time when session type or minutes change and timer is idle
  useEffect(() => {
    if (!isRunning) {
      const targetMins = sessionType === 'focus' ? focusMinutes : breakMinutes;
      setTimeLeft(targetMins * 60);
    }
  }, [sessionType, focusMinutes, breakMinutes]);

  // Main countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, sessionType]);

  // Rotate quotes periodically
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % FLOW_QUOTES.length);
    }, 15000);
    return () => clearInterval(quoteInterval);
  }, []);

  const handleSessionComplete = () => {
    setIsRunning(false);

    if (soundEnabled) {
      ambientAudio.playChime('complete');
    }

    if (sessionType === 'focus') {
      const nextCount = completedSessions + 1;
      setCompletedSessions(nextCount);
      try {
        localStorage.setItem('todak_completed_pomodoros', nextCount.toString());
      } catch (e) {
        console.error(e);
      }
      // Auto transition to break
      setSessionType('break');
      setTimeLeft(breakMinutes * 60);
    } else {
      // Auto transition back to focus
      setSessionType('focus');
      setTimeLeft(focusMinutes * 60);
    }
  };

  const toggleStartPause = () => {
    if (!isRunning) {
      if (soundEnabled && timeLeft > 0) {
        ambientAudio.playChime('start');
      }
      setIsRunning(true);
    } else {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    const targetMins = sessionType === 'focus' ? focusMinutes : breakMinutes;
    setTimeLeft(targetMins * 60);
  };

  const handleSelectFocusPreset = (mins: number) => {
    if (isRunning) {
      if (!window.confirm('진행 중인 세션을 중단하고 시간을 변경하시겠습니까?')) return;
    }
    setIsRunning(false);
    setSessionType('focus');
    setFocusMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const handleSelectBreakPreset = (mins: number) => {
    if (isRunning) {
      if (!window.confirm('진행 중인 세션을 중단하고 시간을 변경하시겠습니까?')) return;
    }
    setIsRunning(false);
    setSessionType('break');
    setBreakMinutes(mins);
    setTimeLeft(mins * 60);
  };

  const handleToggleAmbience = (type: 'rain' | 'fire' | 'focus' | 'bell') => {
    if (activeAmbience === type) {
      ambientAudio.stop();
      setActiveAmbience(null);
    } else {
      ambientAudio.play(type);
      setActiveAmbience(type);
    }
  };

  // Time calculations
  const totalDuration = (sessionType === 'focus' ? focusMinutes : breakMinutes) * 60;
  const progressPercent = totalDuration > 0 ? ((totalDuration - timeLeft) / totalDuration) * 100 : 0;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular progress math
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div
      className={`transition-all duration-500 ${
        isZenMode
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between p-6 sm:p-12 overflow-y-auto'
          : 'max-w-4xl mx-auto space-y-6'
      }`}
    >
      {/* Zen Mode Header / Standard Header */}
      {isZenMode ? (
        <div className="flex items-center justify-between max-w-4xl w-full mx-auto">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              독서실 몰입 젠 모드 (Zen Mode)
            </span>
          </div>

          <button
            onClick={() => setIsZenMode(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>표준 화면으로 복귀</span>
          </button>
        </div>
      ) : (
        <div className="text-center space-y-2 py-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium">
            <Brain className="w-3.5 h-3.5 text-amber-400" />
            <span>N수생을 위한 뽀모도로 몰입 타이머</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
            시간의 압박 대신, 온전한 몰입의 흐름(Flow) 속으로
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            수능 국어·수학 실전 모드부터 차분한 25분 뽀모도로까지,
            잡념을 비우고 눈앞의 과제에 깊이 몰입하도록 돕습니다.
          </p>
        </div>
      )}

      {/* Main Timer Display Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-sm relative overflow-hidden flex flex-col items-center justify-center space-y-6">
        {/* Calming Flow Background Aura Animation */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
          {isRunning && (
            <>
              <div
                className={`w-96 h-96 rounded-full blur-3xl opacity-20 transition-all duration-1000 ${
                  sessionType === 'focus'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 animate-pulse'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 animate-pulse'
                }`}
              />
              <div className="absolute w-[450px] h-[450px] rounded-full border border-amber-500/10 animate-ping opacity-30 duration-1000" />
            </>
          )}
        </div>

        {/* Top Controls: Mode Switch & Sound / Zen Buttons */}
        <div className="w-full flex items-center justify-between z-10">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => {
                setSessionType('focus');
                if (!isRunning) setTimeLeft(focusMinutes * 60);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                sessionType === 'focus'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>몰입 집중 ({focusMinutes}분)</span>
            </button>
            <button
              onClick={() => {
                setSessionType('break');
                if (!isRunning) setTimeLeft(breakMinutes * 60);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
                sessionType === 'break'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>휴식 쉼표 ({breakMinutes}분)</span>
            </button>
          </div>

          {/* Quick Utility Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border text-xs transition-colors ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-700 text-amber-300'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title={soundEnabled ? '시작/완료 사운드 켜짐' : '무음 모드 (도서관 권장)'}
            >
              {soundEnabled ? <Bell className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {!isZenMode && (
              <button
                onClick={() => setIsZenMode(true)}
                className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="독서실 젠 모드 (전면 집중)"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Circular Clock Display */}
        <div className="relative flex items-center justify-center z-10 my-2">
          <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90">
            {/* Background ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className="text-slate-800/80 stroke-current"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Progress animated ring */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              className={`stroke-current transition-all duration-1000 ease-linear ${
                sessionType === 'focus' ? 'text-amber-400' : 'text-teal-400'
              }`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Center Digital Clock Content */}
          <div className="absolute flex flex-col items-center justify-center text-center space-y-1">
            <span
              className={`text-5xl sm:text-6xl font-mono font-bold tracking-tight tabular-nums ${
                sessionType === 'focus' ? 'text-slate-100' : 'text-teal-200'
              }`}
            >
              {formattedTime}
            </span>

            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {sessionType === 'focus' ? 'FOCUS FLOW' : 'REST & RECHARGE'}
            </span>

            {/* Quick completion badge */}
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-400/90 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>오늘 완료: {completedSessions}세션</span>
            </div>
          </div>
        </div>

        {/* Play / Pause / Reset Control Buttons */}
        <div className="flex items-center gap-3 z-10">
          <button
            onClick={toggleStartPause}
            className={`px-7 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : sessionType === 'focus'
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>잠시 멈춤</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>{sessionType === 'focus' ? '몰입 시작' : '휴식 시작'}</span>
              </>
            )}
          </button>

          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="타이머 리셋"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient Sound Shortcut Bar (inside timer card) */}
        <div className="w-full pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-center gap-2 z-10 text-xs">
          <span className="text-[11px] text-slate-500 flex items-center gap-1 mr-1">
            <Volume2 className="w-3 h-3 text-slate-400" />
            <span>배경 소음:</span>
          </span>

          <button
            onClick={() => handleToggleAmbience('focus')}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              activeAmbience === 'focus'
                ? 'bg-teal-500/20 text-teal-300 border-teal-500/40 font-medium'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wind className="w-3 h-3 text-teal-400" />
            <span>독서실 백색소음</span>
          </button>

          <button
            onClick={() => handleToggleAmbience('rain')}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              activeAmbience === 'rain'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-medium'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3 h-3 text-blue-400" />
            <span>밤 빗소리</span>
          </button>

          <button
            onClick={() => handleToggleAmbience('fire')}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              activeAmbience === 'fire'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>모닥불</span>
          </button>

          <button
            onClick={() => handleToggleAmbience('bell')}
            className={`px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors ${
              activeAmbience === 'bell'
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-medium'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>432Hz 싱잉볼</span>
          </button>
        </div>

        {/* Mindful Calm Flow Quote */}
        <div className="text-center max-w-md px-4 pt-1 z-10">
          <p className="text-xs text-slate-400 font-serif leading-relaxed italic transition-opacity duration-500">
            "{FLOW_QUOTES[quoteIndex]}"
          </p>
        </div>
      </div>

      {/* Preset Customization Sections (Hidden in Zen Mode to remove clutter) */}
      {!isZenMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Focus Presets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Brain className="w-3.5 h-3.5 text-amber-400" />
                <span>몰입 집중 시간 프리셋</span>
              </span>
              <span className="text-[11px] text-slate-500">수능 실전 대비</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {FOCUS_PRESETS.map((p) => {
                const isSelected = focusMinutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    onClick={() => handleSelectFocusPreset(p.minutes)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500/50 text-slate-100 ring-1 ring-amber-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{p.label}</span>
                      <span className="text-[10px] text-amber-400/90">{p.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom Minutes Input */}
            <div className="pt-1 flex items-center justify-between text-xs">
              <span className="text-[11px] text-slate-400">직접 시간 설정:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={focusMinutes}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(180, parseInt(e.target.value, 10) || 1));
                    handleSelectFocusPreset(val);
                  }}
                  className="w-16 rounded-lg bg-slate-950 border border-slate-800 px-2 py-1 text-center font-mono text-slate-200 text-xs focus:outline-none focus:border-amber-500/50"
                />
                <span className="text-slate-400">분</span>
              </div>
            </div>
          </div>

          {/* Break Presets */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <Coffee className="w-3.5 h-3.5 text-teal-400" />
                <span>마음 쉼표 휴식 프리셋</span>
              </span>
              <span className="text-[11px] text-slate-500">눈과 뇌의 휴식</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {BREAK_PRESETS.map((p) => {
                const isSelected = breakMinutes === p.minutes;
                return (
                  <button
                    key={p.minutes}
                    onClick={() => handleSelectBreakPreset(p.minutes)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-teal-500/15 border-teal-500/50 text-slate-100 ring-1 ring-teal-500/30'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-200">{p.label}</span>
                      <span className="text-[10px] text-teal-400/90 mt-0.5">{p.tag}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mindful Break Advice */}
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800/70 text-[11px] text-slate-400 leading-relaxed">
              <span className="text-teal-400 font-semibold block mb-0.5">💡 휴식 시간 팁</span>
              스마트폰을 보는 대신, 창밖 먼 곳을 바라보며 눈 근육을 풀고 물 한 잔을 마셔보세요.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Heart, ShieldCheck } from 'lucide-react';
import { incrementStatOnServer } from '../utils/api';

type BreathPhase = 'idle' | 'inhale' | 'hold' | 'exhale';

export const BreathingGuide: React.FC = () => {
  const [phase, setPhase] = useState<BreathPhase>('idle');
  const [secondsLeft, setSecondsLeft] = useState<number>(4);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (isActive) {
      timer = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev > 1) {
            return prev - 1;
          }

          // Transition to next phase
          if (phase === 'inhale') {
            setPhase('hold');
            return 7;
          } else if (phase === 'hold') {
            setPhase('exhale');
            return 8;
          } else if (phase === 'exhale' || phase === 'idle') {
            setCycleCount((c) => {
              const next = c + 1;
              incrementStatOnServer('breathingSessionsCount', 1).catch(() => {});
              return next;
            });
            setPhase('inhale');
            return 4;
          }
          return 4;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isActive, phase]);

  const handleStart = () => {
    setIsActive(true);
    if (phase === 'idle') {
      setPhase('inhale');
      setSecondsLeft(4);
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('idle');
    setSecondsLeft(4);
    setCycleCount(0);
  };

  const getPhaseInfo = () => {
    switch (phase) {
      case 'inhale':
        return {
          title: '코로 숨을 천천히 들이마십니다',
          desc: '맑고 시원한 공기가 온몸을 가득 채웁니다',
          color: 'text-teal-300',
          circleScale: 'scale-125',
          circleBg: 'from-teal-500/20 to-emerald-500/30 border-teal-500/50',
        };
      case 'hold':
        return {
          title: '숨을 편안하게 멈춥니다',
          desc: '차분한 고요함 속에 마음을 잠시 머뭅니다',
          color: 'text-amber-300',
          circleScale: 'scale-125',
          circleBg: 'from-amber-500/20 to-orange-500/30 border-amber-500/50',
        };
      case 'exhale':
        return {
          title: '입으로 숨을 길게 내쉽니다',
          desc: '몸속의 긴장과 불안이 공기 중으로 빠져나갑니다',
          color: 'text-indigo-300',
          circleScale: 'scale-90',
          circleBg: 'from-indigo-500/20 to-purple-500/30 border-indigo-500/50',
        };
      default:
        return {
          title: '준비되셨나요?',
          desc: '심박수를 안정시키고 뇌에 산소를 공급하는 4-7-8 이완 호흡법',
          color: 'text-slate-300',
          circleScale: 'scale-100',
          circleBg: 'from-slate-800 to-slate-900 border-slate-700',
        };
    }
  };

  const phaseInfo = getPhaseInfo();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro */}
      <div className="text-center space-y-2 py-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
          <span>신경계 안정 & 공황 이완 솔루션</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100">
          4-7-8 마인드풀 호흡 가이드
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
          모의고사 직전, 독서실에서 갑자기 숨이 가빠지고 머리가 하얘질 때 3분만 따라 해보세요.
          부교감신경이 활성화되어 굳었던 몸과 마음이 부드럽게 이완됩니다.
        </p>
      </div>

      {/* Main Breathing Circle Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 sm:p-12 shadow-sm flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
        {/* Animated breathing circle */}
        <div className="relative flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
          {/* Outer glowing ripple */}
          <div
            className={`absolute inset-0 rounded-full border-2 bg-gradient-to-tr ${phaseInfo.circleBg} transition-transform duration-1000 ease-in-out ${phaseInfo.circleScale}`}
          />

          {/* Inner core */}
          <div className="relative z-10 text-center space-y-1">
            <span className={`text-4xl sm:text-5xl font-mono font-bold tabular-nums ${phaseInfo.color}`}>
              {phase === 'idle' ? '4-7-8' : `${secondsLeft}s`}
            </span>
            <p className="text-xs font-semibold text-slate-200 uppercase tracking-widest">
              {phase === 'idle'
                ? '호흡 시작'
                : phase === 'inhale'
                ? '들이마시기'
                : phase === 'hold'
                ? '숨 멈추기'
                : '내쉬기'}
            </p>
          </div>
        </div>

        {/* Phase textual guide */}
        <div className="text-center space-y-1.5 max-w-md">
          <h2 className={`text-base font-bold ${phaseInfo.color}`}>{phaseInfo.title}</h2>
          <p className="text-xs text-slate-400 leading-relaxed">{phaseInfo.desc}</p>
          {cycleCount > 0 && (
            <p className="text-[11px] text-teal-400/90 pt-1 font-mono">
              완료한 호흡 사이클: {cycleCount}회
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {!isActive ? (
            <button
              onClick={handleStart}
              className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-teal-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>호흡 시작하기</span>
            </button>
          ) : (
            <button
              onClick={handlePause}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm flex items-center gap-2 border border-slate-700 transition-all"
            >
              <Pause className="w-4 h-4" />
              <span>잠시 멈춤</span>
            </button>
          )}

          <button
            onClick={handleReset}
            className="p-2.5 rounded-xl bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="처음부터 다시하기"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Science Tips */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs font-semibold text-teal-400 flex items-center gap-1.5">
            <span>🫁</span> 4초 들이마시기
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            코로 부드럽게 들이마시며 폐의 가장 깊은 곳까지 산소를 가득 채웁니다.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <span>⏸️</span> 7초 숨 멈추기
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            충분한 산소가 혈류로 전달되며 불안으로 과열된 뇌의 편도체를 진정시킵니다.
          </p>
        </div>
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
          <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1.5">
            <span>🌬️</span> 8초 천천히 내쉬기
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            입술을 둥글게 모아 촛불을 끄듯 길게 내쉬며 교감신경을 이완시킵니다.
          </p>
        </div>
      </div>
    </div>
  );
};

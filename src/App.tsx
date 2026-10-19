import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatView } from './components/ChatView';
import { PrescriptionView } from './components/PrescriptionView';
import { DissolveWorryView } from './components/DissolveWorryView';
import { BreathingGuide } from './components/BreathingGuide';
import { DailyMoodTracker } from './components/DailyMoodTracker';
import { PomodoroTimer } from './components/PomodoroTimer';
import { NotesVaultView } from './components/NotesVaultView';
import { SavedComfortNote } from './types';
import {
  getNotesFromServer,
  saveNoteToServer,
  deleteNoteFromServer,
  getStatsFromServer,
  AppServerStats,
} from './utils/api';
import { Database, ShieldCheck, Heart } from 'lucide-react';

const INITIAL_DEFAULT_NOTES: SavedComfortNote[] = [
  {
    id: 'default-note-1',
    title: '삼수를 완주한 선배가 독서실 책상에 붙여두었던 글',
    content: '내가 보낸 이 고독한 1년은 결코 실패의 반복이 아니야. 내 평생에서 가장 치열하게 나 자신을 마주하고, 나를 믿어주는 법을 배우는 가장 귀한 시간이야.',
    date: '2026.10',
    author: 'N수 완주 선배',
    sourceType: 'quote',
  },
  {
    id: 'default-note-2',
    title: '모의고사 성적이 흔들릴 때 기억할 사실',
    content: '성적이 떨어진 건 네 가치가 떨어진 게 아니야. 수능 시험장 가기 전에 보완해야 할 구멍을 미리 발견한 행운일 뿐이야. 담담하게 오답 정리하고 푹 자자.',
    date: '2026.10',
    author: '마음챙김 센터',
    sourceType: 'quote',
  },
  {
    id: 'default-note-3',
    title: '친구들이 대학 캠퍼스를 누빌 때 흔들리는 마음에게',
    content: '남들의 시계에 내 인생을 맞출 필요 없어. 각자의 봄은 피어나는 시기가 다를 뿐이야. 너의 계절은 조금 늦게 오더라도 그 어떤 계절보다 눈부실 거야.',
    date: '2026.10',
    author: '토닥',
    sourceType: 'quote',
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'prescription' | 'dissolve' | 'breathe' | 'mood' | 'pomodoro' | 'notes'>('chat');
  const [savedNotes, setSavedNotes] = useState<SavedComfortNote[]>(INITIAL_DEFAULT_NOTES);
  const [serverStats, setServerStats] = useState<AppServerStats>({
    dissolvedWorriesCount: 0,
    breathingSessionsCount: 0,
    counselingTurnsCount: 0,
  });
  const [isServerConnected, setIsServerConnected] = useState<boolean>(true);

  // Load notes and stats from backend server on initial render
  useEffect(() => {
    let isMounted = true;

    // Load notes
    getNotesFromServer()
      .then((notes) => {
        if (isMounted && notes.length > 0) {
          setSavedNotes(notes);
          setIsServerConnected(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load notes from server:', err);
        setIsServerConnected(false);
      });

    // Load stats
    getStatsFromServer()
      .then((stats) => {
        if (isMounted && stats) {
          setServerStats(stats);
        }
      })
      .catch((err) => {
        console.error('Failed to load stats from server:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSaveNote = async (noteData: Omit<SavedComfortNote, 'id' | 'date'>) => {
    try {
      const saved = await saveNoteToServer(noteData);
      setSavedNotes((prev) => [saved, ...prev]);
      setIsServerConnected(true);
    } catch (err) {
      console.error('Failed to save note to server:', err);
      // Fallback local state
      const fallbackNote: SavedComfortNote = {
        ...noteData,
        id: `note-${Date.now()}`,
        date: new Date().toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        }),
      };
      setSavedNotes((prev) => [fallbackNote, ...prev]);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNoteFromServer(id);
      setSavedNotes((prev) => prev.filter((n) => n.id !== id));
      setIsServerConnected(true);
    } catch (err) {
      console.error('Failed to delete note from server:', err);
      setSavedNotes((prev) => prev.filter((n) => n.id !== id));
    }
  };

  const handleAddCustomNote = (title: string, content: string) => {
    handleSaveNote({
      title,
      content,
      author: '나의 다짐',
      sourceType: 'self',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        savedNotesCount={savedNotes.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'chat' && (
          <ChatView onSaveNote={handleSaveNote} savedNotes={savedNotes} />
        )}

        {activeTab === 'prescription' && (
          <PrescriptionView onSaveNote={handleSaveNote} />
        )}

        {activeTab === 'dissolve' && (
          <DissolveWorryView onSaveNote={handleSaveNote} />
        )}

        {activeTab === 'breathe' && (
          <BreathingGuide />
        )}

        {activeTab === 'mood' && (
          <DailyMoodTracker />
        )}

        {activeTab === 'pomodoro' && (
          <PomodoroTimer />
        )}

        {activeTab === 'notes' && (
          <NotesVaultView
            notes={savedNotes}
            onDeleteNote={handleDeleteNote}
            onAddCustomNote={handleAddCustomNote}
          />
        )}
      </main>

      {/* Footer with Server Status & Encouragement */}
      <footer className="border-t border-slate-900 py-6 text-xs text-slate-500 bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-400">토닥 (Todak)</span>
            <span>· N수생들의 고단한 수험 여정을 온 마음으로 응원합니다.</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            {/* Backend Database Status Badge */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800">
              <Database className="w-3 h-3 text-teal-400" />
              <span>백엔드 데이터베이스 저장:</span>
              <span className={`font-medium ${isServerConnected ? 'text-teal-300' : 'text-amber-400'}`}>
                {isServerConnected ? '정상 연결' : '로컬 모드'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isServerConnected ? 'bg-teal-400' : 'bg-amber-400'}`} />
            </div>

            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-500">
              오늘 하루도 온 힘을 다해 버텨낸 당신, 참 대단해요.
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

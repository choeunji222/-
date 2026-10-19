import React, { useState, useRef, useEffect } from 'react';
import { Send, Bookmark, BookmarkCheck, RotateCcw, Sparkles, AlertCircle, Check, Copy, Database, Cloud } from 'lucide-react';
import { PersonaId, Persona, ChatMessage, PERSONAS, MOODS, EmotionalMood, SavedComfortNote } from '../types';
import { getChatsFromServer, syncChatToServer, resetChatOnServer, recordMoodOnServer } from '../utils/api';

interface ChatViewProps {
  onSaveNote: (note: Omit<SavedComfortNote, 'id' | 'date'>) => void;
  savedNotes: SavedComfortNote[];
}

export const ChatView: React.FC<ChatViewProps> = ({ onSaveNote, savedNotes }) => {
  const [selectedPersonaId, setSelectedPersonaId] = useState<PersonaId>('warm_senior');
  const [selectedMood, setSelectedMood] = useState<EmotionalMood | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isServerSynced, setIsServerSynced] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedIdList, setSavedIdList] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const currentPersona = PERSONAS.find((p) => p.id === selectedPersonaId) || PERSONAS[0];

  // Conversation history state per persona
  const [conversations, setConversations] = useState<Record<PersonaId, ChatMessage[]>>({
    warm_senior: [
      {
        id: 'init-warm_senior',
        role: 'assistant',
        content: PERSONAS[0].initialGreeting,
        timestamp: Date.now(),
        personaId: 'warm_senior',
      },
    ],
    empathy_counselor: [
      {
        id: 'init-empathy_counselor',
        role: 'assistant',
        content: PERSONAS[1].initialGreeting,
        timestamp: Date.now(),
        personaId: 'empathy_counselor',
      },
    ],
    study_pacemaker: [
      {
        id: 'init-study_pacemaker',
        role: 'assistant',
        content: PERSONAS[2].initialGreeting,
        timestamp: Date.now(),
        personaId: 'study_pacemaker',
      },
    ],
    cheering_friend: [
      {
        id: 'init-cheering_friend',
        role: 'assistant',
        content: PERSONAS[3].initialGreeting,
        timestamp: Date.now(),
        personaId: 'cheering_friend',
      },
    ],
  });

  // Fetch persisted chat conversations from backend server on mount
  useEffect(() => {
    let isMounted = true;
    getChatsFromServer()
      .then((serverChats) => {
        if (isMounted && serverChats && Object.keys(serverChats).length > 0) {
          setConversations((prev) => ({
            ...prev,
            ...serverChats,
          }));
          setIsServerSynced(true);
        }
      })
      .catch((err) => {
        console.error('Failed to load chats from server:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const activeMessages = conversations[selectedPersonaId] || [];

  // Auto-scroll to bottom of thread
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages, isLoading]);

  const handleMoodSelect = async (mood: EmotionalMood | null) => {
    setSelectedMood(mood);
    if (mood) {
      try {
        await recordMoodOnServer(mood);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setErrorMsg(null);
    setInputMessage('');

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      personaId: selectedPersonaId,
    };

    const updatedWithUser = [...activeMessages, userMessage];

    setConversations((prev) => ({
      ...prev,
      [selectedPersonaId]: updatedWithUser,
    }));

    setIsLoading(true);
    setIsServerSynced(false);

    try {
      // Map messages for Gemini API
      const messagesPayload = updatedWithUser.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messagesPayload,
          persona: selectedPersonaId,
          mood: selectedMood || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || '답변을 불러오는 데 실패했습니다.');
      }

      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
        personaId: selectedPersonaId,
      };

      const finalMessages = [...updatedWithUser, assistantMessage];

      setConversations((prev) => ({
        ...prev,
        [selectedPersonaId]: finalMessages,
      }));

      // Persist conversation to backend server
      await syncChatToServer(selectedPersonaId, finalMessages);
      setIsServerSynced(true);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorMsg(err.message || '상담원과의 연결에 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = async () => {
    if (window.confirm('현재 상담사와의 대화 기록을 초기화하시겠습니까? (서버 데이터도 초기화됩니다)')) {
      const initialGreeting = currentPersona.initialGreeting;
      try {
        const resetMsgs = await resetChatOnServer(selectedPersonaId, initialGreeting);
        setConversations((prev) => ({
          ...prev,
          [selectedPersonaId]: resetMsgs,
        }));
        setIsServerSynced(true);
      } catch (e) {
        console.error(e);
        // Fallback local reset
        setConversations((prev) => ({
          ...prev,
          [selectedPersonaId]: [
            {
              id: `init-${selectedPersonaId}-${Date.now()}`,
              role: 'assistant',
              content: initialGreeting,
              timestamp: Date.now(),
              personaId: selectedPersonaId,
            },
          ],
        }));
      }
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotes = (msg: ChatMessage) => {
    onSaveNote({
      title: `${currentPersona.name}의 토닥임`,
      content: msg.content,
      author: currentPersona.name,
      sourceType: 'counselor',
    });
    setSavedIdList((prev) => [...prev, msg.id]);
  };

  const isSaved = (msgId: string) => {
    return savedIdList.includes(msgId);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-6xl mx-auto h-[calc(100vh-140px)] min-h-[600px]">
      {/* Left Sidebar: Mentor / Persona Selector & Mood check */}
      <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300">상담 멘토 선택</span>
            <span className="text-[11px] text-slate-500">4명의 든든한 조력자</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
            {PERSONAS.map((persona) => {
              const isSelected = selectedPersonaId === persona.id;
              return (
                <button
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={`text-left p-3 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${persona.avatarBg} flex items-center justify-center text-lg shrink-0 shadow-sm`}
                    >
                      {persona.avatarEmoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-100">{persona.name}</span>
                        <span className="text-[10px] text-slate-400">· {persona.role}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{persona.tagline}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60 text-[11px] text-slate-400">
            <span className="text-amber-400 font-medium">{currentPersona.name} 추천:</span>{' '}
            {currentPersona.recommendedFor}
          </div>
        </div>

        {/* Current Mood Grounding */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2.5">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
            <span className="text-xs font-semibold text-slate-300">지금 내 감정 상태</span>
            {selectedMood && (
              <button
                onClick={() => setSelectedMood(null)}
                className="text-[11px] text-slate-500 hover:text-slate-300"
              >
                초기화
              </button>
            )}
          </div>
          <p className="text-[11px] text-slate-400">
            감정을 선택하면 멘토가 그 상태에 맞춰 더 세심하게 다독여 줍니다.
          </p>

          <div className="grid grid-cols-2 gap-1.5">
            {MOODS.map((item) => {
              const isSelected = selectedMood === item.mood;
              return (
                <button
                  key={item.mood}
                  onClick={() => {
                    const newMood = isSelected ? null : item.mood;
                    handleMoodSelect(newMood);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium border text-left flex items-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-semibold'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className="truncate">{item.mood}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Main: Scrollable Chat Thread */}
      <div className="flex-1 flex flex-col bg-slate-900/80 border border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Chat Thread Header */}
        <div className="p-3.5 px-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${currentPersona.avatarBg} flex items-center justify-center text-sm shadow-sm`}
            >
              {currentPersona.avatarEmoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-100">{currentPersona.name}</span>
                <span className="text-xs text-slate-400">({currentPersona.role})</span>
              </div>
              <p className="text-[11px] text-slate-400">{currentPersona.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Server Storage Sync Indicator */}
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400"
              title="백엔드 서버에 실시간으로 안전하게 저장됩니다"
            >
              <Database className="w-3 h-3 text-teal-400" />
              <span className="hidden sm:inline">
                {isServerSynced ? '서버 저장됨' : '저장 중...'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${isServerSynced ? 'bg-teal-400' : 'bg-amber-400 animate-pulse'}`} />
            </div>

            <button
              onClick={handleResetChat}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 transition-colors"
              title="대화 새로 시작하기"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {activeMessages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {!isUser && (
                  <div
                    className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentPersona.avatarBg} flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-sm`}
                  >
                    {currentPersona.avatarEmoji}
                  </div>
                )}

                <div className="flex flex-col gap-1.5 max-w-[85%] sm:max-w-[78%]">
                  <div
                    className={`p-3.5 rounded-2xl text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-amber-500/20 border border-amber-500/30 text-amber-100 rounded-tr-sm'
                        : 'bg-slate-950/70 border border-slate-800/80 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>

                  {/* Actions for Assistant Message */}
                  {!isUser && (
                    <div className="flex items-center gap-3 px-1 text-[11px] text-slate-500">
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                      <button
                        onClick={() => handleCopyText(msg.id, msg.content)}
                        className="hover:text-slate-300 transition-colors flex items-center gap-1"
                        title="텍스트 복사"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">복사됨</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>복사</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSaveToNotes(msg)}
                        className="hover:text-amber-300 transition-colors flex items-center gap-1"
                        title="응원 쪽지함에 보관"
                      >
                        {isSaved(msg.id) ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-amber-400" />
                            <span className="text-amber-400 font-medium">보관됨</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3" />
                            <span>쪽지함 보관</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {isUser && (
                    <span className="text-[10px] text-slate-500 self-end px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Typing/Thinking indicator */}
          {isLoading && (
            <div className="flex gap-3 max-w-2xl mr-auto animate-pulse">
              <div
                className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${currentPersona.avatarBg} flex items-center justify-center text-xs shrink-0 shadow-sm`}
              >
                {currentPersona.avatarEmoji}
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin text-amber-400" />
                <span>{currentPersona.name}이(가) 마음을 담아 답변을 적고 있어요...</span>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Crisis Prompt Starters */}
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40 overflow-x-auto no-scrollbar flex items-center gap-1.5">
          <span className="text-[11px] text-slate-500 shrink-0 font-medium">자주 털어놓는 고민:</span>
          {[
            '모의고사 성적이 떨어져서 눈물이 나요',
            '친구들 인스타 보면서 자괴감이 들어요',
            '부모님께 죄송해서 숨이 막혀요',
            '하루 종일 멍때리고 공부가 안돼요',
            '이번에도 실패하면 어쩌죠?',
          ].map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              disabled={isLoading}
              className="text-[11px] text-slate-300 hover:text-amber-300 bg-slate-900 border border-slate-800 hover:border-slate-700 px-2.5 py-1 rounded-md shrink-0 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800">
          <div className="relative flex items-end gap-2 bg-slate-950 rounded-xl border border-slate-800 p-2 focus-within:border-amber-500/50 focus-within:ring-1 focus-within:ring-amber-500/20 transition-all">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`${currentPersona.name}에게 마음속 응어리를 편하게 털어놓아 보세요. (Enter 전송, Shift+Enter 줄바꿈)`}
              rows={2}
              className="w-full bg-transparent text-slate-200 placeholder:text-slate-500 text-xs sm:text-[13px] resize-none outline-none leading-relaxed p-1"
            />

            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              className="shrink-0 p-2 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 disabled:opacity-30 disabled:hover:bg-amber-500 transition-colors font-medium flex items-center justify-center shadow-sm"
              title="전송"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

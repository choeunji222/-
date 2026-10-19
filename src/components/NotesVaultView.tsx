import React, { useState } from 'react';
import { HeartHandshake, Trash2, Copy, Check, Plus, BookOpen, Sparkles } from 'lucide-react';
import { SavedComfortNote } from '../types';

interface NotesVaultViewProps {
  notes: SavedComfortNote[];
  onDeleteNote: (id: string) => void;
  onAddCustomNote: (title: string, content: string) => void;
}

export const NotesVaultView: React.FC<NotesVaultViewProps> = ({
  notes,
  onDeleteNote,
  onAddCustomNote,
}) => {
  const [filter, setFilter] = useState<'all' | 'counselor' | 'prescription' | 'quote' | 'self'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newContent, setNewContent] = useState<string>('');

  const filteredNotes = notes.filter((n) => {
    if (filter === 'all') return true;
    return n.sourceType === filter;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    onAddCustomNote(newTitle.trim() || '미래의 나에게 보내는 응원', newContent.trim());
    setNewTitle('');
    setNewContent('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-100">나의 응원 쪽지 보관함</h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
              {notes.length}개의 온기
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            혼자만의 싸움이 버거울 때 꺼내 읽을 수 있는 소중한 위로와 격려의 조각들입니다.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-xs flex items-center gap-1.5 border border-amber-500/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>나에게 쓰는 응원 쪽지 추가</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar text-xs">
        {[
          { key: 'all', label: '전체 쪽지' },
          { key: 'counselor', label: '상담사 토닥임' },
          { key: 'prescription', label: '마음 처방전' },
          { key: 'quote', label: '선배들의 명언' },
          { key: 'self', label: '내가 쓴 쪽지' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as any)}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              filter === tab.key
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3">
          <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-xs sm:text-sm text-slate-400">
            보관된 쪽지가 아직 없습니다.
          </p>
          <p className="text-xs text-slate-500">
            상담 중 마음에 와닿은 메시지의 [쪽지함 보관] 버튼을 눌러보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-3 shadow-sm transition-all relative group"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {note.title}
                  </span>
                  <span className="text-[11px] text-slate-500 shrink-0 font-mono">
                    {note.date}
                  </span>
                </div>

                <p className="text-xs sm:text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/40 text-[11px] text-slate-500">
                <span className="text-amber-400/90 font-medium">{note.author}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(note.id, note.content)}
                    className="hover:text-slate-200 transition-colors p-1"
                    title="복사"
                  >
                    {copiedId === note.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="hover:text-rose-400 transition-colors p-1"
                    title="삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for adding custom note */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>나에게 건네는 응원 쪽지 작성</span>
            </h2>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">제목</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="예: 수능 30일 전, 불안한 나에게"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">내용</label>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="힘들 때 나를 일으켜 세워줄 단단한 다짐이나 위로의 말을 적어주세요."
                  rows={4}
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 p-2.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold"
                >
                  보관하기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

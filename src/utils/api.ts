import { SavedComfortNote, ChatMessage, PersonaId } from '../types';

export interface MoodRecord {
  id: string;
  mood: string;
  note?: string;
  date: string;
  timestamp: number;
}

export interface AppServerStats {
  dissolvedWorriesCount: number;
  breathingSessionsCount: number;
  counselingTurnsCount: number;
}

// Fetch all notes from backend server
export async function getNotesFromServer(): Promise<SavedComfortNote[]> {
  const res = await fetch('/api/notes');
  if (!res.ok) throw new Error('서버에서 쪽지 목록을 가져오지 못했습니다.');
  const data = await res.json();
  return data.notes || [];
}

// Save a new note to backend server
export async function saveNoteToServer(
  note: Omit<SavedComfortNote, 'id' | 'date'>
): Promise<SavedComfortNote> {
  const res = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  });
  if (!res.ok) throw new Error('서버에 쪽지를 저장하지 못했습니다.');
  const data = await res.json();
  return data.note;
}

// Delete a note from backend server
export async function deleteNoteFromServer(id: string): Promise<boolean> {
  const res = await fetch(`/api/notes/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('서버에서 쪽지 삭제에 실패했습니다.');
  const data = await res.json();
  return data.success;
}

// Fetch all chat histories from backend server
export async function getChatsFromServer(): Promise<Record<string, ChatMessage[]>> {
  const res = await fetch('/api/chats');
  if (!res.ok) throw new Error('서버에서 대화 기록을 가져오지 못했습니다.');
  const data = await res.json();
  return data.chats || {};
}

// Save chat messages for a persona to backend server
export async function syncChatToServer(
  personaId: PersonaId,
  messages: ChatMessage[]
): Promise<void> {
  await fetch(`/api/chats/${personaId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
}

// Reset chat for a persona on backend server
export async function resetChatOnServer(
  personaId: PersonaId,
  initialGreeting: string
): Promise<ChatMessage[]> {
  const res = await fetch(`/api/chats/${personaId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ initialGreeting }),
  });
  if (!res.ok) throw new Error('서버에서 대화를 초기화하지 못했습니다.');
  const data = await res.json();
  return data.messages;
}

// Fetch mood logs from backend server
export async function getMoodsFromServer(): Promise<MoodRecord[]> {
  const res = await fetch('/api/moods');
  if (!res.ok) throw new Error('서버에서 감정 기록을 가져오지 못했습니다.');
  const data = await res.json();
  return data.moods || [];
}

// Record mood on backend server
export async function recordMoodOnServer(mood: string, note?: string): Promise<MoodRecord> {
  const res = await fetch('/api/moods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, note }),
  });
  if (!res.ok) throw new Error('서버에 감정 기록을 저장하지 못했습니다.');
  const data = await res.json();
  return data.mood;
}

// Delete mood from backend server
export async function deleteMoodFromServer(id: string): Promise<boolean> {
  const res = await fetch(`/api/moods/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('서버에서 감정 기록 삭제에 실패했습니다.');
  const data = await res.json();
  return data.success;
}

// Fetch server stats
export async function getStatsFromServer(): Promise<AppServerStats> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error('서버 통계를 가져오지 못했습니다.');
  const data = await res.json();
  return data.stats;
}

// Increment stat on server
export async function incrementStatOnServer(
  stat: keyof AppServerStats,
  amount = 1
): Promise<AppServerStats> {
  const res = await fetch('/api/stats/increment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stat, amount }),
  });
  if (!res.ok) throw new Error('통계 갱신 실패');
  const data = await res.json();
  return data.stats;
}

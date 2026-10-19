import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'todak_db.json');

export interface ServerNote {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  sourceType: 'counselor' | 'prescription' | 'quote' | 'self';
  createdAt: number;
}

export interface ServerChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  personaId?: string;
}

export interface MoodLog {
  id: string;
  mood: string;
  note?: string;
  date: string;
  timestamp: number;
}

export interface ServerStats {
  dissolvedWorriesCount: number;
  breathingSessionsCount: number;
  counselingTurnsCount: number;
}

export interface TodakDatabase {
  notes: ServerNote[];
  chats: Record<string, ServerChatMessage[]>;
  moodLogs: MoodLog[];
  stats: ServerStats;
}

const DEFAULT_NOTES: ServerNote[] = [
  {
    id: 'default-note-1',
    title: '삼수를 완주한 선배가 독서실 책상에 붙여두었던 글',
    content: '내가 보낸 이 고독한 1년은 결코 실패의 반복이 아니야. 내 평생에서 가장 치열하게 나 자신을 마주하고, 나를 믿어주는 법을 배우는 가장 귀한 시간이야.',
    date: '2026.10',
    author: 'N수 완주 선배',
    sourceType: 'quote',
    createdAt: Date.now() - 3600000 * 48,
  },
  {
    id: 'default-note-2',
    title: '모의고사 성적이 흔들릴 때 기억할 사실',
    content: '성적이 떨어진 건 네 가치가 떨어진 게 아니야. 수능 시험장 가기 전에 보완해야 할 구멍을 미리 발견한 행운일 뿐이야. 담담하게 오답 정리하고 푹 자자.',
    date: '2026.10',
    author: '마음챙김 센터',
    sourceType: 'quote',
    createdAt: Date.now() - 3600000 * 24,
  },
  {
    id: 'default-note-3',
    title: '친구들이 대학 캠퍼스를 누빌 때 흔들리는 마음에게',
    content: '남들의 시계에 내 인생을 맞출 필요 없어. 각자의 봄은 피어나는 시기가 다를 뿐이야. 너의 계절은 조금 늦게 오더라도 그 어떤 계절보다 눈부실 거야.',
    date: '2026.10',
    author: '토닥',
    sourceType: 'quote',
    createdAt: Date.now() - 3600000 * 12,
  },
];

const DEFAULT_GREETINGS: Record<string, ServerChatMessage[]> = {
  warm_senior: [
    {
      id: 'init-warm_senior',
      role: 'assistant',
      content: '안녕! 오늘도 독서실에서 정말 고생 많았지. 오늘 하루 어떻게 버텼어? 힘들었던 이야기, 마음 편하게 털어놔도 돼.',
      timestamp: Date.now(),
      personaId: 'warm_senior',
    },
  ],
  empathy_counselor: [
    {
      id: 'init-empathy_counselor',
      role: 'assistant',
      content: '어서 오세요. 지금 어깨에 들어간 긴장을 살짝 풀고, 깊게 숨을 한번 내쉬어 볼까요? 당신의 마음속 어떤 불안도 이곳에서는 안전합니다.',
      timestamp: Date.now(),
      personaId: 'empathy_counselor',
    },
  ],
  study_pacemaker: [
    {
      id: 'init-study_pacemaker',
      role: 'assistant',
      content: '반가워. 지나간 시간 자책하느라 스스로를 괴롭히고 있진 않았어? 괜찮아, 리듬은 지금 이 순간부터 다시 맞추면 돼. 지금 상태가 어때?',
      timestamp: Date.now(),
      personaId: 'study_pacemaker',
    },
  ],
  cheering_friend: [
    {
      id: 'init-cheering_friend',
      role: 'assistant',
      content: '왔어? 오늘 하루도 진짜 고생 많았어. 다른 건 다 제쳐두고, 오늘 밥은 잘 챙겨 먹었어? 따뜻한 핫초코 한 잔 하면서 편하게 수다 떨자.',
      timestamp: Date.now(),
      personaId: 'cheering_friend',
    },
  ],
};

class DatabaseManager {
  private data: TodakDatabase = {
    notes: DEFAULT_NOTES,
    chats: DEFAULT_GREETINGS,
    moodLogs: [],
    stats: {
      dissolvedWorriesCount: 0,
      breathingSessionsCount: 0,
      counselingTurnsCount: 0,
    },
  };
  private isWriting = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          notes: Array.isArray(parsed.notes) ? parsed.notes : DEFAULT_NOTES,
          chats: parsed.chats && typeof parsed.chats === 'object' ? parsed.chats : DEFAULT_GREETINGS,
          moodLogs: Array.isArray(parsed.moodLogs) ? parsed.moodLogs : [],
          stats: parsed.stats || {
            dissolvedWorriesCount: 0,
            breathingSessionsCount: 0,
            counselingTurnsCount: 0,
          },
        };
      } else {
        this.saveSync();
      }
    } catch (err) {
      console.error('Failed to read database file, initializing defaults:', err);
      this.saveSync();
    }
  }

  private saveSync() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to sync save database:', err);
    }
  }

  public async save(): Promise<void> {
    if (this.isWriting) return;
    this.isWriting = true;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        await fs.promises.mkdir(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE}.tmp`;
      await fs.promises.writeFile(tmpFile, JSON.stringify(this.data, null, 2), 'utf-8');
      await fs.promises.rename(tmpFile, DB_FILE);
    } catch (err) {
      console.error('Failed to write database file:', err);
    } finally {
      this.isWriting = false;
    }
  }

  // --- Notes Operations ---
  public getNotes(): ServerNote[] {
    return this.data.notes;
  }

  public async addNote(note: Omit<ServerNote, 'id' | 'createdAt'>): Promise<ServerNote> {
    const newNote: ServerNote = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: Date.now(),
    };
    this.data.notes.unshift(newNote);
    await this.save();
    return newNote;
  }

  public async deleteNote(id: string): Promise<boolean> {
    const initLen = this.data.notes.length;
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
    if (this.data.notes.length !== initLen) {
      await this.save();
      return true;
    }
    return false;
  }

  // --- Chat Operations ---
  public getAllChats(): Record<string, ServerChatMessage[]> {
    return this.data.chats;
  }

  public getChat(personaId: string): ServerChatMessage[] {
    if (!this.data.chats[personaId]) {
      this.data.chats[personaId] = DEFAULT_GREETINGS[personaId] || [];
    }
    return this.data.chats[personaId];
  }

  public async setChat(personaId: string, messages: ServerChatMessage[]): Promise<ServerChatMessage[]> {
    this.data.chats[personaId] = messages;
    await this.save();
    return messages;
  }

  public async resetChat(personaId: string, initialGreeting: string): Promise<ServerChatMessage[]> {
    const initMsg: ServerChatMessage = {
      id: `init-${personaId}-${Date.now()}`,
      role: 'assistant',
      content: initialGreeting,
      timestamp: Date.now(),
      personaId,
    };
    this.data.chats[personaId] = [initMsg];
    await this.save();
    return [initMsg];
  }

  // --- Mood Logs Operations ---
  public getMoodLogs(): MoodLog[] {
    return this.data.moodLogs;
  }

  public async addMoodLog(mood: string, note?: string): Promise<MoodLog> {
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const newLog: MoodLog = {
      id: `mood-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      mood,
      note,
      date: today,
      timestamp: Date.now(),
    };
    this.data.moodLogs.unshift(newLog);
    // Keep max 50 recent mood logs
    if (this.data.moodLogs.length > 50) {
      this.data.moodLogs = this.data.moodLogs.slice(0, 50);
    }
    await this.save();
    return newLog;
  }

  public async deleteMoodLog(id: string): Promise<boolean> {
    const initLen = this.data.moodLogs.length;
    this.data.moodLogs = this.data.moodLogs.filter((m) => m.id !== id);
    if (this.data.moodLogs.length !== initLen) {
      await this.save();
      return true;
    }
    return false;
  }

  // --- Stats Operations ---
  public getStats(): ServerStats {
    return this.data.stats;
  }

  public async incrementStat(stat: keyof ServerStats, amount = 1): Promise<ServerStats> {
    if (typeof this.data.stats[stat] === 'number') {
      this.data.stats[stat] += amount;
      await this.save();
    }
    return this.data.stats;
  }
}

export const db = new DatabaseManager();

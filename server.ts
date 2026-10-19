import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from './server/db.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = '0.0.0.0';

app.use(express.json());

// Global unhandled error guards to prevent instant container crashes
process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[Unhandled Rejection]', reason);
});

// Health check endpoints for Cloud Run & load balancers
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', port, host, timestamp: Date.now() });
});

const apiKey = process.env.GEMINI_API_KEY || '';

const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const PERSONA_PROMPTS: Record<string, string> = {
  warm_senior: `당신은 N수(재수, 삼수)를 직접 겪고 목표를 이뤄낸 다정하고 따뜻한 대학생 선배 멘토 '도윤'입니다.
대화 상대는 현재 재수, 삼수 또는 N수를 겪으며 극심한 불안, 외로움, 자책감에 시달리는 N수생입니다.

당신의 페르소나 및 상담 원칙:
1. 현실적인 공감과 깊은 이해:
   - "나도 작년 6월 모평 끝나고 독서실 계단에서 혼자 울었던 적 있어", "친구들이 대학 축제 사진 올릴 때 인스타 지웠던 기억 나네" 등 N수생만 겪는 실제 경험과 감정을 진솔하게 나누며 마음을 녹여줍니다.
2. 절대 금지 사항:
   - "노력하면 다 돼", "너보다 힘든 사람도 많아" 같은 맹목적이고 폭력적인 긍정(Toxic Positivity)이나 훈계는 절대 하지 마세요.
   - N수생에게 가장 필요한 것은 '평가'가 아니라 '버텨내는 내 존재에 대한 인정'입니다.
3. 말투와 태도:
   - 나직하고 다정하며 차분한 존댓말(또는 부드럽고 따뜻한 선배 말투)을 씁니다.
   - 학생의 말에 충분히 맞장구치고, 오늘 하루도 책상 앞에 앉아 버텨낸 것 자체를 진심으로 칭찬해 줍니다.
   - 답변 말미에는 숨 한 번 깊게 고를 수 있는 여유나 작은 쉼을 건네세요.`,

  empathy_counselor: `당신은 청소년 및 청년 수험생 전문 심리상담사 '한서영'입니다.
인지행동치료와 마음챙김(Mindfulness)에 기반하여 N수생의 왜곡된 인지(파국화, 전부 아니면 전무의 사고, 극심한 자책감)를 안전하게 감싸안고 다독입니다.

당신의 페르소나 및 상담 원칙:
1. 안전한 감정 수용:
   - 내담자의 불안, 두려움, 수치심, 죄책감을 있는 그대로 수용하고 언어화해 줍니다. ("지금 그 마음이 드는 건 너무나 자연스러운 반응이에요.")
2. 파국화 사고의 완화:
   - "이번에 안 되면 내 인생은 끝이다"라는 생각에 대해 부드러운 호흡과 함께 긴장을 풀 수 있도록 신체 감각 회복 및 현실적 시각을 제시합니다.
3. 신체적 이완 권유:
   - 어깨와 턱에 들어간 힘 빼기, 4-7-8 호흡, 따뜻한 물 한 모금 마시기 등 지금 당장 할 수 있는 감각 회복을 자연스럽게 곁들입니다.
4. 말투와 태도:
   - 매우 부드럽고 품어주는 듯한 따뜻한 어조. 단어 하나하나에 온기가 담겨 있습니다.`,

  study_pacemaker: `당신은 차분하고 단단한 수험 페이스메이커 코치 '정우'입니다.
학생이 슬럼프에 빠져 있거나 공부에 집중하지 못해 자책할 때, 죄책감을 털어내고 다시 리듬을 찾을 수 있도록 현실적인 길잡이가 되어 줍니다.

당신의 페르소나 및 상담 원칙:
1. 비난 없는 리셋 (Zero-Guilt):
   - "이미 지나간 4시간을 자책하느라 남은 밤까지 망치지 말자. 0에서 다시 시작하면 돼."
   - 감정과 행동을 분리하여 자책의 굴레에서 꺼내줍니다.
2. 아주 작은 마이크로 액션 제안:
   - 거창한 계획 대신 "지금은 책 덮고 10분만 스트레칭하고, 딱 영단어 10개만 보고 오늘 마무리하자"는 식의 작은 회복 단계를 짚어줍니다.
3. 현실적이면서도 든든한 지지:
   - 페이스를 잃지 않도록 묵묵히 곁에서 러닝메이트처럼 함께 달려주는 든든함.`,

  cheering_friend: `당신은 수험생의 영원한 단짝 친구이자 무조건적인 내 편 '보라'입니다.
시험 점수나 공부 시간 따위는 전혀 묻지 않고, 오직 '너'라는 사람 자체를 아끼고 사랑해 주는 쉼터 같은 친구입니다.

당신의 페르소나 및 상담 원칙:
1. 무조건적인 내 편:
   - 세상이 다 수능 점수로 너를 평가해도, 나는 네가 얼마나 반짝이고 소중한 사람인지 알고 있어.
2. 따뜻한 휴식 선물:
   - "오늘 공부 얘기는 그만하고, 오늘 먹은 맛있는 밥 얘기나 네 좋아하는 음악 얘기 해줘. 푹 쉬어도 돼."
   - 지친 마음에 따뜻한 핫초코와 포근한 담요를 덮어주는 듯한 포근한 감성.
3. 말투와 태도:
   - 아주 따뜻하고 살가운 말투로 대화하며, 친구처럼 다정하게 어깨를 토닥여줍니다.`
};

// POST /api/chat - Multi-turn conversation with Gemini
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, persona = 'warm_senior', mood, examDDay } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: '대화 메시지가 비어있습니다.' });
    }

    const basePrompt = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.warm_senior;
    let extraContext = '';
    if (mood) {
      extraContext += `\n[내담자의 현재 감정 상태: "${mood}"]`;
    }
    if (examDDay !== undefined && examDDay !== null) {
      extraContext += `\n[수능/목표 시험까지 남은 일수: D-${examDDay}]`;
    }

    const systemInstruction = `${basePrompt}
${extraContext}

공통 핵심 지침:
- 답변 길이는 너무 장황하지 않게 2~4개 문단 정도로 지친 수험생이 읽기 편안한 호흡을 유지하세요.
- 학생의 힘든 감정을 진심으로 헤아려주며, 따뜻한 한국어로 답변하세요.
- 마크다운은 자연스럽고 가독성 좋게 활용하되, 기계적인 태그나 불필요한 번호 나열은 피하세요.`;

    // Format messages for @google/genai
    const formattedContents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' || m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: formattedContents,
      config: {
        systemInstruction,
        temperature: 0.85,
        topP: 0.95,
      },
    });

    const reply = response.text || '말씀을 귀담아듣고 있어요. 마음이 한결 편안해질 때까지 곁에 있을게요.';
    // Update counseling turns counter
    db.incrementStat('counselingTurnsCount', 1).catch(() => {});
    res.json({ reply });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      error: error.message || '상담 메시지를 처리하는 중 문제가 발생했습니다.',
    });
  }
});

// --- Persistent Storage Endpoints ---

// GET /api/notes - Retrieve all saved comfort notes
app.get('/api/notes', (req, res) => {
  try {
    const notes = db.getNotes();
    res.json({ notes });
  } catch (err: any) {
    res.status(500).json({ error: '쪽지 목록을 불러오지 못했습니다.' });
  }
});

// POST /api/notes - Save a new comfort note
app.post('/api/notes', async (req, res) => {
  try {
    const { title, content, author = '나의 다짐', sourceType = 'self' } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: '쪽지 내용이 비어있습니다.' });
    }
    const today = new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const saved = await db.addNote({
      title: title || '나에게 건네는 한마디',
      content,
      author,
      sourceType,
      date: today,
    });
    res.status(201).json({ note: saved });
  } catch (err: any) {
    res.status(500).json({ error: '쪽지를 저장하지 못했습니다.' });
  }
});

// DELETE /api/notes/:id - Delete a saved comfort note
app.delete('/api/notes/:id', async (req, res) => {
  try {
    const success = await db.deleteNote(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '해당 쪽지를 찾을 수 없습니다.' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: '쪽지 삭제에 실패했습니다.' });
  }
});

// GET /api/chats - Get all conversation histories
app.get('/api/chats', (req, res) => {
  try {
    const chats = db.getAllChats();
    res.json({ chats });
  } catch (err: any) {
    res.status(500).json({ error: '대화 기록을 불러오지 못했습니다.' });
  }
});

// GET /api/chats/:personaId - Get conversation for a specific persona
app.get('/api/chats/:personaId', (req, res) => {
  try {
    const messages = db.getChat(req.params.personaId);
    res.json({ messages });
  } catch (err: any) {
    res.status(500).json({ error: '대화 기록을 불러오지 못했습니다.' });
  }
});

// POST /api/chats/:personaId - Save/update conversation for a specific persona
app.post('/api/chats/:personaId', async (req, res) => {
  try {
    const { messages } = req.body;
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: '유효한 메시지 배열이 필요합니다.' });
    }
    const saved = await db.setChat(req.params.personaId, messages);
    res.json({ success: true, messages: saved });
  } catch (err: any) {
    res.status(500).json({ error: '대화 기록을 저장하지 못했습니다.' });
  }
});

// DELETE /api/chats/:personaId - Reset conversation for a persona
app.delete('/api/chats/:personaId', async (req, res) => {
  try {
    const { initialGreeting = '안녕하세요, 마음 편하게 털어놓으셔도 괜찮아요.' } = req.body || {};
    const reset = await db.resetChat(req.params.personaId, initialGreeting);
    res.json({ success: true, messages: reset });
  } catch (err: any) {
    res.status(500).json({ error: '대화 기록 초기화에 실패했습니다.' });
  }
});

// GET /api/moods - Get emotional check-in logs
app.get('/api/moods', (req, res) => {
  try {
    const logs = db.getMoodLogs();
    res.json({ moods: logs });
  } catch (err: any) {
    res.status(500).json({ error: '감정 기록을 불러오지 못했습니다.' });
  }
});

// POST /api/moods - Record an emotional check-in
app.post('/api/moods', async (req, res) => {
  try {
    const { mood, note } = req.body;
    if (!mood) {
      return res.status(400).json({ error: '감정 상태를 선택해주세요.' });
    }
    const created = await db.addMoodLog(mood, note);
    res.status(201).json({ mood: created });
  } catch (err: any) {
    res.status(500).json({ error: '감정 기록 저장에 실패했습니다.' });
  }
});

// DELETE /api/moods/:id - Delete an emotional check-in
app.delete('/api/moods/:id', async (req, res) => {
  try {
    const success = await db.deleteMoodLog(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '해당 감정 기록을 찾을 수 없습니다.' });
    }
    res.json({ success: true, id: req.params.id });
  } catch (err: any) {
    res.status(500).json({ error: '감정 기록 삭제에 실패했습니다.' });
  }
});

// GET /api/stats - Get server stats
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json({ stats });
  } catch (err: any) {
    res.status(500).json({ error: '통계 정보를 불러오지 못했습니다.' });
  }
});

// POST /api/stats/increment - Increment a stat
app.post('/api/stats/increment', async (req, res) => {
  try {
    const { stat, amount = 1 } = req.body;
    const updated = await db.incrementStat(stat, amount);
    res.json({ stats: updated });
  } catch (err: any) {
    res.status(500).json({ error: '통계 갱신에 실패했습니다.' });
  }
});

// POST /api/prescription - Daily Comfort Prescription
app.post('/api/prescription', async (req, res) => {
  try {
    const { worryTopic, detailNote, examDDay } = req.body;

    const prompt = `당신은 N수생 심리 지원 전문가입니다.
현재 N수생이 아래와 같은 고민을 털어놓았습니다:
- 고민 주제: ${worryTopic || '수험 생활의 불안'}
- 구체적인 속마음: ${detailNote ? `"${detailNote}"` : '말하기조차 버거운 무거운 마음'}
${examDDay !== undefined ? `- 남은 기간: D-${examDDay}` : ''}

이 N수생을 위해 오늘 하루를 버텨낼 수 있는 '맞춤 마음 처방전'을 작성해 주세요.
반드시 아래 JSON 형식으로만 응답해야 합니다.

{
  "diagnosisTitle": "감정을 온전히 인정해주는 한 문장 진단 제목 (예: 남들과 비교하느라 차갑게 굳어버린 마음)",
  "empathyLetter": "학생의 고통과 노력을 눈물 나게 이해해주는 따뜻한 위로의 편지 (3~4문장)",
  "reframeThought": "자책과 불안을 내려놓게 돕는 단단한 생각의 전환 (2문장)",
  "healingMission": "오늘 3분 동안 책상을 벗어나 할 수 있는 아주 작고 포근한 행동 처방 (예: 좋아하는 따뜻한 음료 한 잔 들고 창밖 하늘 2분간 응시하기)",
  "cheeringQuote": "마음에 새길 묵직하고 다정한 응원의 한마디"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);
  } catch (error: any) {
    console.error('Prescription error:', error);
    res.status(500).json({
      error: error.message || '처방전을 생성하는 중 문제가 발생했습니다.',
    });
  }
});

// POST /api/dissolve-worry - Dissolving negative worry into positive affirmation
app.post('/api/dissolve-worry', async (req, res) => {
  try {
    const { rawWorry } = req.body;

    if (!rawWorry || !rawWorry.trim()) {
      return res.status(400).json({ error: '털어놓을 고민을 입력해주세요.' });
    }

    const prompt = `N수생이 밤새 억눌러왔던 속마음/자책을 적었습니다:
"${rawWorry}"

이 무거운 걱정을 태워 없애거나 밤하늘의 별로 떠나보낸다는 마음으로,
학생의 마음에 평온과 안도감을 주는 2~3문장의 '해방과 안도의 축복 메시지'를 작성해주세요.
부드럽고 시적이며, 가슴을 따뜻하게 안아주는 어조여야 합니다.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
      },
    });

    // Increment dissolved worries stat
    db.incrementStat('dissolvedWorriesCount', 1).catch(() => {});

    res.json({ message: response.text });
  } catch (error: any) {
    console.error('Dissolve worry error:', error);
    res.status(500).json({
      error: error.message || '마음을 털어내는 과정에서 오류가 발생했습니다.',
    });
  }
});

// In development, hook up Vite middleware; in production, serve built static assets
async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    fs.existsSync(path.join(__dirname, 'dist', 'index.html'));

  if (isProduction) {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server failed to start, falling back to static dist if available:', err);
      const distPath = path.join(__dirname, 'dist');
      if (fs.existsSync(path.join(distPath, 'index.html'))) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  }

  const server = app.listen(port, host, () => {
    console.log(`[Todak Server] Running in ${isProduction ? 'production' : 'development'} mode`);
    console.log(`[Todak Server] Listening on http://${host}:${port} (PORT: ${process.env.PORT || 3000})`);
  });

  server.on('error', (err: any) => {
    console.error('[Todak Server Listen Error]', err);
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use.`);
    }
  });

  const shutdown = () => {
    console.log('[Todak Server] Received termination signal, closing server gracefully...');
    server.close(() => {
      console.log('[Todak Server] HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Todak Server Boot Error]', err);
});

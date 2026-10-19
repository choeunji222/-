export type PersonaId = 'warm_senior' | 'empathy_counselor' | 'study_pacemaker' | 'cheering_friend';

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  tagline: string;
  avatarBg: string;
  avatarEmoji: string;
  description: string;
  recommendedFor: string;
  initialGreeting: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  personaId?: PersonaId;
}

export type EmotionalMood =
  | '불안과 초조'
  | '끝없는 자책감'
  | '번아웃과 무기력'
  | '남들과의 비교'
  | '외로움과 고립감'
  | '차분한 회복 중';

export interface MoodConfig {
  mood: EmotionalMood;
  icon: string;
  color: string;
  comfortQuote: string;
  starterPrompt: string;
}

export interface PrescriptionResult {
  diagnosisTitle: string;
  empathyLetter: string;
  reframeThought: string;
  healingMission: string;
  cheeringQuote: string;
}

export interface SavedComfortNote {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  sourceType: 'counselor' | 'prescription' | 'quote' | 'self';
}

export const PERSONAS: Persona[] = [
  {
    id: 'warm_senior',
    name: '도윤 선배',
    role: 'N수 완주 명문대 선배',
    tagline: '나도 그 독서실 계단에서 많이 울어봤어. 네 맘 다 알아.',
    avatarBg: 'from-amber-600 to-orange-700',
    avatarEmoji: '🌱',
    description: '재수와 삼수의 막막함과 고립감을 직접 이겨낸 선배. 현실적인 조언과 따뜻한 공감으로 든든하게 받쳐줍니다.',
    recommendedFor: '모의고사 성적 하락, 친구들과의 비교, 독서실 외로움으로 힘들 때',
    initialGreeting: '안녕! 오늘도 독서실에서 정말 고생 많았지. 오늘 하루 어떻게 버텼어? 힘들었던 이야기, 마음 편하게 털어놔도 돼.',
  },
  {
    id: 'empathy_counselor',
    name: '한서영 상담사',
    role: '마음챙김 심리상담사',
    tagline: '당신의 불안과 자책, 평가 없이 온전히 안아드릴게요.',
    avatarBg: 'from-teal-600 to-emerald-700',
    avatarEmoji: '🕊️',
    description: '불안 발작, 파국화 사고, 극심한 시험 압박감을 인지행동 및 이완 요법으로 차분하게 다독여 주는 전문가입니다.',
    recommendedFor: '시험 전 숨이 턱 막히고 공황이 올 때, "망하면 어쩌지" 두려울 때',
    initialGreeting: '어서 오세요. 지금 어깨에 들어간 긴장을 살짝 풀고, 깊게 숨을 한번 내쉬어 볼까요? 당신의 마음속 어떤 불안도 이곳에서는 안전합니다.',
  },
  {
    id: 'study_pacemaker',
    name: '정우 코치',
    role: '단단한 러닝메이트',
    tagline: '자책으로 남은 오늘을 버리지 말자. 지금 0에서 다시 시작하면 돼.',
    avatarBg: 'from-blue-600 to-indigo-700',
    avatarEmoji: '🧭',
    description: '공부 슬럼프와 집중력 저하로 자책할 때, 죄책감을 끊어내고 다시 작은 리듬부터 회복하도록 돕는 페이스메이커입니다.',
    recommendedFor: '하루 종일 멍때리고 자책할 때, 슬럼프를 빠르게 털고 싶을 때',
    initialGreeting: '반가워. 지나간 시간 자책하느라 스스로를 괴롭히고 있진 않았어? 괜찮아, 리듬은 지금 이 순간부터 다시 맞추면 돼. 지금 상태가 어때?',
  },
  {
    id: 'cheering_friend',
    name: '보라',
    role: '무조건 내 편인 단짝',
    tagline: '오늘 공부 어땠는지 안 물어볼게. 그냥 네가 소중해서 그래.',
    avatarBg: 'from-rose-500 to-pink-700',
    avatarEmoji: '☕',
    description: '성적이나 등급과 상관없이, 내 존재 자체를 아껴주고 따뜻한 핫초코를 건네주는 세상에서 가장 다정한 단짝 친구입니다.',
    recommendedFor: '공부 얘기는 다 잊고 온전히 쉬고 위로받고 싶을 때',
    initialGreeting: '왔어? 오늘 하루도 진짜 고생 많았어. 다른 건 다 제쳐두고, 오늘 밥은 잘 챙겨 먹었어? 따뜻한 핫초코 한 잔 하면서 편하게 수다 떨자.',
  },
];

export const MOODS: MoodConfig[] = [
  {
    mood: '불안과 초조',
    icon: '⚡',
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    comfortQuote: '불안한 건 네가 진심이기 때문이야. 진심인 마음은 결코 헛되지 않아.',
    starterPrompt: '수능 날이 다가올수록 "이번에도 실패하면 어쩌지" 하는 불안이 너무 커져서 공부가 손에 안 잡혀요.',
  },
  {
    mood: '끝없는 자책감',
    icon: '💧',
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    comfortQuote: '오늘 집중을 못 했다고 해서 지난 수백 일의 노력이 사라지는 건 아니야.',
    starterPrompt: '부모님께 재수 비용 지원받는 것도 너무 죄송하고, 오늘도 계획대로 공부를 못 끝내서 제 자신이 너무 한심해요.',
  },
  {
    mood: '번아웃과 무기력',
    icon: '🍂',
    color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
    comfortQuote: '기계도 과열되면 멈춰. 지금의 멈춤은 포기가 아니라 마음의 방전이야.',
    starterPrompt: '책상 앞에 앉아 있어도 머리가 하얗게 굳고 글자가 전혀 안 읽혀요. 아무것도 하기 싫은 슬럼프가 왔어요.',
  },
  {
    mood: '남들과의 비교',
    icon: '🪞',
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    comfortQuote: '친구들은 1막을 살고 있고, 너는 지금 가장 깊은 2막을 준비하는 중이야.',
    starterPrompt: '대학 가서 축제 즐기고 미팅 나가는 친구들 SNS를 볼 때마다 나만 멈춰서 뒤처진 것 같아 비참해요.',
  },
  {
    mood: '외로움과 고립감',
    icon: '🌙',
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    comfortQuote: '독서실의 고요함은 고립이 아니라, 네 꿈이 영글어가는 인큐베이터야.',
    starterPrompt: '하루 종일 말 한마디 안 하고 독서실과 집만 오가다 보니 세상에 나 혼자 버려진 것 같은 지독한 외로움이 들어요.',
  },
  {
    mood: '차분한 회복 중',
    icon: '🌱',
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    comfortQuote: '천천히 가도 괜찮아. 방향만 맞다면 모든 걸음은 목적지에 닿아.',
    starterPrompt: '마음을 좀 추스르고 다시 책상 앞에 앉으려고 해요. 차분하게 힘을 낼 수 있는 따뜻한 한마디를 듣고 싶어요.',
  },
];

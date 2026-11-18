import vocabulary from './vocabulary.json' with { type: 'json' };

export const subjects = { math: '수학', english: '영어' } as const;
export type Subject = keyof typeof subjects;
export type Question = { prompt: string; answer: string; explanation: string; choices?: string[] };
export const DAILY_SIZE = 3;

const seoul = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function koreanDay(date = new Date()) {
  return seoul.format(date);
}

function randomFor(key: string) {
  let state = 2166136261;
  for (const char of key) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return (size: number) => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) % size;
  };
}

function shuffled<T>(items: T[], pick: (size: number) => number) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = pick(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Keep the v1 seed and question order stable for all devices on the same date.
export function dailyQuestions(day: string, subject: Subject): Question[] {
  const pick = randomFor('pulleem-v1:' + day + ':' + subject);
  if (subject === 'english') {
    const words = shuffled(vocabulary, pick);
    return words.slice(0, DAILY_SIZE).map(([en, ko]) => {
      const alternatives = [...new Set(words.slice(DAILY_SIZE).map(word => word[1]))].filter(value => value !== ko);
      return {
        prompt: `‘${en}’의 뜻을 고르세요.`, answer: ko,
        explanation: `${en} — ${ko}`,
        choices: shuffled([ko, ...shuffled(alternatives, pick).slice(0, 3)], pick),
      };
    });
  }

  const a = 2 + pick(7);
  const b = 1 + pick(9);
  const x = 2 + pick(8);
  const c = 1 + pick(8);
  const d = 2 + pick(8);
  const radius = 2 + pick(8);
  return shuffled([
    {
      prompt: `일차함수 f(x) = ${a}x + ${b}에서 f(x) = ${a * x + b}일 때, x는 얼마인가요?`,
      answer: String(x),
      explanation: `${a}x = ${a * x}이므로 양변을 ${a}(으)로 나누면 x = ${x}입니다.`,
    },
    {
      prompt: `집합 A는 1부터 ${c + d}까지의 정수로 이루어집니다. A에서 ${c} 이하인 원소를 제외하면 몇 개가 남나요?`,
      answer: String(d),
      explanation: `${c + d}개의 원소에서 ${c}개를 제외하므로 ${d}개가 남습니다.`,
    },
    {
      prompt: `원 (x − ${a})² + (y − ${b})² = ${radius ** 2}의 반지름은 얼마인가요?`,
      answer: String(radius),
      explanation: `우변은 반지름의 제곱이므로 반지름은 √${radius ** 2} = ${radius}입니다.`,
    },
  ], pick);
}

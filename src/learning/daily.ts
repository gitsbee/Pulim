export const subjects = { math: '수학', english: '영어' } as const;
export type Subject = keyof typeof subjects;
export const DAILY_SIZE = 3;

const seoul = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
});

export function koreanDay(date = new Date()) {
  return seoul.format(date);
}

import { collection, deleteDoc, doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DAILY_SIZE, type Subject } from './daily';

export type Result = 'correct' | 'wrong' | 'seen' | 'hinted';
export type Attempt = {
  id: string;
  subject: Subject;
  label: string;
  mode: string;
  result: Result;
  occurredAt: number;
};
export type DailyResult = { index: number; correct: boolean };
export const dailyCollection = (uid: string, day: string, subject: Subject) =>
  collection(db!, 'users', uid, 'learningDays', day, 'subjects', subject, 'answers');
export const scoreCollection = (day: string, subject: Subject) =>
  collection(db!, 'pulleemDays', day, 'subjects', subject, 'scores');
export const attemptCollection = (uid: string) => collection(db!, 'users', uid, 'learning');

export function readPracticeAttempt(value: unknown, subject: Subject): Attempt | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Partial<Attempt>;
  if (data.subject !== subject || typeof data.id !== 'string'
    || !new RegExp('^' + subject + '-[a-zA-Z0-9_-]{1,100}$').test(data.id)
    || typeof data.label !== 'string' || !data.label.trim()
    || typeof data.mode !== 'string' || !data.mode.trim()
    || !['correct', 'wrong', 'hinted', 'seen'].includes(data.result ?? '')) return null;
  return {
    id: data.id, subject, label: data.label.trim().slice(0, 160), mode: data.mode.trim().slice(0, 24),
    result: data.result!, occurredAt: Date.now(),
  };
}

const queuePrefix = (uid: string) => 'pulleem:pending:' + uid + ':';
export function queueAttempt(uid: string, attempt: Attempt) {
  localStorage.setItem(queuePrefix(uid) + attempt.id, JSON.stringify(attempt));
}

const running = new Map<string, Promise<void>>();
export function flushAttempts(uid: string) {
  if (!db) return Promise.resolve();
  const pending = running.get(uid);
  if (pending) return pending;
  const upload = (async () => {
    const prefix = queuePrefix(uid);
    let keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
    while (keys.length) {
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const { id, ...attempt } = JSON.parse(raw) as Attempt;
        const ref = doc(attemptCollection(uid), id);
        await runTransaction(db!, async transaction => {
          if (!(await transaction.get(ref)).exists()) transaction.set(ref, { ...attempt, createdAt: serverTimestamp() });
        });
        localStorage.removeItem(key);
      }
      keys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
    }
  })().finally(() => running.delete(uid));
  running.set(uid, upload);
  return upload;
}

export async function saveDaily(uid: string, day: string, subject: Subject, index: number, correct: boolean, label: string) {
  const ref = doc(dailyCollection(uid, day, subject), String(index));
  const summary = doc(attemptCollection(uid), `daily-${subject}-${day}-${index}`);
  return runTransaction(db!, async transaction => {
    const previous = await transaction.get(ref);
    if (previous.exists()) return previous.data().correct === true;
    transaction.set(ref, { correct, createdAt: serverTimestamp() });
    transaction.set(summary, {
      subject, label, mode: '오늘의 문제', result: correct ? 'correct' : 'wrong',
      occurredAt: Date.now(), createdAt: serverTimestamp(),
    });
    return correct;
  });
}

export function publishScore(uid: string, day: string, subject: Subject, answers: DailyResult[]) {
  if (answers.length !== DAILY_SIZE) throw new Error('Incomplete challenge');
  return setDoc(doc(scoreCollection(day, subject), uid), {
    score: answers.filter(answer => answer.correct).length,
    updatedAt: serverTimestamp(),
  });
}

export function withdrawScore(uid: string, day: string, subject: Subject) {
  return deleteDoc(doc(scoreCollection(day, subject), uid));
}

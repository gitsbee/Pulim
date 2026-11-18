import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { errorMessage } from '../model';
import { dailyQuestions, DAILY_SIZE, koreanDay, subjects, type Subject } from './daily';
import { dailyCollection, saveDaily, publishScore, scoreCollection, withdrawScore, type DailyResult } from './store';

export default function DailyChallenge({ day, subject, uid, canPublish, onLogin, onRanking }: {
  day: string;
  subject: Subject;
  uid?: string;
  canPublish: boolean;
  onLogin: () => void;
  onRanking: () => void;
}) {
  const key = `pulleem:guest-daily:${day}:${subject}`;
  const [answers, setAnswers] = useState<DailyResult[]>(() => {
    if (uid) return [];
    try { return JSON.parse(sessionStorage.getItem(key) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(Boolean(uid));
  const [published, setPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadFailed, setLoadFailed] = useState(false);
  const questions = useMemo(() => dailyQuestions(day, subject), [day, subject]);

  useEffect(() => {
    if (!uid || !db) return;
    const stopAnswers = onSnapshot(dailyCollection(uid, day, subject), snapshot => {
      setAnswers(snapshot.docs.map(item => ({ index: Number(item.id), correct: item.data().correct === true })));
      setLoading(false);
      setLoadFailed(false);
    }, error => { setError(errorMessage(error)); setLoading(false); setLoadFailed(true); });
    const stopScore = onSnapshot(doc(scoreCollection(day, subject), uid), snapshot => setPublished(snapshot.exists()),
      error => setError(errorMessage(error)));
    return () => { stopAnswers(); stopScore(); };
  }, [day, subject, uid]);

  const index = questions.findIndex((_, i) => !answers.some(answer => answer.index === i));
  const current = questions[index];
  const complete = answers.length === DAILY_SIZE;

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!current || !input.trim() || busy || loading || loadFailed) return;
    if (day !== koreanDay()) {
      setError('한국 시간으로 날짜가 바뀌었어요. 새 문제를 불러오는 중입니다.');
      return;
    }
    const comparable = input.normalize('NFKC').trim();
    if (subject === 'math' && !/^[+-]?\d+$/.test(comparable)) {
      setError('답안은 정수로 입력해 주세요.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const correct = subject === 'math'
        ? Number(comparable) === Number(current.answer)
        : input === current.answer;
      if (uid) {
        const saved = await saveDaily(uid, day, subject, index, correct, current.prompt);
        setAnswers(previous => [...previous.filter(answer => answer.index !== index), { index, correct: saved }]);
      } else {
        const next = [...answers, { index, correct }];
        setAnswers(next);
        try { sessionStorage.setItem(key, JSON.stringify(next)); } catch { /* The current session still has the result. */ }
      }
      setInput('');
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }

  async function release() {
    if (!uid || !canPublish || !complete || busy) return;
    setBusy(true);
    setError('');
    try {
      if (published) await withdrawScore(uid, day, subject);
      else await publishScore(uid, day, subject, answers);
    } catch (error) { setError(errorMessage(error)); } finally { setBusy(false); }
  }

  return <section className="panel daily-panel" aria-label={subjects[subject] + ' 오늘의 문제'}>
    <header className="study-card-heading">
      <h2>{subjects[subject]} 오늘의 문제</h2>
      <time dateTime={day}>{day} <span className="muted">한국 시간</span></time>
    </header>
    {loading && <p role="status">오늘의 풀이 기록을 불러오는 중…</p>}
    {!uid && <p className="muted">로그인하면 첫 제출 결과가 계정에 저장되고 랭킹에 참여할 수 있어요.</p>}
    {!loading && !loadFailed && current && <form onSubmit={submit} className="daily-form">
      <p className="muted">{index + 1} / {DAILY_SIZE}</p>
      <h3 id="daily-question">{current.prompt}</h3>
      {current.choices ? <fieldset className="daily-choices">
        <legend className="sr-only">뜻 선택</legend>
        {current.choices.map(choice => <label key={choice}>
          <input type="radio" name="daily-choice" value={choice} checked={choice === input}
            onChange={() => setInput(choice)} disabled={busy} />{choice}
        </label>)}
      </fieldset> : <label>답안<input value={input} onChange={event => setInput(event.target.value)}
        maxLength={30} inputMode="numeric" autoComplete="off" disabled={busy} required /></label>}
      <button className="button primary" disabled={busy || !input.trim()}>답안 제출</button>
    </form>}
    {answers.length > 0 && <ol className="daily-feedback" aria-label="오늘의 풀이 결과" aria-live="polite">
      {[...answers].sort((a, b) => a.index - b.index).map(answer => <li key={answer.index}>
        <details open={answer.index === index - 1 || complete && answer.index === DAILY_SIZE - 1}>
          <summary><span className={answer.correct ? 'correct-result' : 'wrong-result'}>
            {answer.index + 1}번 {answer.correct ? '정답' : '오답'}</span></summary>
          <p>{questions[answer.index]?.explanation}</p>
        </details>
      </li>)}
    </ol>}
    {complete && <div className="daily-complete">
      <p role="status">세 문제를 다 풀었어요. 정답 {answers.filter(answer => answer.correct).length} / {DAILY_SIZE}</p>
      {uid && canPublish ? <div className="actions">
        <button disabled={busy} onClick={release}>{published ? '랭킹 공개 취소' : '랭킹에 점수 공개'}</button>
        <button onClick={onRanking}>온라인 랭킹 보기</button>
      </div> : <button onClick={onLogin}>{uid ? '프로필 설정' : '로그인'}</button>}
      {published && <p className="muted">오늘의 점수와 공개 프로필이 랭킹에 표시됩니다.</p>}
    </div>}
    {error && <p className="error" role="alert">{error}</p>}
  </section>;
}

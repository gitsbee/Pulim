import { useEffect, useRef, useState } from 'react';
import type { Theme } from '../hooks/useTheme';
import { subjects, type Subject } from './daily';
import { readPracticeAttempt, type Attempt } from './store';
import { createStudyRuntime } from './engines/runtime';

export type StudyTab = 'practice' | 'history' | 'inspection';
export type StudyView = { tab: StudyTab; session: boolean };
export type StudyAction = StudyTab | 'settings';

const loadMath = () => Promise.all([import('./engines/math'), import('./engines/math.html?raw')]);
const loadEnglish = () => Promise.all([
  import('./engines/english'), import('./engines/english.html?raw'), import('./vocabulary.json'),
]);

export function warmStudy(subject: Subject) {
  void (subject === 'math' ? loadMath() : loadEnglish()).catch(() => {});
}

export default function StudyScreen({ subject, account, theme, setTheme, onAttempt, onView, action }: {
  subject: Subject;
  account: string;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  onAttempt: (attempt: Attempt) => void;
  onView: (view: StudyView) => void;
  action: { name: StudyAction; id: number } | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const live = useRef({ theme, setTheme, onAttempt, onView });
  live.current = { theme, setTheme, onAttempt, onView };
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const lastAction = useRef(0);

  useEffect(() => {
    const root = ref.current!;
    let mounted = true;
    let runtime: ReturnType<typeof createStudyRuntime> | undefined;

    async function load() {
      try {
        const [engine, markup, words] = await (subject === 'math' ? loadMath() : loadEnglish());
        if (!mounted) return;
        root.innerHTML = markup.default;
        runtime = createStudyRuntime(root, {
          account, subject, vocabulary: words?.default,
          report(payload: unknown) {
            const attempt = readPracticeAttempt(payload, subject);
            if (mounted && attempt) live.current.onAttempt(attempt);
          },
          updateView(tab: StudyTab, session: boolean) {
            if (mounted) live.current.onView({ tab, session });
          },
          getTheme: () => live.current.theme,
          setTheme: (value: Theme) => live.current.setTheme(value),
        });
        engine.default(runtime);
        setStatus('ready');
      } catch (error) {
        if (!mounted) return;
        console.error('Study initialization failed', error);
        runtime?.destroy();
        root.replaceChildren();
        setStatus('error');
      }
    }

    void load();
    return () => {
      mounted = false;
      runtime?.destroy();
      root.replaceChildren();
    };
  }, [subject, account, retry]);

  useEffect(() => {
    ref.current?.dispatchEvent(new Event('forge-themechange'));
  }, [theme]);

  useEffect(() => {
    if (!action || status !== 'ready' || lastAction.current === action.id) return;
    lastAction.current = action.id;
    const name = action.name;
    const selector = subject === 'math'
      ? name === 'settings' ? '[data-engine-header] [data-open-preferences]' : '#' + name + '-nav'
      : name === 'settings' ? '#home-settings' : `[data-engine-header] nav [data-view="${name === 'history' ? 'wrong' : 'home'}"]`;
    ref.current?.querySelector<HTMLElement>(selector)?.click();
  }, [action, status, subject]);

  return <>
    {status !== 'ready' && <section className="setup-view" aria-label={subjects[subject]}>
      <header className="page-intro"><h1>{subjects[subject]}</h1></header>
      {status === 'error' && <div className="home-session"><p role="alert">연습을 시작하지 못했습니다.</p>
        <button className="button secondary" onClick={() => { setStatus('loading'); setRetry(value => value + 1); }}>다시 시도</button></div>}
    </section>}
    <div ref={ref} className={`study-engine study-${subject}`} hidden={status !== 'ready'} />
  </>;
}

import { useEffect, useRef } from 'react';
import type { Theme } from '../hooks/useTheme';
import { base } from '../hooks/useNavigation';
import vocabulary from './vocabulary.json';
import { subjects, type Subject } from './daily';
import { readPracticeAttempt, type Attempt } from './store';

export default function StudyFrame({ subject, account, theme, onAttempt }: {
  subject: Subject;
  account: string;
  theme: Theme;
  onAttempt: (attempt: Attempt) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);

  function sendTheme() {
    const dark = theme === 'dark' || theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches;
    frame.current?.contentWindow?.postMessage({ type: 'pulleem:study', account, theme: dark ? 'dark' : 'light',
      vocabulary: subject === 'english' ? vocabulary : undefined }, location.origin);
  }

  useEffect(() => {
    const media = matchMedia('(prefers-color-scheme: dark)');
    sendTheme();
    media.addEventListener('change', sendTheme);
    return () => media.removeEventListener('change', sendTheme);
  }, [theme, account, subject]);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow
        || event.data?.type !== 'pulleem:attempt') return;
      const attempt = readPracticeAttempt(event.data.record, subject);
      if (attempt) onAttempt(attempt);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [onAttempt, subject]);

  return <iframe ref={frame} title={subjects[subject] + ' 연습'}
    className="study-frame" src={`${base}study/${subject}.html`} onLoad={sendTheme}
    sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
    allow="fullscreen" />;
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../components/Icon';
import { ServiceIcons } from './Header';
import { base, navigate } from '../hooks/useNavigation';
import vocabulary from './vocabulary.json';
import { subjects, type Subject } from './daily';
import { readPracticeAttempt, type Attempt } from './store';

export default function StudyFrame({ subject, account, name, onAttempt }: {
  subject: Subject;
  account: string;
  name?: string;
  onAttempt: (attempt: Attempt) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [slots, setSlots] = useState<{ services: HTMLElement; profile: HTMLElement } | null>(null);

  function initialize() {
    const document = frame.current?.contentDocument;
    const services = document?.getElementById('pulim-services');
    const profile = document?.getElementById('pulim-profile');
    if (!services || !profile) return;

    setSlots({ services, profile });
    frame.current?.contentWindow?.postMessage({
      type: 'pulleem:study', account,
      vocabulary: subject === 'english' ? vocabulary : undefined,
    }, location.origin);
  }

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

  const profileLabel = account === 'guest' ? '로그인' : '프로필';
  return <>
    <iframe ref={frame} title={subjects[subject] + ' 연습'}
      className="study-frame" src={`${base}study/${subject}.html`} onLoad={initialize}
      sandbox="allow-scripts allow-same-origin allow-forms allow-downloads allow-popups allow-popups-to-escape-sandbox"
      allow="fullscreen" />
    {slots && createPortal(<ServiceIcons service={subject} />, slots.services)}
    {slots && createPortal(
      <a className="study-profile" href={base + '#/me'} aria-label={profileLabel} title={profileLabel}
        onClick={event => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          event.preventDefault();
          navigate(base + '#/me');
        }}>
        <Icon name="person" />
        <span className="study-profile-name">{name || profileLabel}</span>
      </a>, slots.profile)}
  </>;
}

import type { User } from 'firebase/auth';
import { base, navigate } from '../hooks/useNavigation';
import Icon from '../components/Icon';
import PostMenu from '../components/PostMenu';
import { warmStudy, type StudyAction, type StudyView } from './StudyScreen';
import type { Subject } from './daily';

const services = [
  { key: 'pulleem', label: '풀림', path: '' },
  { key: 'math', label: '수학', path: '#/math' },
  { key: 'english', label: '영어', path: '#/english' },
] as const;

const tools = [
  { key: 'practice', label: '연습', icon: 'book' },
  { key: 'history', label: '기록', icon: 'records' },
  { key: 'inspection', label: '점검', icon: 'search' },
] as const;

export default function Header({ user, name, loggedOut, subject, view, onStudyAction }: {
  user: User | null;
  name?: string;
  loggedOut: () => void;
  subject: Subject | null;
  view?: StudyView;
  onStudyAction: (action: StudyAction) => void;
}) {
  const active = subject || 'pulleem';
  return <header className="app-header pulim-header" hidden={view?.session}>
    <div className="header-inner">
      <nav aria-label="서비스" className="service-nav">
        {services.map(({ key, label, path }) =>
          <a key={key} href={base + path} aria-label={label} title={label}
            aria-current={active === key ? 'page' : undefined}
            onPointerEnter={() => { if (key !== 'pulleem') warmStudy(key); }}
            onFocus={() => { if (key !== 'pulleem') warmStudy(key); }}
            onClick={event => {
              if (!(event.ctrlKey || event.metaKey || event.shiftKey || event.altKey)) window.scrollTo(0, 0);
            }}><Icon name={key} /></a>)}
      </nav>
      <nav aria-label="화면 메뉴" className="page-nav">
        {subject ? tools.filter(item => subject === 'math' || item.key !== 'inspection').map(item =>
          <button type="button" className="header-link" key={item.key}
            aria-label={item.label} title={item.label}
            aria-current={(view?.tab || 'practice') === item.key ? 'page' : undefined}
            onClick={() => onStudyAction(item.key)}><Icon name={item.icon} /><span>{item.label}</span></button>
        ) : <a href={base + '#/records'} aria-label="내 기록" title="내 기록"><Icon name="records" /><span>기록</span></a>}
        {subject ? <button type="button" className="icon-button settings-button" aria-label="설정" title="설정"
          onClick={() => onStudyAction('settings')}><Icon name="settings" /></button> :
          <a className="icon-button settings-button" href={base + '#/settings'} aria-label="설정" title="설정"><Icon name="settings" /></a>}
      </nav>
      <div className="account-entry">
        {user ? <PostMenu label="계정 메뉴" icon="person" iconOnly>
          <button type="button" onClick={() => navigate(base + '#/me')}><Icon name="person" />프로필</button>
          <button type="button" onClick={() => navigate(base + '#/records')}><Icon name="records" />내 기록</button>
          <button type="button" onClick={loggedOut}><Icon name="logout" />로그아웃</button>
        </PostMenu> : <a className="plain-button account-icon" href={base + '#/me'} aria-label="로그인" title="로그인"><Icon name="person" /></a>}
        {user && name && <span className="account-label" aria-hidden="true">{name}</span>}
      </div>
    </div>
  </header>;
}

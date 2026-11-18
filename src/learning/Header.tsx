import type { User } from 'firebase/auth';
import { base, navigate } from '../hooks/useNavigation';
import Icon from '../components/Icon';
import PostMenu from '../components/PostMenu';

export default function Header({ user, name, loggedOut, service }: {
  user: User | null;
  name?: string;
  loggedOut: () => void;
  service: 'pulleem' | 'math' | 'english';
}) {
  return <header className="pulleem-header">
    <div className="pulleem-header-inner">
      <div className="account-entry">
        {user ? <PostMenu label="계정 메뉴" icon="person" iconOnly>
          <button onClick={() => navigate(base + '#/me')}><Icon name="person" />프로필</button>
          <button onClick={() => navigate(base + '#/records')}><Icon name="records" />내 기록</button>
          <button onClick={loggedOut}><Icon name="logout" />로그아웃</button>
        </PostMenu> : <a className="icon-button" href={`${base}#/me`} aria-label="로그인" title="로그인"><Icon name="person" /></a>}
        <span className="account-label" aria-hidden="true">{name || (user ? '프로필' : '로그인')}</span>
      </div>
      <nav aria-label="서비스" className="service-nav">
        {([{ key: 'pulleem', name: '풀림', route: '' }, { key: 'math', name: '수학', route: '#/math' },
          { key: 'english', name: '영어', route: '#/english' }] as const).map(item =>
          <a className="service-link" key={item.key} href={base + item.route} aria-label={item.name} title={item.name}
            aria-current={item.key === service ? 'page' : undefined}><Icon name={item.key} /></a>)}
      </nav>
      <nav aria-label="학습 도구" className="header-tools">
        <a className="icon-button" href={`${base}#/records`} aria-label="내 기록" title="내 기록"><Icon name="records" /></a>
        <a className="icon-button" href={`${base}#/settings`} aria-label="설정" title="설정"><Icon name="settings" /></a>
      </nav>
    </div>
  </header>;
}

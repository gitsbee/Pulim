import { useProfile } from '../hooks/useProfile';
import { profileHref } from '../profiles';

export default function Identity({ uid, fallback, onNavigate, linked = true }: { uid: string; fallback: string; onNavigate?: () => void; linked?: boolean }) {
  const { profile } = useProfile(uid);
  const label = <><strong>{profile?.name || fallback}</strong><span className="handle">{profile ? '@' + profile.handle : '핸들 미설정'}</span></>;
  return <span className="identity">{profile && linked
    ? <a className="identity-link" href={profileHref(profile.handle)} onClick={onNavigate}>{label}</a>
    : <span className="identity-link">{label}</span>}</span>;
}

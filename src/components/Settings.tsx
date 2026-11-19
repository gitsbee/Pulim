import { useLayoutEffect, useRef, useState } from 'react';
import type { Theme } from '../hooks/useTheme';
import { base } from '../hooks/useNavigation';
import { groupStudySettings } from '../learning/settingsUnits';
import { readStudySound, saveStudySound } from '../learning/soundSettings';
import type { SupportKind } from './Support';
import Icon from './Icon';

const modes = { system: '시스템', light: '라이트', dark: '다크', paper: '종이' } as const;

export default function Settings({ theme, setTheme, openSupport, signedIn }: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  openSupport: (kind: SupportKind) => void;
  signedIn: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => groupStudySettings(root.current!, 'pulim'), []);
  const [sound, setSound] = useState(() => readStudySound());
  function updateSound(value: typeof sound) {
    setSound(value);
    saveStudySound(value);
  }
  return <div ref={root}>
    <section className="preferences-section" aria-labelledby="settings-screen">
      <h3 id="settings-screen">화면 및 테마</h3>
      <fieldset>
        <legend className="sr-only">화면 테마</legend>
        <div className="theme-options">
          {(Object.entries(modes) as [Theme, string][]).map(([value, label]) => <label className="select-card" key={value}>
            <input type="radio" name="theme" value={value} checked={theme === value} onChange={() => setTheme(value)} />
            <span>{label}</span>
          </label>)}
        </div>
      </fieldset>
    </section>
    <section className="preferences-section" aria-labelledby="settings-input">
      <h3 id="settings-input">입력</h3>
      <p>담벼락 글쓰기와 검색에는 기기의 기본 입력기를 사용해요. 펜과 세벌식 설정은 수학과 영어에서 각각 조정할 수 있어요.</p>
    </section>
    <section className="preferences-section" aria-labelledby="settings-sound">
      <h3 id="settings-sound">음향 및 소리</h3>
      <label className="mix-toggle settings-toggle"><span>효과음</span>
        <input type="checkbox" role="switch" checked={sound.enabled} onChange={event => updateSound({ ...sound, enabled: event.target.checked })} />
      </label>
      <div className="volume-setting">
        <label htmlFor="pulim-volume">효과음 음량</label><output htmlFor="pulim-volume">{Math.round(sound.volume)}%</output>
        <span className={sound.volume > 0 ? 'range-track has-value' : 'range-track'}
          style={{ '--range-progress': `${sound.volume}%` } as React.CSSProperties}>
          <input id="pulim-volume" type="range" min="0" max="100" step="5" value={sound.volume}
            onChange={event => updateSound({ ...sound, volume: event.target.valueAsNumber })} />
        </span>
      </div>
    </section>
    <section className="preferences-section" aria-labelledby="settings-support">
      <h3 id="settings-support">사용자 지원</h3>
      <div className="support-links">
        <button type="button" className="button secondary" onClick={() => openSupport('help')}><Icon name="book" />도움말</button>
        <button type="button" className="button secondary" onClick={() => openSupport('about')}><Icon name="info" />소개</button>
      </div>
    </section>
    <section className="preferences-section" aria-labelledby="settings-service">
      <h3 id="settings-service">계정과 담벼락</h3>
      <div className="support-links">
        <a className="button secondary" href={`${base}#/me`}><Icon name="person" />{signedIn ? '프로필 관리' : '로그인'}</a>
      </div>
    </section>
  </div>;
}

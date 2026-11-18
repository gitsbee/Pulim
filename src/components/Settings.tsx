import { useId, useState } from 'react';
import type { Theme } from '../hooks/useTheme';
import { base } from '../hooks/useNavigation';
import { settingsUnits } from '../learning/settingsUnits';
import type { SupportKind } from './Support';
import Icon from './Icon';

const units = ['screen', 'account', 'support'] as const;
const modes = { system: '시스템', light: '라이트', dark: '다크', paper: '종이' } as const;

export default function Settings({ theme, setTheme, openSupport, signedIn }: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  openSupport: (kind: SupportKind) => void;
  signedIn: boolean;
}) {
  const [unit, setUnit] = useState<typeof units[number]>('screen');
  const id = useId();
  return <>
    <div className="unit-options settings-units" role="group" aria-label="설정 단원">
      {units.map(key => <button className="button secondary" type="button" key={key}
        aria-pressed={unit === key} aria-controls={`${id}-${key}`} onClick={() => setUnit(key)}>
        {settingsUnits[key]}
      </button>)}
    </div>
    <section className="preferences-section" id={`${id}-screen`} hidden={unit !== 'screen'}>
      <h3>화면 및 테마</h3>
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
    <section className="preferences-section" id={`${id}-account`} hidden={unit !== 'account'}>
      <h3>계정</h3>
      <div className="support-links">
        <a className="button secondary" href={`${base}#/me`}><Icon name="person" />{signedIn ? '프로필 관리' : '로그인'}</a>
        <a className="button secondary" href={`${base}#/activity`}><Icon name="activity" />내 활동</a>
      </div>
    </section>
    <section className="preferences-section" id={`${id}-support`} hidden={unit !== 'support'}>
      <h3>사용자 지원</h3>
      <div className="support-links">
        <button type="button" className="button secondary" onClick={() => openSupport('help')}><Icon name="book" />도움말</button>
        <button type="button" className="button secondary" onClick={() => openSupport('about')}><Icon name="info" />소개</button>
      </div>
    </section>
  </>;
}

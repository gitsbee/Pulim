import { useLayoutEffect, useRef } from 'react';
import type { Theme } from '../hooks/useTheme';
import { base } from '../hooks/useNavigation';
import { alignSettings, fillSettings, groupStudySettings } from '../learning/settingsUnits';
import { readStudySound, saveStudySound } from '../learning/soundSettings';
import type { SupportKind } from './Support';

export default function Settings({ theme, setTheme, openSupport, signedIn }: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  openSupport: (kind: SupportKind) => void;
  signedIn: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef({ theme, setTheme, openSupport, signedIn });
  latest.current = { theme, setTheme, openSupport, signedIn };

  useLayoutEffect(() => {
    const panel = root.current!;
    panel.innerHTML = `
      <section class="preferences-section" aria-labelledby="settings-input"><h3 id="settings-input">입력</h3>
        <p>담벼락 글쓰기와 검색에는 기기의 기본 입력기를 사용해요. 펜과 세벌식 설정은 수학과 영어에서 각각 조정할 수 있어요.</p>
      </section>
      <section class="preferences-section" aria-labelledby="settings-service"><h3 id="settings-service">계정과 담벼락</h3>
        <div class="support-links"><a class="button secondary" href="${base}#/me">${latest.current.signedIn ? '프로필 관리' : '로그인'}</a></div>
      </section>`;
    fillSettings(panel);
    const ungroup = groupStudySettings(panel, 'pulim');
    const volume = panel.querySelector<HTMLInputElement>('#sound-volume')!;
    const enabled = panel.querySelector<HTMLInputElement>('#sound-enabled')!;
    const output = panel.querySelector<HTMLOutputElement>('#sound-volume-value')!;
    const sound = readStudySound();
    enabled.checked = sound.enabled;
    volume.value = String(sound.volume);
    output.value = volume.value + '%';
    const align = alignSettings(panel);
    const abort = new AbortController();
    const options = { signal: abort.signal };
    panel.addEventListener('click', event => {
      const kind = (event.target as HTMLElement).closest<HTMLElement>('[data-support]')?.dataset.support;
      if (kind === 'help' || kind === 'about') latest.current.openSupport(kind);
    }, options);
    panel.addEventListener('change', event => {
      const input = event.target as HTMLInputElement;
      if (input.name === 'theme') latest.current.setTheme(input.value as Theme);
      if (input === enabled) saveStudySound({ enabled: enabled.checked, volume: volume.valueAsNumber });
    }, options);
    volume.addEventListener('input', () => {
      output.value = volume.value + '%';
      saveStudySound({ enabled: enabled.checked, volume: volume.valueAsNumber });
    }, options);
    return () => { abort.abort(); align(); ungroup(); panel.replaceChildren(); };
  }, []);

  useLayoutEffect(() => {
    const selected = root.current?.querySelector<HTMLInputElement>(`[name="theme"][value="${theme}"]`);
    if (selected) selected.checked = true;
  }, [theme]);

  useLayoutEffect(() => {
    const link = root.current?.querySelector('.support-links a');
    if (link) link.textContent = signedIn ? '프로필 관리' : '로그인';
  }, [signedIn]);

  return <div ref={root} />;
}

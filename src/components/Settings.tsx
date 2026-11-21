import { bindStudyInputs } from '../learning/inputSettings';
import { iconMarkup } from '../design/icons';
import { useLayoutEffect, useRef } from 'react';
import type { Theme } from '../hooks/useTheme';
import { base } from '../hooks/useNavigation';
import { alignSettings, fillSettings, groupStudySettings } from '../learning/settingsUnits';
import { readStudySound, saveStudySound } from '../learning/soundSettings';
import type { SupportKind } from './Support';

export default function Settings({ theme, setTheme, openSupport, signedIn, account }: {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  openSupport: (kind: SupportKind) => void;
  signedIn: boolean;
  account: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const latest = useRef({ theme, setTheme, openSupport, signedIn });
  latest.current = { theme, setTheme, openSupport, signedIn };

  useLayoutEffect(() => {
    const panel = root.current!;
    panel.innerHTML = `
      <section class="preferences-section" aria-labelledby="settings-service"><h3 id="settings-service">계정과 담벼락</h3>
        <div class="support-links"><a class="button secondary" href="${base}#/me">${iconMarkup(latest.current.signedIn ? 'person' : 'login')}<span>${latest.current.signedIn ? '프로필 관리' : '로그인'}</span></a></div>
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
    const inputs = bindStudyInputs(panel, account);
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
    return () => { abort.abort(); inputs(); align(); ungroup(); panel.replaceChildren(); };
  }, [account]);

  useLayoutEffect(() => {
    const selected = root.current?.querySelector<HTMLInputElement>(`[name="theme"][value="${theme}"]`);
    if (selected) selected.checked = true;
  }, [theme, account]);

  useLayoutEffect(() => {
    const link = root.current?.querySelector('.support-links a span');
    if (link) link.textContent = signedIn ? '프로필 관리' : '로그인';
  }, [signedIn]);

  return <div ref={root} />;
}

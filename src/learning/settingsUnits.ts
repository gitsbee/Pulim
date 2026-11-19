import { subjects, type Subject } from './daily';

const labels = { screen: '화면', input: '입력', sound: '소리', support: '지원' };

export function groupStudySettings(root: HTMLElement, service: Subject | 'pulim') {
  const sections = [...root.querySelectorAll<HTMLElement>('.preferences-section')];
  const group = document.createElement('div');
  group.className = 'settings-units';
  group.setAttribute('role', 'tablist');
  group.setAttribute('aria-label', '설정 탭');
  const buttons = sections.map(section => {
    const key = section.getAttribute('aria-labelledby')!.slice('settings-'.length) as keyof typeof labels;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'plain-button nav-tab';
    button.textContent = labels[key] || (service === 'pulim' ? '풀림' : subjects[service]);
    section.id = `settings-section-${key}`;
    button.id = `settings-tab-${key}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', section.id);
    section.setAttribute('role', 'tabpanel');
    section.tabIndex = 0;
    section.setAttribute('aria-labelledby', button.id);
    group.append(button);
    return button;
  });
  function select(index: number) {
    sections.forEach((section, position) => {
      const active = position === index;
      section.hidden = !active;
      buttons[position].tabIndex = active ? 0 : -1;
      buttons[position].setAttribute('aria-selected', String(active));
    });
  }
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => select(index));
    button.addEventListener('keydown', event => {
      const count = buttons.length;
      const next = { ArrowLeft: (index + count - 1) % count, ArrowRight: (index + 1) % count, Home: 0, End: count - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      buttons[next].focus();
    });
  });
  sections[0].before(group);
  select(0);
  const screen = sections[0];
  const controls = document.createElement('div');
  controls.innerHTML = '<label class="mix-toggle settings-toggle"><span>전체화면</span><input type="checkbox" role="switch" aria-describedby="fullscreen-status"></label><p id="fullscreen-status" class="help" role="status" hidden></p>';
  screen.append(controls);
  const toggle = controls.querySelector('input')!;
  const status = controls.querySelector('p')!;
  const sync = () => { toggle.checked = Boolean(document.fullscreenElement); };
  sync();
  document.addEventListener('fullscreenchange', sync);
  toggle.addEventListener('change', async () => {
    toggle.disabled = true;
    status.hidden = true;
    try {
      if (toggle.checked) await document.documentElement.requestFullscreen();
      else if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      status.textContent = '이 브라우저에서는 전체화면을 사용할 수 없어요.';
      status.hidden = false;
    } finally {
      toggle.disabled = false;
      sync();
    }
  });
  return () => {
    document.removeEventListener('fullscreenchange', sync);
    sections.forEach((section, index) => section.setAttribute('aria-labelledby', buttons[index].id.replace('-tab-', '-')));
    controls.remove();
    group.remove();
  };
}

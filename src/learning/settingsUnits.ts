export const settingsUnits = {
  screen: '화면',
  input: '입력',
  problem: '문제',
  sound: '소리',
  account: '계정',
  support: '지원',
};

export function groupStudySettings(dialog: HTMLDialogElement) {
  const sections = [...dialog.querySelectorAll<HTMLElement>('.preferences-section')];
  const group = document.createElement('div');
  group.className = 'unit-options settings-units';
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', '설정 단원');
  const buttons = sections.map(section => {
    const key = section.getAttribute('aria-labelledby')!.replace('settings-', '') as keyof typeof settingsUnits;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'button secondary';
    button.textContent = settingsUnits[key];
    section.id = `settings-section-${key}`;
    button.setAttribute('aria-controls', section.id);
    group.append(button);
    return button;
  });
  function select(index: number) {
    sections.forEach((section, position) => {
      const active = position === index;
      section.hidden = !active;
      buttons[position].setAttribute('aria-pressed', String(active));
    });
  }
  buttons.forEach((button, index) => button.addEventListener('click', () => select(index)));
  sections[0].before(group);
  select(0);
}

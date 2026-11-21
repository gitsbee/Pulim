import aliases from './icon-aliases.json';
import type { iconNames } from './iconNames';

export type IconName = typeof iconNames[number];

export function iconHref(name: string, service?: keyof typeof aliases) {
  const names: Record<string, string> | undefined = service && aliases[service];
  return '#ico-' + (names?.[name] ?? name);
}

export function iconMarkup(name: string, service?: keyof typeof aliases) {
  return `<svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24"><use href="${iconHref(name, service)}"/></svg>`;
}

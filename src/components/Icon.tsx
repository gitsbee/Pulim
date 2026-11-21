import type { CSSProperties } from 'react';
import { iconHref, type IconName } from '../design/icons';

export default function Icon({ name, filled = false, style }: {
  name: IconName;
  filled?: boolean;
  style?: CSSProperties;
}) {
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'} style={style}><use href={iconHref(name, 'app')} /></svg>;
}

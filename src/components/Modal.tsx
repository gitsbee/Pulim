import Icon from './Icon';
import { useEffect, useRef, type ReactNode } from 'react';

export default function Modal({ title, onClose, children, preferences = false }: { title: string; onClose: () => void; children: ReactNode; preferences?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!; const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog className={preferences ? 'preferences-dialog' : 'preferences-dialog pulim-dialog'} ref={ref} aria-label={title} onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className={preferences ? 'preferences-header' : 'section-heading'}><h2>{title}</h2><button type="button"
      className="plain-button preferences-close" aria-label="닫기" title="닫기" onClick={onClose}><Icon name="close" /></button></header>
    {children}
  </dialog>;
}

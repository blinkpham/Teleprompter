import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import type { ReactNode } from 'react';
import type { PersistenceStatus, View } from '../../../shared/teleprompter';
import { ImageSquare, MagnifyingGlass, SlidersHorizontal, Sparkle, TerminalWindow } from './icons';

interface TeleprompterShellProps {
  readonly view: View;
  readonly persistenceStatus: PersistenceStatus;
  readonly children: ReactNode;
  readonly onViewChange: (view: View) => void;
  readonly onSearch?: () => void;
  readonly onSettings?: () => void;
  readonly spotlight?: boolean;
}

const navigation: readonly { view: View; label: string; shortcut: string }[] = [
  { view: 'cue', label: 'Cue', shortcut: '⌘1' },
  { view: 'library', label: 'Library', shortcut: '⌘2' },
  { view: 'tokens', label: 'Tokens', shortcut: '⌘3' },
];

function iconFor(view: View) {
  if (view === 'library') return ImageSquare;
  if (view === 'tokens') return SlidersHorizontal;
  return TerminalWindow;
}

export function TeleprompterShell({ view, persistenceStatus, children, onViewChange, onSearch, onSettings, spotlight = false }: TeleprompterShellProps) {
  const reducedMotion = useReducedMotion();
  return (
    <div className={spotlight ? 'tp-app tp-app--spotlight' : 'tp-app'} data-motion={reducedMotion ? 'reduced' : 'full'}>
      <header className="tp-top-strip" aria-label="Window controls">
        <div className="tp-brand-mark" aria-label="Teleprompter"><Sparkle size={15} weight="duotone" /><span>Teleprompter</span></div>
        {persistenceStatus === 'session' && <span className="tp-save-status" role="status">Session only</span>}
      </header>
      <div className="tp-shell-body">
        <nav className="tp-dock" aria-label="Primary navigation">
          <LayoutGroup id="teleprompter-dock">
            {navigation.map(({ view: itemView, label, shortcut }) => {
              const Icon = iconFor(itemView);
              const selected = view === itemView;
              return (
                <button
                  key={itemView}
                  type="button"
                  className={selected ? 'tp-dock-button is-selected' : 'tp-dock-button'}
                  aria-current={selected ? 'page' : undefined}
                  aria-label={`${label} (${shortcut})`}
                  data-tooltip={`${label} · ${shortcut}`}
                  onClick={() => onViewChange(itemView)}
                >
                  {selected && <motion.span className="tp-dock-pill" layoutId="tp-dock-pill" transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.8 }} aria-hidden="true" />}
                  <Icon size={21} weight={selected ? 'fill' : 'duotone'} />
                  <span className="sr-only">{label}</span>
                </button>
              );
            })}
          </LayoutGroup>
          <span className="tp-dock-divider" aria-hidden="true" />
          <button type="button" className="tp-dock-button tp-dock-button--quiet" aria-label="Search" data-tooltip="Search · ⌘K" onClick={onSearch}><MagnifyingGlass size={21} weight="duotone" /></button>
          <button type="button" className="tp-dock-button tp-dock-button--quiet" aria-label="Settings" data-tooltip="Settings" onClick={onSettings}><SlidersHorizontal size={21} weight="duotone" /></button>
        </nav>
        <main className="tp-main" tabIndex={-1}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={view} className="tp-view-frame" initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, x: -6 }} transition={{ duration: reducedMotion ? 0.08 : 0.18, ease: 'easeOut' }}>
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

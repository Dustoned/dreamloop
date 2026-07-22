import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

/** Survives the unmount that a tab switch causes. */
const sectionOpen = new Map<string, boolean>();

/**
 * A titled group. Collapsible groups start closed for the secondary stuff, so a
 * tab opens showing only what matters rather than everything at once.
 */
export function Section({
  title,
  children,
  collapsible = false,
  defaultOpen = true,
  hint,
  action,
}: {
  title: string;
  children: ComponentChildren;
  collapsible?: boolean;
  defaultOpen?: boolean;
  hint?: string;
  /** Small button in the header — used for "Reset". */
  action?: { label: string; fn: () => void; title?: string };
}) {
  // Remembered per title, because switching tabs unmounts the whole body and a
  // plain useState would collapse everything you had opened.
  const [open, setOpen] = useState(() => sectionOpen.get(title) ?? defaultOpen);
  const toggle = (): void => {
    const next = !open;
    sectionOpen.set(title, next);
    setOpen(next);
  };
  if (!collapsible) {
    return (
      <section class="panel-section">
        <h3>
          {title}
          {hint && <span class="sec-hint">{hint}</span>}
          {action && (
            <button
              class="sec-action"
              title={action.title}
              onClick={(e) => {
                e.stopPropagation();
                action.fn();
              }}
            >
              {action.label}
            </button>
          )}
        </h3>
        {children}
      </section>
    );
  }
  return (
    <section class={`panel-section collapsible ${open ? 'open' : ''}`}>
      <h3 onClick={toggle}>
        <span class="sec-caret">{open ? '▾' : '▸'}</span>
        {title}
        {hint && !open && <span class="sec-hint">{hint}</span>}
      </h3>
      {open && children}
    </section>
  );
}

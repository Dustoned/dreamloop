import type { ComponentChildren } from 'preact';
import { useState } from 'preact/hooks';

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
}: {
  title: string;
  children: ComponentChildren;
  collapsible?: boolean;
  defaultOpen?: boolean;
  hint?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!collapsible) {
    return (
      <section class="panel-section">
        <h3>
          {title}
          {hint && <span class="sec-hint">{hint}</span>}
        </h3>
        {children}
      </section>
    );
  }
  return (
    <section class={`panel-section collapsible ${open ? 'open' : ''}`}>
      <h3 onClick={() => setOpen(!open)}>
        <span class="sec-caret">{open ? '▾' : '▸'}</span>
        {title}
        {hint && !open && <span class="sec-hint">{hint}</span>}
      </h3>
      {open && children}
    </section>
  );
}

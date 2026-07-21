export function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div class="ctl toggle" onClick={() => onChange(!value)}>
      <span class="ctl-label">{label}</span>
      <span class={`switch ${value ? 'on' : ''}`}>
        <span class="switch-knob" />
      </span>
    </div>
  );
}

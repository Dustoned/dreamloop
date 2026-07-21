import type { ParamDef, ToggleParam, ColorParam } from '../../state/types';
import { store } from '../../state/paramStore';
import { useParam } from '../hooks/useParam';
import { Slider } from './Slider';
import { SegmentedSelect } from './SegmentedSelect';
import { Toggle } from './Toggle';

function ToggleParamCtl({ path, def }: { path: string; def: ToggleParam }) {
  const raw = useParam(path);
  const value = typeof raw === 'boolean' ? raw : def.default;
  return <Toggle label={def.label} value={value} onChange={(v) => store.set(path, v)} />;
}

function ColorParamCtl({ path, def }: { path: string; def: ColorParam }) {
  const raw = useParam(path);
  const value = typeof raw === 'string' ? raw : def.default;
  return (
    <div class="ctl color">
      <span class="ctl-label">{def.label}</span>
      <input
        type="color"
        value={value}
        onInput={(e) => store.set(path, (e.currentTarget as HTMLInputElement).value)}
      />
    </div>
  );
}

/** Render the right control for a param definition — the whole panel is generated from data. */
export function AutoControl({ path, def }: { path: string; def: ParamDef }) {
  switch (def.type) {
    case 'slider':
      return <Slider path={path} def={def} />;
    case 'select':
      return <SegmentedSelect path={path} def={def} />;
    case 'toggle':
      return <ToggleParamCtl path={path} def={def} />;
    case 'color':
      return <ColorParamCtl path={path} def={def} />;
  }
}

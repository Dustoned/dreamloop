import { Panel } from './ui/Panel';
import { HintOverlay } from './ui/HintOverlay';
import { Toasts } from './ui/Toast';
import { DropZone } from './ui/DropZone';

export function App() {
  return (
    <>
      <Panel />
      <HintOverlay />
      <Toasts />
      <DropZone />
    </>
  );
}

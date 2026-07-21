import { Panel } from './ui/Panel';
import { HintOverlay } from './ui/HintOverlay';
import { Toasts } from './ui/Toast';
import { DropZone } from './ui/DropZone';
import { ShareDialog } from './ui/ShareDialog';
import { PartyOverlay } from './ui/PartyOverlay';

export function App() {
  return (
    <>
      <Panel />
      <HintOverlay />
      <Toasts />
      <DropZone />
      <ShareDialog />
      <PartyOverlay />
      <div id="dip" />
    </>
  );
}

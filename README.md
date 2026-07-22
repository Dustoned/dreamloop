# 🌀 Dreamloop

**▶️ Speel er direct mee: [dustoned.github.io/dreamloop](https://dustoned.github.io/dreamloop/)**

Maak psychedelische visuals met sliders, kleuren en stapelbare effecten — direct in je browser. Audio-reactief: laat de beelden dansen op je muziek.

## Starten

```bash
npm install
npm run dev      # → http://localhost:5173
npm run build    # productie-build in dist/
```

## Wat kan het?

- **18 scenes.** Vlakke patronen (Plasma Waves, Wave Interference, Sacred Geometry, Liquid Marble, Organic Cells, Stardust, Living Tissue), 3D-werelden waar je doorheen vliegt (Wormhole, Fractal Core, Nebula, Infinite Tunnel, Mandala) en **zes echte fractals**:
  - **Deep Zoom** — Mandelbrot/Burning Ship/Tricorn/Celtic/Phoenix met vier beroemde duikpunten, instelbare macht en Julia-blend.
  - **Julia Morph** — Julia-set waarvan de vorm continu langs een pad verandert.
  - **Mandelbulb** — 3D-fractal met instelbare macht (verandert de hele creatuur) en orbit/zoom-camera.
  - **Infinity Box** — Menger-spons met een écht eindeloze, naadloze zoom.
  - **Apollonian** — oneindig gestapelde glanzende bollen, ook eindeloos zoombaar.
  - **Fractal Voyage** — vier fold-varianten (Kali / Spiral / Burning / Triangle).
- **Zoom-modi** op alle fractals: *Zoom In*, *Zoom Out*, *Ping-Pong* of *Hold* — blijf eindeloos inzoomen in plaats van er alleen doorheen vliegen.
- **8 stapelbare effecten**: Echo & Trails (feedback), Kaleidoscope, Prism, Glow (bloom), Rainbow Cycle, Poster & Dither, Pixelate, Vignette & Grain.
- **Simple-modus**: scene-kiezer, preset-rij, **5 macro-sliders** (Speed / Intensity / Complexity / Zoom / Warp), één-tik effect-chips, kleurthema's + shuffle, audiobron en een grote **Surprise Me**-knop.
- **Advanced-modus**: elke parameter van elke scene en elk effect, plus eigen kleurenpaletten (2–4 kleuren, OKLab-interpolatie).
- **Globale beeldregeling** die op élke scene werkt: Colour Speed, Colour Spread, Brightness, Contrast, Saturation.
- **Elke slider kan op de muziek reageren**: klik op het ♪-knopje naast een slider, kies Bass/Mid/Treble/Beat en hoeveel. De koppeling gaat mee in presets en deel-codes.
- **Audio-reactief**: sleep een muziekbestand op de pagina, deel tab-audio (Spotify/YouTube) of gebruik de microfoon. Bass → puls, beat → flits, treble → sparkle.
- **Party Mode** 🎉: fullscreen, UI verdwijnt, en de visuals wisselen vanzelf — op de beat als er muziek speelt.
- **Delen**: kopieer een link of compacte code; wie hem opent krijgt exact jouw visual.
- **Presets**: 10 ingebouwde looks + je eigen creaties opslaan (localStorage). Je laatste sessie wordt automatisch onthouden.
- **Foto**: sla het huidige beeld op als PNG.

## Sneltoetsen

| Toets | Actie |
| --- | --- |
| `Space` | Pauze / afspelen |
| `R` | Surprise Me |
| `F` | Fullscreen (of dubbelklik op het beeld) |
| `S` | Foto opslaan |
| `P` | Party Mode aan/uit |
| `H` | Paneel verbergen/tonen |
| Dubbelklik op slider | Reset naar standaardwaarde |

## Techniek (kort)

- **Vite + TypeScript + Preact** — het bedieningspaneel is Preact; de 60fps-renderloop raakt het framework nooit aan.
- **Rauwe WebGL2**, fullscreen-triangle fragment shaders. Frame graph: scene → temporele feedback (trails) → post-effect-keten (ping-pong) → final blit met vignette/grain/dither.
- **Parametersysteem**: elke scene/elk effect declareert zijn parameters één keer in TypeScript ([src/effects/index.ts](src/effects/index.ts)); UI, shader-uniforms en preset-serialisatie worden daar automatisch uit gegenereerd.
- **Kleuren**: 256×1 gradient-LUT, stops geïnterpoleerd in OKLab.
- **Delen**: state − defaults → JSON → deflate → base64url in `#p=…`.
- **Performance**: interne-resolutieschaal (Quality-slider) + automatische degradatie op basis van mediane frametijd.

Later inpakken als Windows-app (systeemaudio, Spout/NDI) kan met Tauri of Electron zonder iets te herschrijven.

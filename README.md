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
- **Bediening in vijf tabbladen** — Look (scene, presets, kleuren), Feel (5 macro-sliders + alle scene-instellingen + beeldregeling), Effects (snelknoppen + instellingen per effect), Music en Setup — met een vaste voettekst waarin **Surprise Me**, Foto, Delen, Opslaan, Party en Fullscreen altijd bereikbaar blijven.
- **Eén modus, alles zichtbaar.** Geen Simple/Advanced-schakelaar: elke parameter van elke scene en elk effect staat er gewoon, met de minder gebruikte groepen dichtgeklapt. Inclusief eigen kleurenpaletten (2–4 kleuren, OKLab-interpolatie).
- **Globale beeldregeling** die op élke scene werkt: Colour Speed, Colour Spread, Brightness, Contrast, Saturation.
- **Party Mode** 🎉: fullscreen, UI weg, en de visuals wisselen zichzelf — op de beat als er muziek speelt.
- **Delen**: kopieer een link of compacte code; wie hem opent krijgt exact jouw visual.

## Muziek

Sleep een muziekbestand op de pagina, deel tab-audio (Spotify/YouTube) of gebruik de microfoon.

**Elk van de 26 scenes en effecten heeft zijn eigen muzikale reactie**, gekozen bij zijn karakter — bas laat de gloed zwellen, de beat geeft de zoom een zet, hoge tonen laten de korrel schitteren. Je hoeft niets in te stellen; regel alleen de **Audio Reactivity**-slider.

Wil je het zelf bepalen: klik het **♪-knopje** naast élke slider, kies Bass/Mid/Treble/Beat en hoeveel. Zo'n koppeling overschrijft de ingebouwde reactie en gaat mee in presets en deel-codes.

## Sneltoetsen

| Toets | Actie |
| --- | --- |
| `Space` | Pauze / afspelen |
| `R` | Surprise Me |
| `F` | Fullscreen (of dubbelklik op het beeld) |
| `S` | Foto opslaan |
| `P` | Party Mode aan/uit |
| `H` | Bediening verbergen/tonen |
| Dubbelklik op slider | Reset naar standaardwaarde |

Onder **Display** stel je in of de bediening vanzelf wegvalt (en na hoeveel seconden), en aan welke kant van het scherm hij staat.

## Performance — jij bepaalt

Onder **Setup → Performance** staan je huidige fps en drie regelaars die precies doen wat er staat:

- **Resolution** (25–200%) — hoeveel pixels er gerenderd worden. 100% is één pixel per schermpixel; daarboven wordt gesupersampled, wat scherper is dan je scherm zelf.
- **Shader Detail** (30–100%) — hoeveel rekenwerk de visuals doen. Verlaagt onder meer het aantal marcheerstappen van de 3D-scenes.
- **Auto-lower when slow** — staat **uit** op capabele hardware. Zolang hij uit staat verandert er niets vanzelf; wat je instelt is wat je krijgt.

De sneltoetsen Low / Medium / High / Ultra schrijven simpelweg dezelfde twee waarden. Automatische apparaatherkenning kiest alleen je *startpunt* bij een eerste bezoek en overrulet je daarna nooit meer. Deze instellingen reizen bewust **niet** mee in deel-links — die horen bij jouw machine, niet bij het beeld.

Onder water gebeurt er verder van alles om haperingen te voorkomen: shaders worden op de achtergrond gebouwd en vooraf klaargezet (nooit midden in het tekenen), en het matglas-effect van het paneel gaat uit op touchapparaten.

## Techniek (kort)

- **Vite + TypeScript + Preact** — het bedieningspaneel is Preact; de 60fps-renderloop raakt het framework nooit aan.
- **Rauwe WebGL2**, fullscreen-triangle fragment shaders. Frame graph: scene → temporele feedback (trails) → post-effect-keten (ping-pong) → final blit met vignette/grain/dither.
- **Parametersysteem**: elke scene/elk effect declareert zijn parameters én zijn muzikale reactie één keer in TypeScript ([src/effects/index.ts](src/effects/index.ts)); UI, shader-uniforms en preset-serialisatie worden daaruit gegenereerd.
- **Kleuren**: 256×1 gradient-LUT, stops geïnterpoleerd in OKLab.
- **Delen**: state − defaults → JSON → deflate → base64url in `#p=…`.

Later inpakken als Windows-app (systeemaudio, Spout/NDI) kan met Tauri of Electron zonder iets te herschrijven.

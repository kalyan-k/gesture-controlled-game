# Hand Gesture Arcade

Play arcade games with your hands. All hand tracking runs locally in your browser — no video is uploaded.

**[Live demo](https://kind-coast-013773b0f.7.azurestaticapps.net/)**

## Games

### Hand Block Breaker
Classic brick breaker controlled by hand position. Move your hand left and right to steer the paddle, use an open palm to launch the ball, and catch power-ups for extra lives, multi-ball, and a safety bar.

### Spellcaster's to attack Enemies
Cast elemental spells with hand gestures to defend your barrier from falling enemies. Match the right spell to each enemy type before they reach you.

## Getting started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`). Choose a game on the landing page, allow camera access, and play.

## Build

```bash
npm run build
npm run preview
```

## Tech stack

- React + TypeScript + Vite
- MediaPipe hand tracking
- Zustand for game state

## License

[MIT](LICENSE)

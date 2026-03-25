# Professor Falken

A faithful recreation of the WOPR terminal from *WarGames* (1983). Built entirely through Telegram messages to a Claude Code bot. No IDE was opened.

**[professorfalken.com](https://professorfalken.com)**

## The Experience

```
LOGON: Joshua
GREETINGS PROFESSOR FALKEN

SHALL WE PLAY A GAME?
```

Full interactive terminal with the complete movie sequence:

- **WOPR boot** -- NORAD system initialization with scrolling diagnostics
- **Login** -- Type `Joshua`, `Falken`, or stumble through failed attempts until WOPR recognizes you
- **Game selection** -- All 9 games from the movie, but we both know you're picking Global Thermonuclear War
- **War simulation** -- ASCII world map, missile strikes, DEFCON countdown from 5 to 1, casualty estimates, full escalation
- **Tic-tac-toe frenzy** -- 20 simultaneous games in a 4x5 matrix, escalating speed, screen shake, flashing boards
- **The lesson** -- Hard cut to black. Silence. Then: *"A STRANGE GAME. THE ONLY WINNING MOVE IS NOT TO PLAY."*

## Effects

- CRT green phosphor text with scanline overlay and screen flicker
- Keyboard click sounds via Web Audio API
- WOPR computing beeps during war simulation
- Speech synthesis for iconic lines ("Shall we play a game?", "A strange game...")
- Screen shake and color flashing during the tic-tac-toe frenzy

## Tech Stack

- **Vite** -- Vanilla JS, no framework
- **VT323** -- Google Font for authentic terminal text
- **Web Audio API** -- All sound effects synthesized in-browser, no audio files
- **SpeechSynthesis API** -- Robotic voice for WOPR dialogue
- **Vercel** -- Hosting and domain

## How This Was Built

This entire project was built and deployed through casual voice-to-text messages sent via Telegram to a Claude Code bot running on a Mac Mini. The literal prompt was:

> "make me the WarGames terminal game. Professor Falken, shall we play a game"

From that message to a live site with a custom domain took about 20 minutes. No IDE. No terminal. No laptop. Just a phone and a conversation.

## Run Locally

```bash
git clone https://github.com/GGCryptoh/professor-falken.git
cd professor-falken
npm install
npm run dev
```

## License

MIT

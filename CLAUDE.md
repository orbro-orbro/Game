# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

2D pixel-art precision platformer inspired by Celeste. Linear screen-by-screen levels, no enemies (TBD), pure platforming challenge.

**Player character:** an orange dot.  
**Core loop:** Run → Jump → Dash → Wall Grab → Wall Jump → repeat.  
**Tone:** Bright, minimal, no dialogue.

## Role Constraint

Claude acts as a **highly capable code engineer** — responsible for design, architecture, and full implementation.

## Design Documents

All design docs live in `design/`:

| File | Content |
|------|---------|
| `design/core-mechanics.md` | Player mechanics parameters (jump, dash, wall grab, movement, collectibles) |
| `design/tech-architecture.md` | Web/JS project structure, module breakdown, state machine, data flow |
| `design/level-design-grammar.md` | Level design language, teaching sequence, difficulty curve, room templates |
| `design/project-plan.md` | Development phases, milestones, timeline, risk management |

## Tech Stack

- **Platform:** Web browser
- **Language:** JavaScript (Vanilla, no framework, no build step)
- **Rendering:** Canvas 2D API, 320×240 native resolution, `image-rendering: pixelated`
- **Physics:** Custom Raycast-based collision (frame-precise, no engine physics)
- **Input:** DOM keydown/keyup events
- **Level data:** JS objects per level (15 rooms as 2D arrays + entity lists)
- **Deployment:** Static files — any HTTP server or GitHub Pages
- **Target framerate:** 60fps via `requestAnimationFrame`

## Commands

Zero setup — open `index.html` in a browser, or serve the root directory:

```
npx serve .        # Quick local server
python -m http.server 8080  # Alternative
```

No build step, no package manager, no compilation.

## Key Mechanics (from core-mechanics.md)

- **Jump:** 4× player height, 16f apex, variable height (70% short-press / 100% long-press), 5f Coyote Time + 5f Jump Buffer
- **Dash:** 4× player width, 4-directional, 8f duration + 4f endlag, 1 charge (recovers on land or crystal touch), no invincibility frames
- **Wall Grab:** 4s stamina (visible bar), 45° wall-jump (3H×3W), no re-grabbing same wall, slide 2px/f, stamina depleted → slow slide
- **Ground:** 3.0 px/f max speed, 0.4 px/f² accel, 0.3 px/f² friction, instant turn
- **Death:** Room-instant respawn, 800ms delay

## Player State Machine

```
Grounded → Airborne (jump) → Dashing (dash key) → back to Airborne
                            → WallGrab (touch wall + hold toward it) → WallJump (jump key) → Airborne
Grounded/Airborne/Dashing/WallGrab → Dead (touch hazard) → respawn
```

## Architecture

See `design/tech-architecture.md` for full module breakdown.

Key module files under `js/`:
- `input.js` — raw input → abstract actions + buffer/Coyote timers
- `player.js` — state machine orchestrating Jump/Dash/WallGrab
- `physics.js` — raycast-based custom movement + collision
- `level.js` — room transitions, respawn, progress
- `objects.js` — GreenCrystal, MovingPlatform, CrumblingPlatform, Spike
- `collectibles.js` — RedDot tracking, cross-room persistence
- `camera.js` — fixed per-screen, room snap
- `ui.js` — StaminaBar, DeathOverlay, CollectibleCounter
- `config.js` — all tunable parameters in one place
- `main.js` — game entry point + requestAnimationFrame loop

## Git

Repository managed by the user. Commits only when explicitly requested.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

2D pixel-art precision platformer inspired by Celeste. Linear screen-by-screen levels, no enemies (TBD), pure platforming challenge.

**Player character:** an orange dot.  
**Core loop:** Run → Jump → Dash → Wall Grab → Wall Jump → repeat.  
**Tone:** Bright, minimal, no dialogue.

## Role Constraint

Claude acts as **game architect and project manager only** — no code generation. Tasks are limited to design framework, technical architecture, and project management. Implementation is done by the user.

## Design Documents

All design docs live in `design/`:

| File | Content |
|------|---------|
| `design/core-mechanics.md` | Player mechanics parameters (jump, dash, wall grab, movement, collectibles) |
| `design/tech-architecture.md` | Unity project structure, module breakdown, state machine, data flow |

## Tech Stack

- **Engine:** Unity 2023 LTS, Built-in Render Pipeline, 2D template
- **Language:** C#
- **Input:** Unity New Input System
- **Physics:** Custom Raycast-based CharacterController (not Rigidbody2D) — frame-precise control
- **Level authoring:** Unity Tilemap + CompositeCollider2D
- **Level architecture:** One Scene per level, rooms spatially partitioned with Trigger-based transitions. 15 rooms per level, ~2-2.5 min per level.
- **Target framerate:** 60fps (all timing parameters in design docs assume 60fps)

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

## Commands

Unity project not yet created. Once initialized:
- Editor: Open project in Unity Hub
- Build: `File > Build Settings > Build` (TBD: CI pipeline)

## Architecture

See `design/tech-architecture.md` for full module breakdown.

Key modules planned:
- `InputManager` — raw input → abstract actions + buffer/Coyote timers
- `PlayerController` — state machine orchestrating sub-modules
- `JumpModule` / `DashModule` / `WallGrabModule` — per-mechanic logic
- `PhysicsIntegrator` — raycast-based custom movement + collision
- `LevelManager` — room transitions, respawn, progress
- `CameraAnchor` — fixed per-screen, no scrolling

## Git

Repository managed by the user. Commits only when explicitly requested.

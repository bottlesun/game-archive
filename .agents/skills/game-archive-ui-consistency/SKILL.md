---
name: game-archive-ui-consistency
description: Use when creating or changing UI in the Game Archive project so new pages and components follow its established visual structure and shared patterns.
---

# Game Archive UI Consistency

Keep every page and component visually part of the same Game Archive site. Before adding UI, inspect the current markup and styles and reuse established patterns where they exist.

## Project conventions

- The project is a static site organized around `index.html`, `css/style.css`, `js/main.js`, and `data/games.json`.
- Keep content and presentation separate: game names, descriptions, image paths, and links belong in data; reusable visual treatment belongs in shared CSS.
- Reuse the same navigation, buttons, game cards, labels, and interaction states across sections. Add a shared class or small reusable rendering function when the same role appears more than once.
- Keep site-wide colors, typography, spacing, borders, and focus/hover states in shared CSS variables or common classes. Avoid page-specific copies of the same visual rules.
- Follow the established arcade-inspired visual direction: dark cabinet-like surfaces, restrained neon accents, clear readable type, and consistent thumbnail framing. Treat the supplied slot-machine image as inspiration for the main feature, not as a requirement to copy every detail.
- Express meaningful differences through data or explicit state classes, such as selected, featured, disabled, or genre. Do not create a separate visual system for each game.
- Keep layouts usable on narrow screens and preserve visible keyboard focus for interactive elements.
- Limit UI changes to the requested work. Do not redesign unrelated sections or add features that were not requested.

When the site has established patterns that conflict with this guidance, preserve the working site patterns and update this skill only when the user requests a lasting convention change.

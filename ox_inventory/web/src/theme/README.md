# Inventory Theme + Hotbar (first 5 slots)

Lightweight runtime theming for ox_inventory with an optional left-stacked hotbar (first 5 player slots). Minimal integration, upstream-safe.

## What you get
- Live color theming via CSS variables (weight bar, text, slot bg, hover, shadows, gradients)
- Presets (includes bold accents + job-specific Police, EMS, Citizen)
- Hotbar options: sync with slot color or separate hotbar color; optional left vertical layout
- Persistent per-player settings (KVP), with Save/Reset and presets in the editor

---

## Install in 3 quick steps (web)

1) Import the theme stylesheet
   - File: `web/src/index.scss`
   - Add this at the very end so overrides apply last:

     @import './theme';

2) Mount the bootstrapper once
   - File: `web/src/App.tsx`
   - Import and render near the top of your app wrapper:

     import ThemeBootstrapper from './theme/ThemeBootstrapper';
     // ... inside App return
     <ThemeBootstrapper />

3) Add a Settings toggle (and close behavior)
   - File: `web/src/components/inventory/InventoryControl.tsx`
   - Add a button that toggles the editor, and ensure Close hides it before exiting:

     // Open/close editor
     onClick={() => window.dispatchEvent(new CustomEvent('oxinv:toggleThemeEditor'))}
     // Close inventory: close editor first, then exit
     onClick={() => { window.dispatchEvent(new CustomEvent('oxinv:closeThemeEditor')); fetchNui('exit'); }}

That’s it—no Redux/state wiring needed. The editor appears in-game and applies changes live. The first 5 player slots can be stacked vertically on the left from the editor’s Layout tab.

---

## Persistence (NUI) — zero changes to client.lua

This package provides a standalone client script that implements the needed NUI callbacks; you don’t need to edit `client.lua`.

- File added: `theme.lua` (loaded as a client script)
- Manifest: ensure this line exists in `fxmanifest.lua` within `ox_inventory`:

  client_script 'theme.lua'

The script implements:
- `getThemeProfile` → returns a stable profile identifier (QBX/ox_core/ESX fallback → serverId)
- `getThemeSettings` → loads JSON for key `oxinv_theme_<profile>` (with fallbacks)
- `saveThemeSettingsSilent` → saves JSON to KVP silently

Notes:
- KVP keys used: `oxinv_theme_<profile>`, `oxinv_theme_<serverId>`, and `oxinv_theme_global`
- Values are JSON with theme fields (colors, gradient, layout, etc.)

---

## Build & deploy

Only rebuild if you modify files under `web/src/**`.

1) Build the UI (inside `resources/[ox]/ox_inventory/web`):
   - Install deps once: pnpm i
   - Build: pnpm run build
2) Restart the resource so FiveM serves the new assets:
   - refresh
   - restart ox_inventory

Adding or changing only `theme.lua` does NOT require a web build—just restart the resource.

---

## Using the editor

- Open inventory and click the Settings button you added to toggle the editor.
- Presets dropdown includes accent themes and job-specific (Police, EMS, Citizen).
- Layout tab:
  - “Move first 5 player slots to a left vertical bar”
  - “Sync colors with Slot color” (turn off to use a distinct hotbar color)
- Save/Reset: Save writes immediately; Reset restores defaults and shows a small toast.

---

## Customize

- Add or edit presets in `web/src/theme/defaults.ts`.
- Adjust left hotbar spacing in `web/src/theme.scss` (look for the translateY calc with `+ 2.5px`).
- Extend the editor UI in `web/src/theme/ThemeEditor.tsx` as needed.

Optional: auto-apply job presets (Police/EMS/Citizen)
- A small hook can be added to `theme.lua` to read the player’s job (via `qbx_core`) and send a `setTheme` message to the UI when inventory opens.

---

## Admin/Support

If a player’s theme is corrupted or needs a reset, use these client commands:

- `/invtheme reset` → clears theme for current profile + current server id + global key
- Alias: `/themeReset`

Happy theming!

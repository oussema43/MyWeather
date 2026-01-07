# skyfriend

Atmosphere — a modern, lightweight Progressive Web App that shows current weather and a 5-day forecast using the Open-Meteo APIs.

Features
- Search weather by city name (Open-Meteo geocoding)
- Use device location to get local weather
- 5-day forecast and current conditions
- Dynamic themes for weather types and day/night
- PWA-ready: service worker and manifest

Quick start
1. Serve the project folder with a static server (recommended) — from the project root run:

```powershell
# using Python 3
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

2. Or open `index.html` directly in your browser (some PWA/service-worker features require serving over HTTP).

Live demo

Visit the live demo: https://skyfriend.netlify.app/

Project structure
- `index.html` — main app page
- `css/style.css` — app styles
- `js/script.js` — main application logic
- `js/sw.js` — service worker
- `js/manifest.json` — web manifest
- `assets/icon.png` — app icon

Contributing
- Fixes, improvements and issues are welcome. Create a PR against this repository.

License
- See the `LICENSE` file for license details.


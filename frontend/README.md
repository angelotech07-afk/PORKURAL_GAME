# Culture Game - Frontend Step 1

This is the prototype frontend for the Culture Game, built with pure HTML, CSS, and Vanilla JavaScript.

## 1. How to Run

Because this is a static frontend built with plain HTML/JS/CSS without imports, you can run it simply by opening `index.html` in your web browser. 

Alternatively, if you have Python installed, you can serve it locally from the `frontend` directory:
```bash
python -m http.server 8000
```
Then visit `http://localhost:8000/index.html` in your browser.

## 2. Entry Point

The entry point to the game is `index.html`. It contains the layout for all the game screens and loads the necessary CSS and JavaScript files.

## 3. Folder Structure

```
frontend/
├── index.html       # Entry point, contains all screen HTML containers
├── css/
│   └── style.css    # Centralized styling for the cinematic game theme
├── js/
│   ├── app.js       # App initialization, event binding, and chapter logic
│   ├── state.js     # State management utilizing localStorage
│   └── navigation.js# Reusable functions for switching between screens
└── assets/
    └── README.txt   # Placeholder directory for future images/audio
```

## 4. How Navigation Works

The frontend uses a Single Page Application (SPA) structure. Instead of loading new HTML pages, all screens (Home, World Map, Chapters, etc.) are present in `index.html` as `<div>` elements with the class `.screen`.

By default, they are hidden using CSS (`display: none`). 
The `navigation.js` file contains functions like `goToHome()`, `goToWorldMap()`, etc. These functions call `showScreen(screenId)`, which simply removes the `.active` class from all screens and adds it to the requested screen, applying CSS transitions to fade it in smoothly.

This makes navigation fast and maintains the local state without reloading the browser.

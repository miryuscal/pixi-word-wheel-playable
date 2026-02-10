# Pixi Word Wheel Playable

A word puzzle playable built with **PixiJS** and **GSAP**, inspired by popular word connect mechanics.

Players form words by dragging across letters arranged in a circular wheel.  
The project is designed as a **playable ad / demo**, focusing on smooth interactions, visual feedback, and autoplay hint logic.

---

## 🎮 Features

- Circular word wheel with drag-to-connect mechanic  
- Dynamic word validation system  
- Animated selection line and letter feedback  
- Shuffle button to rearrange letters  
- Hint / autoplay system when the user is idle  
- End screen with animated UI elements  
- Fully modular and extendable architecture  

---

## 🛠 Tech Stack

- **PixiJS (v7)** – Rendering & interaction
- **GSAP** – Animations
- **JavaScript (ES6)** – Core logic
- **HTML / Canvas** – Playable container

---

## 🧠 Core Systems

- `Wheel` – Letter placement, drag logic, selection line
- `WordSystem` – Word validation and state management
- `AutoPlaySystem` – Idle detection and hint animation
- `CurrentWordDisplay` – Live word preview UI
- `EndScreen` – Completion screen UI

---

## 🚀 Getting Started

```bash
npm install
npm run dev

🎯 Purpose

This project was created as a playable demo / case study, demonstrating:

Clean interaction handling in PixiJS

Game-like UX inside a playable ad format

Modular and maintainable architecture

📌 Notes

Designed for desktop and mobile playables

Easily adaptable for ad platforms (Unity Ads, Google Ads, etc.)

Assets are placeholders and can be replaced freely

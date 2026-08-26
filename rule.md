# Nomads Project Rules & Guidelines

Welcome to the **Nomads** project, a global platform for connecting travelers with local hosts. To maintain a high-quality codebase and a healthy community, please adhere to the following rules.

## 1. Development Guidelines

### 1.1 Tech Stack Rules
- **Framework:** Next.js (App Router). Keep server and client components strictly separated. Use `"use client"` only when necessary (e.g., for interactivity or hooks).
- **Styling:** Use Vanilla CSS for maximum flexibility and to ensure a custom, premium aesthetic. Avoid utility-class frameworks unless explicitly approved.
- **TypeScript:** Strict mode is enabled. Do not use `any`; define proper interfaces and types for all props and state variables.

### 1.2 UI/UX Aesthetics
- **Premium Feel:** The platform must feel highly premium, trustworthy, and modern. 
- **Color Palette:** Use curated, harmonious colors. Avoid generic basic colors.
- **Typography:** Use modern web fonts (e.g., Inter, Outfit, or Roboto). Ensure proper heading hierarchy (`h1` through `h6`).
- **Interactivity:** Incorporate subtle micro-animations (hover states, transitions) to make the interface feel responsive and alive.
- **Responsiveness:** All pages must be fully responsive (Mobile-first approach).

### 1.3 Code Quality & Git
- **Commit Messages:** Use descriptive commit messages (e.g., `feat: add user profile page`, `fix: resolve auth redirect loop`).
- **Code Reviews:** All major changes must be reviewed before merging to the main branch.
- **Comments:** Comment complex logic, but aim for self-documenting code with clear variable and function names.

## 2. Platform Community Rules (For Users)

As a Couchsurfing alternative, trust and safety are paramount. These are the core rules for the platform's users:

- **Respect and Tolerance:** Nomads is a global community. Discrimination, harassment, or hate speech of any kind is strictly prohibited.
- **Authenticity:** Users must use their real identities and provide accurate information on their profiles.
- **Safety First:** Always communicate through the platform. Report suspicious behavior immediately.
- **Hosting Etiquette:** Hosts are not expected to provide a luxury hotel experience, but they must provide the sleeping arrangements exactly as described.
- **Surfing Etiquette:** Guests should respect the host's house rules, maintain cleanliness, and communicate their arrival/departure times clearly.

## 3. SEO and Accessibility
- Use proper semantic HTML (`<main>`, `<section>`, `<article>`, `<nav>`).
- Include descriptive `alt` tags on all images.
- Ensure all interactive elements are accessible via keyboard navigation.
- Implement proper meta tags (Title, Description) on every page for SEO.

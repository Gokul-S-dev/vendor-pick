# Vendor Picker Frontend

This folder contains the React + Vite frontend for the Vendor Picker project.

For complete project documentation (architecture, API summary, urgency-aware AI scoring, and end-to-end setup), see the root README:

- ../README.md

## Quick Start (Frontend Only)

1. Install dependencies:
	npm install
2. Start development server:
	npm run dev
3. Build production bundle:
	npm run build

## Notes

- During local development, /api calls are proxied to http://localhost:3000 via vite.config.js.
- AI comparison requests are sent to http://localhost:5001/predict from the admin quotations page.

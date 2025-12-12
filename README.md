# ZTraderJournal

## Professional Trading Analytics and Journaling Platform

ZTraderJournal is a production-grade trading analytics and journaling platform designed to help traders build consistency through data-driven performance analysis, rule adherence, and psychological awareness.

This project demonstrates modern frontend engineering practices, strong UI/UX sensibility, and scalable analytics architecture using React.

---
<img width="2527" height="1196" alt="Dashboard" src="https://github.com/user-attachments/assets/38b2546d-2408-4248-a48d-420270e4725b" />


## Overview
<img width="1383" height="1146" alt="Screenshot 2025-12-12 180151" src="https://github.com/user-attachments/assets/fe144edb-c31f-4314-b158-c0f1f9a24596" />

ZTraderJournal combines trade logging, performance analytics, and behavioral tracking into a single cohesive system.  
Rather than focusing only on trade outcomes, the platform emphasizes process, discipline, and repeatable decision-making.

The application is built as a serious SaaS-style product, not a prototype or academic exercise.

---

## Key Features

### Trading Performance Analytics
- Net P&L, win rate, expectancy, and profit factor
- Cumulative equity curve
- Profit and loss grouped by trading session (Asia, London, New York)
- Risk–reward versus P&L correlation analysis
- Profit distribution and weekday activity insights

### Discipline and Psychology Tracking
- Custom daily trading rules with adherence tracking
- Rule violation analysis and streak detection
- Emotional state tagging per trade

### Trade Journaling System
- Structured trade logging with minimal friction
- Rich trade metadata including symbol, session, R/R, emotions, and notes
- Trade history with filtering and review

### Time-Based Analysis
- Smart calendar view with daily summaries
- Custom date range selection
- Session-aware analytics using UTC normalization

### UI and UX
- Modern dark fintech aesthetic
- Glassmorphism and subtle motion
- Fully responsive layouts
- Smooth animated transitions
- High-fidelity charts and data visualizations

---

## Technology Stack

### Frontend
- React (functional components and hooks)
- Framer Motion for animations
- Recharts for data visualization
- Day.js for timezone-aware date handling
- React DatePicker

### Styling
- Tailwind CSS
- Custom design tokens and motion patterns

### Architecture and Data
- Modular analytics utilities for reuse and testing
- Memoized computations for performance optimization
- Clear separation between UI components and business logic
- Render-time formatting to avoid floating-point precision artifacts

---

## Architecture Highlights

- Session-aware analytics derived from UTC-normalized timestamps
- Pure computation utilities for expectancy, streaks, and session P&L
- Scalable component composition suitable for dashboard-style applications
- Optimized rendering for large trade datasets

---

## Design Goals

- Clarity over complexity
- Actionable insights over raw data
- Minimal friction in daily workflows
- Visual polish without sacrificing performance

---

## Why This Project Is Relevant

ZTraderJournal demonstrates:
- Product-driven engineering decisions
- Strong attention to UX and interaction detail
- Real-world data modeling and visualization
- Maintainable and scalable React architecture
- Consideration for performance, precision, and usability

The project reflects an approach focused on building tools that users could realistically rely on in a professional environment.

---

## About the Author

Zain Zahab  
Software Engineering Student  
Frontend and Product-Focused Developer

Open to internship, graduate, and junior software engineering roles.

---

## Disclaimer

ZTraderJournal is a personal project and does not provide financial advice.  
All analytics are intended for educational and performance-tracking purposes only.


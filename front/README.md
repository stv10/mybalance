# MyBalance — Frontend Client

MyBalance is a premium personal finance tracking and budgeting application. Built on top of **React** and **Vite** for fast HMR and high-performance production bundles.

## Features

### 💻 Fixed Sidebar & Topbar Scroll Layout
The application features a responsive admin dashboard layout:
- **Desktop viewports (>768px)**: The main layout height is constrained to `100vh`. The Sidebar and Topbar are fixed in place while scrolling only occurs inside the active tab content area (`.dashboard-content-area`).
- **Mobile viewports (<=768px)**: Automatically falls back to a clean, vertical flowing layout.

### 🍕 Weekly Food Budget Tracking Panel
Directly on the Resumen (Overview) tab, users can monitor their food spending habits:
- **Weekly Budget**: Automatically derived by dividing the monthly budget limit of the "Comida" category by 5.
- **Weekly Spent**: Dynamically calculates real-time expense transactions in the "Comida" category during the current calendar week (Monday to Sunday).
- **Fallback Averages**: For past or future months, the panel switches to displaying the weekly average spending (Total monthly spent / 5), allowing comparison of historical habits.
- **Empty States**: If a budget limit is not yet set for the "Comida" category, a clear call-to-action invites the user to establish one in the **Presupuestos** tab.
- **Premium Aesthetics**: Gorgeous HSL progress bars and dynamic state badges (Success, Warning, Exceeded) that match the theme colors.

## Running Locally

To run the client locally:

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run linting
npm run lint

# Build for production
npm run build
```

## Technologies & Design Tokens
- **Bundler**: Vite
- **UI Icons**: Lucide React
- **Styling**: Vanilla CSS utilizing modern variables (HSL colors, glassmorphism containers, smooth cubic-bezier transitions) for a premium dark/light mode experience.

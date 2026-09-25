---
name: Cerdas Design System
description: Impeccable design system tokens and guidelines for Cerdas Editor and Web applications
colors:
  primary: "#2563eb"
  primary-hover: "#1d4ed8"
  primary-light: "#eff6ff"
  primary-border: "#bfdbfe"
  secondary: "#64748b"
  surface: "#ffffff"
  background: "#f8fafc"
  border: "#e2e8f0"
  border-subtle: "#f1f5f9"
  text-primary: "#1e293b"
  text-secondary: "#64748b"
  text-muted: "#94a3b8"
  success: "#16a34a"
  success-light: "#f0fdf4"
  success-border: "#bbf7d0"
  warning: "#d97706"
  warning-light: "#fef3c7"
  warning-border: "#fde68a"
  danger: "#dc2626"
  danger-light: "#fef2f2"
  danger-border: "#fecaca"
  accent-purple: "#7c3aed"
  accent-purple-light: "#faf5ff"
  accent-purple-border: "#e9d5ff"
typography:
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  monoFamily: "'SF Mono', Monaco, Menlo, Consolas, 'Courier New', monospace"
  h1:
    fontSize: "24px"
    fontWeight: "600"
    lineHeight: "1.3"
  h2:
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "1.35"
  h3:
    fontSize: "16px"
    fontWeight: "600"
    lineHeight: "1.4"
  body:
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "1.5"
  body-medium:
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "1.5"
  small:
    fontSize: "12px"
    fontWeight: "400"
    lineHeight: "1.4"
  label:
    fontSize: "11px"
    fontWeight: "600"
    lineHeight: "1.2"
rounded:
  xs: "4px"
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "12px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    height: "36px"
    padding: "0 16px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.xl}"
    padding: "20px"
---

# Design System Guidelines

## Overview

Cerdas is a mission-critical survey and data engineering platform. Its user interface operates under the **Operate** mode: scanability, deterministic feedback, high data density, and consistent native affordances take precedence over superficial decorative styling. Every UI element exists to serve a clear user task.

## Colors

- **Restrained Palette**: Primary actions and active navigational selections use `{colors.primary}` (`#2563eb`). Inactive states avoid saturated colors.
- **Surface Hierarchy**:
  - Main background: `{colors.background}` (`#f8fafc`).
  - Elevated surfaces & cards: `{colors.surface}` (`#ffffff`).
  - Subtle borders: `{colors.border}` (`#e2e8f0`).
- **Semantic Feedback**:
  - Success: `{colors.success}` (`#16a34a`) for published statuses and positive sync confirmations.
  - Warning: `{colors.warning}` (`#d97706`) for unsaved drafts or expiring tokens.
  - Danger: `{colors.danger}` (`#dc2626`) for destructive operations, trash actions, and error states.

## Typography

- **Single Sans Family**: Use standard system sans (`Inter`, system UI) across all views. Display fonts are strictly banned in operational UI.
- **Fixed rem / px Scale**: Standardized at 14px base body text, 12px for meta/captions, and 18-24px for page titles.
- **Text Wrapping & Ellipsis**:
  - Never allow unconstrained text to break flex containers.
  - Multi-line descriptions use `-webkit-line-clamp: 2; word-break: break-word;`.
  - Single-line titles and names must have `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; min-width: 0;`.

## Layout

- **Desktop-First Editor Layout**:
  - Fixed header at top (`height: 56px`).
  - Sidebar navigation on the left (`width: 220px`).
  - Main content panel with auto vertical scrolling.
- **Grid Density**: Card grids use `grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px;`.
- **Responsive Structural Adaptations**: On narrower screens, panels collapse into sidebars or drawers rather than shrinking text into illegibility.

## Elevation & Depth

- Elevation is restrained. Heavy drop shadows and glassmorphism are prohibited.
- Level 0: Background (`#f8fafc`).
- Level 1: Cards and panels with `box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;`.
- Level 2: Modals and dropdown popovers with `box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);`.

## Shapes

- Interactive elements use consistent border radii:
  - Form inputs and icon badges: `6px`.
  - Buttons and list items: `8px`.
  - Cards: `10px` to `12px`.
  - Pills and chips: `9999px`.

## Components

- **Buttons**:
  - Standard button height across all toolbars: `36px` (or `28px` for compact table actions).
  - Clear visual hierarchy: Primary (`fill`, blue-600), Secondary (`outline` or subtle gray surface), Destructive (red accent on hover).
- **Empty States**:
  - Every empty list must explain what the entity is and provide a clear call to action to create the first one.
  - Do not use generic "No data" placeholders without instructional context.
- **Loading States**:
  - Use skeleton place-holders or explicit progress indicators during async data fetching.
- **Modals and Popups**:
  - Dedicated popups must have clear cancel and confirm actions, clean field spacing, and handle escape/close events.

## Do's and Don'ts

### Do
- Ensure all interactive buttons have clear hover, active, and disabled states.
- Truncate long entity names and table titles with ellipsis to avoid layout disruption.
- Follow Single Responsibility Principle (SRP) by extracting complex dialogs and cards into isolated child components.
- Use interface-first TypeScript contracts for all component props and composables.

### Don't
- Don't use `link="#"` in Framework7 list items as it causes unwanted navigation and hash changes.
- Don't nest cards inside cards with double borders ("cardception").
- Don't leave dummy or hardcoded mock data in operational views.
- Don't silently swallow API errors; display informative toasts or alerts.
- Don't exceed 600 lines per file.

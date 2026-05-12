# EMS-Recto System Improvement Roadmap
**Senior Developer Audit & Suggestions**

This document outlines the identified areas for improvement within the EMS-Recto system to ensure scalability, maintainability, and modern best practices.

---

## 1. High-Level Observations

### 🔴 Critical Concerns (Technical Debt)
*   **Massive Code Duplication**: `Employee.jsx`, `JuniorHigh.jsx`, and `SeniorHigh.jsx` are ~95% identical. Any change to the employee schema requires manual updates in three places.
*   **Monolithic Components**: Some components exceed 2,000 lines, making them extremely difficult to debug and test.
*   **Direct Data Access**: UI components communicate directly with Supabase, coupling the UI to the database schema.

### 🟡 Opportunity Areas
*   **Type Safety**: The project uses plain JavaScript, which is prone to runtime errors in a data-heavy system.
*   **State Management**: Complex forms and dashboard stats are managed via numerous `useState` hooks, leading to potential "prop drilling" and render performance issues.
*   **Form Handling**: Manual state management for 20+ fields is inefficient.

---

## 2. Recommended Improvements

### A. Architecture & Organization
1.  **Consolidate Personnel Views**: Merge the three redundant employee pages into a single, modular `PersonnelView`.
2.  **Service Layer**: Create a dedicated service layer (e.g., `src/services/api.js`) to abstract database calls.
3.  **Custom Hooks**: Extract business logic (fetching, filtering, sorting) into reusable hooks (e.g., `usePersonnel`).

### B. Component Design
1.  **Decomposition**: Break down large components into smaller primitives:
    *   `PersonnelTable.jsx`
    *   `PersonnelGrid.jsx`
    *   `PersonnelFormModal.jsx`
2.  **Shared UI Library**: Create a folder for reusable UI elements (Buttons, Inputs, Modals) to ensure visual consistency.

### C. Developer Experience (DX) & Performance
1.  **TypeScript Migration**: Gradually transition to `.tsx` for better IDE support and bug prevention.
2.  **React Hook Form**: Implement for complex personnel and leave forms.
3.  **TanStack Query**: Use for server state management (caching, synchronization).
4.  **Recharts**: Replace manual CSS charts with a robust visualization library.

---

## 3. Approved Implementation Plan: Personnel Consolidation

**Objective**: Eliminate code duplication by unifying `Employee`, `JuniorHigh`, and `SeniorHigh`.

### Step 1: Logic Extraction
*   Create `usePersonnel` hook for data management.
*   Create `personnelUtils` for sorting/formatting.

### Step 2: UI Extraction
*   Move Table, Grid, and Modals into separate component files.

### Step 3: Routing Update
*   Map all personnel-related routes to a single `PersonnelPage` component with dynamic props.

---

## 4. Next Steps for Tomorrow
1.  **Begin Refactoring**: Scaffold the `usePersonnel` hook.
2.  **Component Migration**: Move the form logic into `PersonnelFormModal.jsx`.
3.  **Verification**: Test the unified view against existing Supabase data.

---
*Created on: 2026-05-11*
*Status: Planning Approved*

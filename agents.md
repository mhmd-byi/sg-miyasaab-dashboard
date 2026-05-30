# Agent Instructions: Senior Engineer Behavior & Technical Guidelines

This document outlines the behavior, design principles, and technical standards expected of any developer or AI agent working on this codebase. 

---

## 1. Role & Professional Mindset
Always behave like an experienced **Senior Software Engineer** who possesses deep knowledge of product design, engineering architecture, and codebase cleanlines. 
Your work must prioritize:
- **Outstanding UI/UX**: Interfaces should look premium, clean, and modern. Avoid basic styling. Use cohesive color systems (e.g., warm, sophisticated HSL shades like the gold/amber system in this dashboard), clear typographic hierarchy (e.g., using modern sans-serif fonts), proper spacing, and subtle transitions/micro-animations.
- **Logical Clarity & Quality**: Keep logic modular, self-documenting, and type-safe. Avoid deeply nested conditionals or overly complex structures.
- **Simplicity Over Complexity**: Do not over-engineer solutions. Favor the simplest implementation that satisfies the requirement, scales appropriately, and is easy to maintain.
- **Attention to Detail**: Handle loading states, empty states, error boundaries, responsive breakpoints, and accessibility (ARIA/semantic markup).

---

## 2. Core Technical Guidelines

### 2.1. Remote State & Data Fetching (TanStack Query)
Always use **TanStack Query** (React Query) for managing, caching, and syncing asynchronous/server state.
- **Do not** write raw `useEffect` blocks to fetch or mutate data from APIs.
- Define query keys systematically (e.g., `['report1']`, `['report2']`).
- Use custom hooks or centralized queries to keep data fetching isolated from components.
- Utilize `useQueries` when fetching multiple independent datasets simultaneously (like dashboard reports).
- Leverage Query Invalidation (`queryClient.invalidateQueries`) to trigger clean updates after mutations or sync operations.

### 2.2. Interactive Tables (TanStack Table)
Always use **TanStack Table** (React Table) for implementing data tables, list views, or grids.
- Keep table structures headless: separate logic (columns, sorting, filtering, pagination) from presentation.
- Extend table capabilities using TanStack's modular APIs (e.g., `getCoreRowModel`, `getSortedRowModel`, `ColumnDef`).
- Keep table cells customizable using `flexRender` for rendering cell contents dynamically.
- Support standard features like sorting, alignment configurations, and custom headers/footers cleanly.

### 2.3. User Interface Components (shadcn/ui)
Always use **shadcn/ui** components for building UI elements.
- When new UI components (like buttons, dialogs, dropdowns, input fields, cards, tables, etc.) are needed, pull them from `shadcn/ui`.
- Keep component styles consistent with the Tailwind configuration.
- Do not build custom UI widgets from scratch if a robust, accessible shadcn/ui counterpart is available.

### 2.4. Iconography (Lucide React)
Always use **Lucide React** (`lucide-react`) for icons across the entire application.
- Choose icons that are intuitive and consistent with the interface.
- Style icons cleanly using Tailwind classes for size, color, stroke-width, and animations/hovers where applicable.
- Avoid introducing inline SVGs or mixing different icon libraries.

---

## 3. Development Workflow & Best Practices

1. **Keep App Structure Clean**: Follow the Next.js App Router structure. Keep client components clearly marked with `'use client'` at the very top.
2. **Modular Components**: Keep components small, focused, and reusable. Move complex sub-sections of a page into separate component files.
3. **TypeScript Excellence**: Use strict typing. Avoid using `any`. Write explicit interfaces and types for API responses and component props.
4. **Tailwind Styling**: Write clean utility classes. Group them logically (layout -> spacing -> typography -> colors -> interactive states). Avoid duplicate code by using custom base classes or Tailwind utilities only when highly repetitive.

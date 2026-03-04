---
description: "Use when creating or modifying React components in components/. Covers client directive placement, cn() usage, props interfaces, shadcn/ui patterns, Lucide icons, and brand styling."
applyTo: "components/**/*.tsx"
---

# Component Conventions

## Client Components

Interactive components (charts, forms, nav) must declare `"use client"` as the first line:

```typescript
"use client";

import { useState } from "react";
```

## Props — Interface Above Component

```typescript
interface KpiCardProps {
  label: string;
  value: string | number;
  className?: string;
}

export default function KpiCard({ label, value, className }: KpiCardProps) {
```

- Destructure props with defaults where appropriate
- Export as `default`
- PascalCase file and component names

## Styling — cn() + Brand Tokens

Always use `cn()` for conditional class merging:

```typescript
import { cn } from "@/lib/utils";

<div className={cn("card-glass rounded-xl p-5", className)}>
```

Brand tokens: `text-brand-blue`, `text-brand-cyan`, `text-brand-lime`, `bg-brand-*`.
Glass cards: `card-glass` class.

## Icons — Lucide React

Use Lucide icons. For dynamic icon selection, use a lookup map:

```typescript
const ICON_MAP: Record<string, LucideIcon> = {
  activity: Activity,
  shield: Shield,
};
const Icon = ICON_MAP[icon] ?? Activity;
```

## Directory Layout

| Folder                  | Content              | Directive      |
| ----------------------- | -------------------- | -------------- |
| `components/ui/`        | shadcn/ui primitives | Varies         |
| `components/dashboard/` | Domain components    | `"use client"` |
| `components/charts/`    | Recharts wrappers    | `"use client"` |

# TrafficGenius UI/UX Frontend Modernization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the TrafficGenius dashboard to SaaS industry parity across accessibility, navigation, design system, data tables, and component architecture — as specified in the audit at `docs/plans/2026-03-05-ui-ux-frontend-audit.md`.

**Architecture:** Server Components fetch data at the page level; Client Components handle interactivity. Mutations use `useRouter().refresh()` instead of full-page reloads. Toast notifications via `sonner`. Accessibility via ARIA attributes and focus management on all interactive widgets.

**Tech Stack:** Next.js 16.1.6 (App Router), React 19, TypeScript 5.9 strict, Tailwind CSS 4, shadcn/ui primitives, framer-motion 12, Recharts 3, NextAuth v5, Lucide React.

**Verification approach:** No test framework is configured. After each task verify with:

- `npx tsc --noEmit` — TypeScript type check
- `npm run lint` — ESLint + Prettier
- Manual browser check at `http://localhost:3080`

---

## Phase 1 — Critical UX & Accessibility Issues

---

### Task 1: Replace `window.location.reload()` with `router.refresh()`

**Audit reference:** §7.1
**Files:**

- Modify: `components/dashboard/RuleActions.tsx` (lines 98, 116)
- Modify: `components/dashboard/SiteActions.tsx` (line 41)
- Modify: `components/dashboard/SiteForm.tsx` (line 105)

**Step 1: Update `RuleActions.tsx`**

At the top of the file, add the router import (line 10, after the existing `useState` import):

```tsx
import { useRouter } from "next/navigation";
```

Inside the `RuleActions` component function body (after `const [formData, setFormData] = useState(...)`), add:

```tsx
const router = useRouter();
```

Replace line 98 (`window.location.reload();`) with:

```tsx
router.refresh();
```

Replace line 116 (`window.location.reload();`) with:

```tsx
router.refresh();
```

**Step 2: Update `SiteActions.tsx`**

Add the router import at the top:

```tsx
import { useRouter } from "next/navigation";
```

Inside the `SiteActions` component, add:

```tsx
const router = useRouter();
```

Replace line 41 (`window.location.reload();`) with:

```tsx
router.refresh();
```

**Step 3: Update `SiteForm.tsx`**

Add the router import at the top:

```tsx
import { useRouter } from "next/navigation";
```

Inside `SiteForm`, add:

```tsx
const router = useRouter();
```

Replace line 105 (`window.location.reload();`) with:

```tsx
router.refresh();
```

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Expected: no errors.

**Step 5: Commit**

```bash
git add components/dashboard/RuleActions.tsx components/dashboard/SiteActions.tsx components/dashboard/SiteForm.tsx
git commit -m "fix(ux): replace window.location.reload() with router.refresh() in mutation components"
```

---

### Task 2: Fix Dialog component — add focus trap, ARIA roles, keyboard close

**Audit reference:** §6.2
**Files:**

- Modify: `components/ui/dialog.tsx`

**Step 1: Install `@radix-ui/react-dialog`**

The current Dialog is a custom implementation missing focus trap and ARIA. Replace it with the Radix primitive (same API shape that shadcn/ui uses):

```bash
npm install @radix-ui/react-dialog
```

**Step 2: Rewrite `components/ui/dialog.tsx`**

Replace the entire file contents:

```tsx
"use client";

import * as React from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const Dialog = RadixDialog.Root;
const DialogTrigger = RadixDialog.Trigger;
const DialogPortal = RadixDialog.Portal;
const DialogClose = RadixDialog.Close;

function DialogOverlay({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Overlay>) {
  return (
    <RadixDialog.Overlay
      className={cn(
        "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        className,
      )}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  onClose,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Content> & {
  onClose?: () => void;
}) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <RadixDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-gray-200 bg-white p-6 shadow-xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className,
        )}
        {...props}
      >
        {children}
        <RadixDialog.Close
          onClick={onClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </RadixDialog.Close>
      </RadixDialog.Content>
    </DialogPortal>
  );
}

function DialogHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col space-y-1.5 text-center sm:text-left",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Title>) {
  return (
    <RadixDialog.Title
      className={cn(
        "text-lg font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadixDialog.Description>) {
  return (
    <RadixDialog.Description
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
}

function DialogFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
        className,
      )}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
};
```

**Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Open the app in the browser, open any dialog (e.g. Add Rule on the Cloud Armor page). Confirm:

- Tab key cycles focus only within the dialog
- Escape key closes it
- Screen reader announces the dialog title

**Step 4: Commit**

```bash
git add components/ui/dialog.tsx package.json package-lock.json
git commit -m "fix(a11y): replace custom Dialog with Radix primitive for focus trap and ARIA"
```

---

### Task 3: Fix SiteSelector — add ARIA listbox/option roles and keyboard navigation

**Audit reference:** §6.1
**Files:**

- Modify: `components/dashboard/SiteSelector.tsx`

**Step 1: Update the trigger button — add `aria-expanded`, `aria-haspopup`, `aria-controls`**

Replace the `<button>` element (lines 65-94) with:

```tsx
<button
  onClick={() => setOpen(!open)}
  aria-expanded={open}
  aria-haspopup="listbox"
  aria-controls="site-selector-listbox"
  aria-label={
    selectedSite ? `Selected site: ${selectedSite.label}` : "All sites selected"
  }
  className={cn(
    "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-200",
    selectedSite
      ? "bg-blue-50/80 border-blue-200 text-brand-blue"
      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300",
  )}
>
  <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
  <span className="truncate max-w-45">
    {selectedSite ? selectedSite.label : "All Sites"}
  </span>
  {selectedSite ? (
    <X
      className="w-3.5 h-3.5 shrink-0 text-gray-400 hover:text-red-500"
      onClick={(e) => {
        e.stopPropagation();
        handleSelect(null);
      }}
      aria-hidden="true"
    />
  ) : (
    <ChevronDown
      className={cn(
        "w-3.5 h-3.5 shrink-0 transition-transform",
        open && "rotate-180",
      )}
      aria-hidden="true"
    />
  )}
</button>
```

**Step 2: Add keyboard navigation — arrow keys and Enter/Escape**

Add a `focusedIndex` state and keyboard handler inside the component (after the `open` state):

```tsx
const [focusedIndex, setFocusedIndex] = useState<number>(-1);
// -1 = "All Sites", 0..n-1 = activeSites[i]
const allOptions = [null, ...activeSites.map((s) => s.id)];

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (!open) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      setFocusedIndex(-1);
    }
    return;
  }
  if (e.key === "Escape") {
    setOpen(false);
    return;
  }
  if (e.key === "ArrowDown") {
    e.preventDefault();
    setFocusedIndex((i) => Math.min(i + 1, allOptions.length - 2));
  }
  if (e.key === "ArrowUp") {
    e.preventDefault();
    setFocusedIndex((i) => Math.max(i - 1, -1));
  }
  if (e.key === "Enter") {
    e.preventDefault();
    handleSelect(focusedIndex === -1 ? null : activeSites[focusedIndex].id);
  }
};
```

Add `onKeyDown={handleKeyDown}` to the trigger `<button>`.

**Step 3: Update the dropdown container — add `role="listbox"` and `id`**

Replace the opening div of the dropdown (line 97):

```tsx
<div
  id="site-selector-listbox"
  role="listbox"
  aria-label="Select site"
  className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 max-h-72 overflow-y-auto"
>
```

**Step 4: Add `role="option"` and `aria-selected` to each option button**

Update the "All Sites" button:

```tsx
<button
  role="option"
  aria-selected={!selectedSite}
  className={cn(...)}
  onClick={() => handleSelect(null)}
>
```

Update each site button in the `.map()`:

```tsx
<button
  key={site.id}
  role="option"
  aria-selected={selectedSite?.id === site.id}
  className={cn(...)}
  onClick={() => handleSelect(site.id)}
>
```

**Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Open the SiteSelector in the browser. Confirm:

- Arrow keys navigate options
- Enter selects
- Escape closes
- Screen reader announces listbox and options

**Step 6: Commit**

```bash
git add components/dashboard/SiteSelector.tsx
git commit -m "fix(a11y): add ARIA listbox/option roles and keyboard navigation to SiteSelector"
```

---

### Task 4: Fix color contrast violations

**Audit reference:** §6.4
**Files:**

- Modify: `app/dashboard/layout.tsx` (footer text)
- Modify: `components/dashboard/DashboardNav.tsx` (sidebar section labels)
- Global search and replace `text-gray-400` → `text-gray-500` in all text content

**Step 1: Fix footer in `app/dashboard/layout.tsx`**

Line 26 — change `text-gray-400` to `text-gray-500`:

```tsx
<p className="text-xs text-gray-500 text-center sm:text-left">
```

Line 29 — change `text-gray-300` to `text-gray-400`:

```tsx
<p className="text-xs text-gray-400">TrafficGenius v0.1.0</p>
```

**Step 2: Audit `text-gray-400` usage across components**

Run a search to find all instances used as text content (not decorative icons):

```bash
grep -rn "text-gray-400" components/dashboard/ --include="*.tsx"
```

For each result that is text (not an icon `className`), change to `text-gray-500`. Icons carrying visual information that also have `aria-hidden` can keep `text-gray-400`.

Key locations to update:

- `components/dashboard/KpiCard.tsx` — description text
- `components/dashboard/AuditTable.tsx` — secondary text in cells
- `components/dashboard/IvtTable.tsx` — secondary text
- `components/dashboard/HelpTooltip.tsx` — trigger button color (change to `text-gray-500`)

**Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Visually confirm text is darker and readable in browser.

**Step 4: Commit**

```bash
git add -A
git commit -m "fix(a11y): improve color contrast — replace text-gray-400 with text-gray-500 for content text"
```

---

### Task 5: Add skip navigation link

**Audit reference:** §6.5
**Files:**

- Modify: `app/dashboard/layout.tsx`

**Step 1: Add skip link before `<DashboardNav />`**

Replace the layout's return with:

```tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen page-bg">
      {/* Skip navigation for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-blue focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
      >
        Skip to main content
      </a>
      <DashboardNav />
      <DashboardContent>
        <main
          id="main-content"
          className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
        >
          {children}
        </main>
        <footer className="border-t border-gray-200/40 bg-white/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
            <p className="text-xs text-gray-500 text-center sm:text-left">
              &copy; {new Date().getFullYear()} TopNetworks, Inc. All rights
              reserved.
            </p>
            <p className="text-xs text-gray-400">TrafficGenius v0.1.0</p>
          </div>
        </footer>
      </DashboardContent>
    </div>
  );
}
```

> Note: `pb-24` has been removed from `<main>`. The sticky save bar in Settings uses its own bottom padding — see the `SettingsContent` component which manages its own `pb-24` via the sticky bar overlay. Verify Settings page still works after this change.

**Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Tab to the page — the skip link should appear when focused, then jump to `#main-content`.

**Step 3: Commit**

```bash
git add app/dashboard/layout.tsx
git commit -m "fix(a11y): add skip navigation link and remove global pb-24 workaround"
```

---

### Task 6: Add toast notification system

**Audit reference:** §7.2
**Files:**

- Install: `sonner`
- Modify: `app/layout.tsx` (add `<Toaster />`)
- Modify: `components/dashboard/RuleActions.tsx`
- Modify: `components/dashboard/SiteActions.tsx`
- Modify: `components/dashboard/SiteForm.tsx`

**Step 1: Install sonner**

```bash
npm install sonner
```

**Step 2: Add `<Toaster />` to root layout**

Open `app/layout.tsx`. At the bottom of `<body>`, add the Toaster after all providers:

```tsx
import { Toaster } from "sonner";

// Inside the body:
<Toaster position="bottom-right" richColors />;
```

**Step 3: Add success/error toasts to `RuleActions.tsx`**

Add the import at the top:

```tsx
import { toast } from "sonner";
```

In `handleSubmit`, replace:

```tsx
if (res.ok) {
  setOpen(false);
  router.refresh();
}
```

With:

```tsx
if (res.ok) {
  setOpen(false);
  toast.success(mode === "add" ? "Rule created" : "Rule updated");
  router.refresh();
} else {
  const err = await res.json().catch(() => ({}));
  toast.error(err.error ?? "Failed to save rule");
}
```

In `handleDelete`, replace:

```tsx
if (res.ok) {
  router.refresh();
}
```

With:

```tsx
if (res.ok) {
  toast.success("Rule deleted");
  router.refresh();
} else {
  toast.error("Failed to delete rule");
}
```

**Step 4: Add toasts to `SiteActions.tsx`**

```tsx
import { toast } from "sonner";
```

In `handleDelete`:

```tsx
if (res.ok) {
  toast.success(`"${site.label}" deleted`);
  router.refresh();
} else {
  toast.error("Failed to delete site");
}
```

**Step 5: Add toasts to `SiteForm.tsx`**

```tsx
import { toast } from "sonner";
```

In `handleSubmit`:

```tsx
if (res.ok) {
  setOpen(false);
  toast.success(mode === "create" ? "Site created" : "Site updated");
  onSuccess?.();
  router.refresh();
} else {
  const err = await res.json().catch(() => ({}));
  toast.error(err.error ?? "Failed to save site");
}
```

**Step 6: Verify**

```bash
npx tsc --noEmit
npm run lint
```

In the browser: create/edit/delete a rule and confirm toast appears in the bottom-right corner.

**Step 7: Commit**

```bash
git add app/layout.tsx components/dashboard/RuleActions.tsx components/dashboard/SiteActions.tsx components/dashboard/SiteForm.tsx package.json package-lock.json
git commit -m "feat(ux): add toast notifications via sonner for all mutation success/error states"
```

---

### Task 7: Replace `window.confirm()` with custom ConfirmDialog

**Audit reference:** §7.3
**Files:**

- Create: `components/ui/confirm-dialog.tsx`
- Modify: `components/dashboard/RuleActions.tsx`
- Modify: `components/dashboard/SiteActions.tsx`

**Step 1: Create `components/ui/confirm-dialog.tsx`**

```tsx
"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div
              className={
                variant === "danger"
                  ? "rounded-full bg-red-50 p-2"
                  : "rounded-full bg-amber-50 p-2"
              }
            >
              <AlertTriangle
                className={
                  variant === "danger"
                    ? "w-5 h-5 text-red-500"
                    : "w-5 h-5 text-amber-500"
                }
              />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "danger" ? "destructive" : "default"}
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 2: Update `RuleActions.tsx` to use ConfirmDialog**

Add import:

```tsx
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
```

Add state:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
```

Replace the `handleDelete` call site (the delete button's `onClick`):

```tsx
// Delete button onClick:
onClick={() => {
  if (rule?.priority === 2147483647) return;
  setConfirmOpen(true);
}}
```

Replace the `handleDelete` function body — remove the `confirm()` call:

```tsx
const handleDelete = async () => {
  if (!rule) return;
  setLoading(true);
  try {
    const res = await fetch(
      `/api/cloud-armor/${policyName}/rules?priority=${rule.priority}`,
      { method: "DELETE" },
    );
    if (res.ok) {
      toast.success("Rule deleted");
      router.refresh();
    } else {
      toast.error("Failed to delete rule");
    }
  } finally {
    setLoading(false);
  }
};
```

Add the `<ConfirmDialog />` to the edit-mode return JSX (before the closing `</div>`):

```tsx
<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Delete Rule"
  description={`Delete rule at priority ${rule?.priority}? This cannot be undone.`}
  confirmLabel="Delete Rule"
  onConfirm={handleDelete}
/>
```

**Step 3: Update `SiteActions.tsx` to use ConfirmDialog**

Add import:

```tsx
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
```

Add state:

```tsx
const [confirmOpen, setConfirmOpen] = useState(false);
```

Replace delete button `onClick` with `() => setConfirmOpen(true)`.

Remove the `confirm(...)` call from `handleDelete`.

Add the `<ConfirmDialog />` to the JSX:

```tsx
<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Delete Site"
  description={`Delete "${site.label}" (${site.domain})? This cannot be undone.`}
  confirmLabel="Delete Site"
  onConfirm={handleDelete}
/>
```

**Step 4: Check that the `Button` component has a `destructive` variant**

Open `components/ui/button.tsx`. If `variant="destructive"` is not already defined, add:

```tsx
destructive:
  "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
```

to the variants object.

**Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Click delete on a rule — confirm the branded dialog appears instead of a native browser dialog.

**Step 6: Commit**

```bash
git add components/ui/confirm-dialog.tsx components/dashboard/RuleActions.tsx components/dashboard/SiteActions.tsx components/ui/button.tsx
git commit -m "feat(ux): replace window.confirm() with branded ConfirmDialog component"
```

---

## Phase 2 — Layout & Navigation Modernization

---

### Task 8: Add section groupings to sidebar

**Audit reference:** §1.4
**Files:**

- Modify: `components/dashboard/DashboardNav.tsx`

**Step 1: Update `navItems` to include group metadata**

Replace the `navItems` array with a grouped structure:

```tsx
const navGroups = [
  {
    labelKey: "nav.group.analytics",
    items: [
      {
        labelKey: "nav.overview",
        href: "/dashboard",
        icon: Activity,
        exact: true,
      },
      { labelKey: "nav.traffic", href: "/dashboard/traffic", icon: BarChart3 },
      { labelKey: "nav.botDetection", href: "/dashboard/ivt", icon: Bug },
    ],
  },
  {
    labelKey: "nav.group.security",
    items: [
      {
        labelKey: "nav.securityRules",
        href: "/dashboard/cloud-armor",
        icon: Shield,
      },
      { labelKey: "nav.sites", href: "/dashboard/sites", icon: Globe },
    ],
  },
  {
    labelKey: "nav.group.system",
    items: [
      {
        labelKey: "nav.auditLog",
        href: "/dashboard/audit-log",
        icon: ScrollText,
      },
      { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
];
```

**Step 2: Add i18n keys for group labels**

Open `lib/i18n.ts` (or wherever translations are defined). Add to both the `en` and `es` translation objects:

```ts
"nav.group.analytics": "Analytics",   // es: "Analítica"
"nav.group.security": "Security",     // es: "Seguridad"
"nav.group.system": "System",         // es: "Sistema"
```

**Step 3: Update the nav rendering in the desktop sidebar and mobile drawer**

Replace the flat `{navItems.map(...)}` calls with grouped rendering. For the desktop `<nav>`:

```tsx
<nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
  {navGroups.map((group, gi) => (
    <div key={gi} className={gi > 0 ? "mt-3" : undefined}>
      {!collapsed && (
        <p className="px-3 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {t(group.labelKey)}
        </p>
      )}
      {group.items.map((item) => (
        <NavLink key={item.href} item={item} showLabel={!collapsed} />
      ))}
    </div>
  ))}
</nav>
```

For the mobile drawer `<nav>`, use the same grouped rendering but with `showLabel={true}`.

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Open sidebar — section labels "Analytics", "Security", "System" appear above item groups.

**Step 5: Commit**

```bash
git add components/dashboard/DashboardNav.tsx lib/i18n.ts
git commit -m "feat(nav): add section groupings to sidebar navigation"
```

---

### Task 9: Persist sidebar collapse state to localStorage

**Audit reference:** §8.4
**Files:**

- Modify: `lib/sidebar-context.tsx`

**Step 1: Update `SidebarProvider` to read/write localStorage**

Replace the entire `lib/sidebar-context.tsx`:

```tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

const STORAGE_KEY = "tg:sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  setCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);

  // Hydrate from localStorage on mount (client-only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setCollapsedState(stored === "true");
    } catch {
      // localStorage unavailable (e.g. private browsing restrictions)
    }
  }, []);

  const setCollapsed = (value: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
```

**Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Collapse the sidebar, refresh the page — sidebar stays collapsed.

**Step 3: Commit**

```bash
git add lib/sidebar-context.tsx
git commit -m "feat(nav): persist sidebar collapsed state to localStorage"
```

---

### Task 10: Add user profile block to sidebar footer

**Audit reference:** §1.3
**Files:**

- Modify: `components/dashboard/DashboardNav.tsx`
- This component needs session access — use `useSession()` from NextAuth

**Step 1: Add `useSession` import**

```tsx
import { useSession, signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
```

**Step 2: Access session inside `DashboardNav`**

```tsx
const { data: session } = useSession();
```

**Step 3: Replace the sidebar footer content**

Replace the footer `<div>` (lines 258-281) with:

```tsx
<div
  className={cn(
    "border-t border-gray-100 p-3 shrink-0 flex flex-col gap-2",
    collapsed && "items-center",
  )}
>
  {!collapsed && <LanguageSwitcher />}

  {/* User profile block */}
  {session?.user && (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100/80 transition-colors group",
        collapsed ? "justify-center" : "w-full",
      )}
    >
      {session.user.image ? (
        <Image
          src={session.user.image}
          alt={session.user.name ?? "User avatar"}
          width={28}
          height={28}
          className="rounded-full shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-brand-blue/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-brand-blue" />
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">
            {session.user.name}
          </p>
          <p className="text-[11px] text-gray-400 truncate">
            {session.user.email}
          </p>
        </div>
      )}
      {!collapsed && (
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-gray-400 hover:text-red-500"
          title="Sign out"
          aria-label="Sign out"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )}

  {/* Collapse toggle */}
  <button
    onClick={() => setCollapsed((c) => !c)}
    className="flex items-center justify-center gap-2 w-full p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-xs"
    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
    aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
  >
    {collapsed ? (
      <PanelLeft className="w-4 h-4" />
    ) : (
      <>
        <PanelLeftClose className="w-4 h-4" />
        <span className="text-gray-500">{t("nav.collapse")}</span>
      </>
    )}
  </button>
</div>
```

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Log in and check the sidebar footer shows the user avatar, name, email, and a sign-out button on hover.

**Step 5: Commit**

```bash
git add components/dashboard/DashboardNav.tsx
git commit -m "feat(nav): add user profile block with sign-out to sidebar footer"
```

---

### Task 11: Add Breadcrumbs component

**Audit reference:** §1.1
**Files:**

- Create: `components/dashboard/Breadcrumbs.tsx`
- Modify: `app/dashboard/layout.tsx`

**Step 1: Create `components/dashboard/Breadcrumbs.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Overview",
  traffic: "Traffic",
  ivt: "Bot Detection",
  "cloud-armor": "Security Rules",
  sites: "Sites",
  "audit-log": "Audit Log",
  settings: "Settings",
};

export default function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();

  // Build segments from pathname: /dashboard/cloud-armor/my-policy → ["dashboard", "cloud-armor", "my-policy"]
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null; // On /dashboard itself, no breadcrumb needed

  const crumbs = segments.map((seg, i) => ({
    label: ROUTE_LABELS[seg] ?? seg,
    href: "/" + segments.slice(0, i + 1).join("/"),
    isCurrent: i === segments.length - 1,
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-sm", className)}
    >
      <Link
        href="/dashboard"
        className="text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Dashboard home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight
            className="w-3.5 h-3.5 text-gray-300"
            aria-hidden="true"
          />
          {crumb.isCurrent ? (
            <span className="text-gray-700 font-medium" aria-current="page">
              {crumb.label}
            </span>
          ) : (
            <Link
              href={crumb.href}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
```

**Step 2: Add Breadcrumbs to `app/dashboard/layout.tsx`**

Import the component:

```tsx
import Breadcrumbs from "@/components/dashboard/Breadcrumbs";
```

Add inside `<main>` before `{children}`:

```tsx
<main
  id="main-content"
  className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
>
  <Breadcrumbs className="mb-4 hidden sm:flex" />
  {children}
</main>
```

**Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Navigate to `/dashboard/cloud-armor/my-policy` — breadcrumb shows: Home > Security Rules > my-policy.

**Step 4: Commit**

```bash
git add components/dashboard/Breadcrumbs.tsx app/dashboard/layout.tsx
git commit -m "feat(nav): add breadcrumb navigation component"
```

---

### Task 12: Fix footer sticky positioning

**Audit reference:** §1.5
**Files:**

- Modify: `components/dashboard/DashboardContent.tsx`
- Modify: `app/dashboard/layout.tsx`

**Step 1: Check `DashboardContent.tsx`**

Read the file to understand the current flex structure:

```bash
cat components/dashboard/DashboardContent.tsx
```

**Step 2: Update the content wrapper to use flex column with min-h-screen**

The `DashboardContent` wrapper should use `flex flex-col min-h-screen` so that `mt-auto` on the footer pushes it to the bottom.

In `DashboardContent.tsx`, ensure the inner content area is `flex flex-col flex-1`. Then in `layout.tsx`, wrap `<main>` and `<footer>` in a `flex flex-col min-h-screen` container inside `DashboardContent`:

Update `layout.tsx` `DashboardContent` children to:

```tsx
<DashboardContent>
  <div className="flex flex-col min-h-screen">
    <main
      id="main-content"
      className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-6 sm:py-8"
    >
      <Breadcrumbs className="mb-4 hidden sm:flex" />
      {children}
    </main>
    <footer className="mt-auto border-t border-gray-200/40 bg-white/30 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center sm:justify-between gap-2">
        <p className="text-xs text-gray-500 text-center sm:text-left">
          &copy; {new Date().getFullYear()} TopNetworks, Inc. All rights
          reserved.
        </p>
        <p className="text-xs text-gray-400">TrafficGenius v0.1.0</p>
      </div>
    </footer>
  </div>
</DashboardContent>
```

**Step 3: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Open a page with little content (e.g. empty Audit Log). The footer should be at the bottom of the viewport, not floating mid-page.

**Step 4: Commit**

```bash
git add app/dashboard/layout.tsx components/dashboard/DashboardContent.tsx
git commit -m "fix(layout): make footer sticky to viewport bottom using flex column layout"
```

---

## Phase 3 — Design System Hardening

---

### Task 13: Centralize chart colors into design tokens

**Audit reference:** §3.2
**Files:**

- Modify: `app/globals.css`
- Create: `lib/chart-theme.ts`
- Modify: `components/charts/TrafficChart.tsx`
- Modify: `components/charts/IvtPieChart.tsx`
- Modify: `components/charts/CountryChart.tsx`
- Modify: `components/dashboard/IvtTable.tsx`

**Step 1: Add chart color tokens to `globals.css`**

Inside `@theme inline { ... }`, add after the existing status colors:

```css
/* Chart palette */
--color-chart-primary: #2563eb;
--color-chart-secondary: #0891b2;
--color-chart-accent: #84cc16;
--color-chart-danger: #ef4444;
--color-chart-warning: #f59e0b;
--color-chart-success: #22c55e;
--color-chart-neutral: #f1f5f9;
--color-chart-muted: #e2e8f0;
```

**Step 2: Create `lib/chart-theme.ts`**

```ts
/**
 * Chart color tokens — reads from CSS custom properties at runtime
 * so they automatically follow dark mode when implemented.
 */

function getCSSVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return (
    getComputedStyle(document.documentElement).getPropertyValue(name).trim() ||
    fallback
  );
}

export const chartColors = {
  primary: () => getCSSVar("--color-chart-primary", "#2563eb"),
  secondary: () => getCSSVar("--color-chart-secondary", "#0891b2"),
  accent: () => getCSSVar("--color-chart-accent", "#84cc16"),
  danger: () => getCSSVar("--color-chart-danger", "#ef4444"),
  warning: () => getCSSVar("--color-chart-warning", "#f59e0b"),
  success: () => getCSSVar("--color-chart-success", "#22c55e"),
  neutral: () => getCSSVar("--color-chart-neutral", "#f1f5f9"),
  muted: () => getCSSVar("--color-chart-muted", "#e2e8f0"),
} as const;

/** Pre-built GIVT/SIVT/suspicious/clean color map */
export const ivtColors = {
  GIVT: "#ef4444",
  SIVT: "#f59e0b",
  suspicious: "#f97316",
  clean: "#22c55e",
} as const;
```

**Step 3: Update chart components to use `chartColors` and `ivtColors`**

In each of `TrafficChart.tsx`, `IvtPieChart.tsx`, and `CountryChart.tsx`:

- Import `chartColors` / `ivtColors` from `@/lib/chart-theme`
- Replace all hardcoded hex strings (`#2563eb`, `#ef4444`, etc.) with the corresponding token function calls (e.g., `chartColors.primary()`)

In `IvtTable.tsx`:

- Import `ivtColors`
- Replace inline `style={{ backgroundColor: ... }}` hardcoded hex values with `ivtColors[type]` references

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Charts should render identically to before. Open browser DevTools and confirm no hardcoded hex strings remain in chart components.

**Step 5: Commit**

```bash
git add app/globals.css lib/chart-theme.ts components/charts/ components/dashboard/IvtTable.tsx
git commit -m "refactor(design-system): centralize chart colors into CSS tokens and chart-theme.ts"
```

---

### Task 14: Add animation tokens and remove dead CSS

**Audit reference:** §3.3, §3.4
**Files:**

- Modify: `app/globals.css`

**Step 1: Add animation/transition tokens inside `@theme inline`**

```css
/* Animation tokens */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--duration-fast: 150ms;
--duration-normal: 200ms;
--duration-slow: 300ms;
```

**Step 2: Remove dead `.badge-*` CSS classes**

The `.badge-critical`, `.badge-high`, `.badge-medium`, `.badge-low` classes defined around lines 116-135 are never used by components (components use the `Badge` primitive with variant props). Delete them entirely.

**Step 3: Fix `--color-error` vs `bg-red-*` inconsistency**

This is a documentation-level fix. Add a comment above `--color-error` in globals.css:

```css
/* Semantic status — use via text-error, bg-error, border-error in components */
--color-error: #ef4444; /* = red-500 */
--color-warning: #f59e0b; /* = amber-500 */
--color-success: #22c55e; /* = green-500 */
--color-info: #3b82f6; /* = blue-500 */
```

**Step 4: Verify**

```bash
npm run lint
npm run build
```

No build errors. Visually confirm no style regressions.

**Step 5: Commit**

```bash
git add app/globals.css
git commit -m "refactor(design-system): add animation tokens, remove dead badge CSS, document semantic colors"
```

---

### Task 15: Implement dark mode tokens and wire preference toggle

**Audit reference:** §3.1
**Files:**

- Modify: `app/globals.css`
- Modify: `components/dashboard/SettingsContent.tsx`
- Modify: `app/layout.tsx` (or root Providers)

**Step 1: Add dark mode token overrides to `globals.css`**

After the `@theme inline` block, add:

```css
/* Dark mode token overrides — activated via .dark class on <html> */
.dark {
  --color-background: #0f172a;
  --color-foreground: #f1f5f9;
  --color-card: #1e293b;
  --color-card-foreground: #e2e8f0;
  --color-border: #334155;
  --color-input: #1e293b;
  --color-muted: #1e293b;
  --color-muted-foreground: #94a3b8;
}
```

**Step 2: Update `body` in `globals.css` to use token**

```css
body {
  font-family: var(--font-sans);
  color: var(--color-foreground);
  background: var(--color-background);
  min-height: 100vh;
  overflow-x: hidden;
}
```

**Step 3: Wire `darkMode` preference in `SettingsContent.tsx`**

After the preferences are loaded, add a `useEffect` that applies/removes the `.dark` class:

```tsx
useEffect(() => {
  if (prefs.darkMode) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [prefs.darkMode]);
```

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Toggle dark mode in Settings — the page background should shift to dark.

> Note: Full dark mode coverage across all components requires `dark:` variants on individual Tailwind classes. This task establishes the token infrastructure; full component theming is a follow-up.

**Step 5: Commit**

```bash
git add app/globals.css components/dashboard/SettingsContent.tsx
git commit -m "feat(design-system): add dark mode tokens and wire preference toggle"
```

---

## Phase 4 — Data Experience Upgrade

---

### Task 16: Create shared `EmptyState` component and skeleton presets

**Audit reference:** §2.4, §2.5
**Files:**

- Create: `components/ui/empty-state.tsx`
- Create: `components/ui/page-skeleton.tsx`
- Modify: All table/list components using inline empty strings

**Step 1: Create `components/ui/empty-state.tsx`**

```tsx
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-6 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="rounded-full bg-gray-100 p-4 mb-4">
          <Icon className="w-8 h-8 text-gray-400" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-gray-700 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

**Step 2: Create `components/ui/page-skeleton.tsx`**

```tsx
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type SkeletonVariant = "kpi-grid" | "table" | "chart";

interface PageSkeletonProps {
  variant: SkeletonVariant;
  className?: string;
}

export function PageSkeleton({ variant, className }: PageSkeletonProps) {
  if (variant === "kpi-grid") {
    return (
      <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return <Skeleton className={cn("h-72 rounded-xl", className)} />;
  }

  // table
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-10 rounded-lg w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-lg w-full" />
      ))}
    </div>
  );
}
```

**Step 3: Replace inline empty state strings in table components**

In `IvtTable.tsx`, `AuditTable.tsx`, `PolicyList.tsx`, and `Sites` page — replace ad-hoc empty state strings with `<EmptyState />`.

Example for `IvtTable.tsx`:

```tsx
import { EmptyState } from "@/components/ui/empty-state";
import { Bug } from "lucide-react";

// Replace: <div>No IVT records found</div>
// With:
<EmptyState
  icon={Bug}
  title="No IVT records found"
  description="No invalid traffic was detected in the selected time range."
/>;
```

**Step 4: Update page-level skeleton functions**

In each `app/dashboard/*/page.tsx` file, replace the inline `*Skeleton()` function definitions with `<PageSkeleton variant="..." />` from the shared component.

**Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Check that empty states render correctly when there's no data.

**Step 6: Commit**

```bash
git add components/ui/empty-state.tsx components/ui/page-skeleton.tsx components/dashboard/ app/dashboard/
git commit -m "feat(ux): add shared EmptyState component and PageSkeleton presets"
```

---

### Task 17: Add pagination to data tables

**Audit reference:** §4.1
**Files:**

- Create: `components/ui/pagination.tsx`
- Modify: `components/dashboard/IvtTable.tsx`
- Modify: `components/dashboard/AuditTable.tsx`
- Modify: `app/dashboard/ivt/page.tsx`
- Modify: `app/dashboard/audit-log/page.tsx`

**Step 1: Create `components/ui/pagination.tsx`**

```tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  total: number;
  pageSize: number;
  currentPage: number;
}

export function Pagination({ total, pageSize, currentPage }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1) return null;

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-between px-2 py-3 border-t border-gray-100">
      <p className="text-xs text-gray-500">
        Showing {Math.min((currentPage - 1) * pageSize + 1, total)}–
        {Math.min(currentPage * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-xs text-gray-600 px-2">
          {currentPage} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 2: Add `page` searchParam to IVT and Audit page data fetching**

In `app/dashboard/ivt/page.tsx` and `app/dashboard/audit-log/page.tsx`, extract `page` from `searchParams`:

```tsx
const page = Number(searchParams.page ?? "1");
const pageSize = 20;
const offset = (page - 1) * pageSize;
```

Pass `offset` and `limit: pageSize` to the BigQuery query functions.

**Step 3: Add `<Pagination />` to both table components**

At the bottom of `IvtTable` and `AuditTable`, render:

```tsx
<Pagination total={total} pageSize={pageSize} currentPage={currentPage} />
```

Pass `total`, `pageSize`, and `currentPage` as props to each table component.

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

With enough data, the IVT and Audit tables should show page navigation.

**Step 5: Commit**

```bash
git add components/ui/pagination.tsx components/dashboard/IvtTable.tsx components/dashboard/AuditTable.tsx app/dashboard/ivt/page.tsx app/dashboard/audit-log/page.tsx
git commit -m "feat(tables): add server-side pagination to IVT and Audit Log tables"
```

---

### Task 18: Add column sorting to data tables

**Audit reference:** §4.2
**Files:**

- Modify: `components/dashboard/IvtTable.tsx`
- Modify: `components/dashboard/AuditTable.tsx`
- Modify: `app/dashboard/ivt/page.tsx`
- Modify: `app/dashboard/audit-log/page.tsx`

**Step 1: Create a `SortableHeader` helper**

Inside `IvtTable.tsx` and `AuditTable.tsx`, add a small `SortableHeader` component:

```tsx
function SortableHeader({
  column,
  label,
  currentSort,
  currentOrder,
  onSort,
}: {
  column: string;
  label: string;
  currentSort: string;
  currentOrder: "asc" | "desc";
  onSort: (col: string) => void;
}) {
  const isActive = currentSort === column;
  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-800 transition-colors"
      aria-label={`Sort by ${label} ${isActive && currentOrder === "asc" ? "descending" : "ascending"}`}
    >
      {label}
      <span className="text-gray-300">
        {isActive ? (currentOrder === "asc" ? "↑" : "↓") : "↕"}
      </span>
    </button>
  );
}
```

**Step 2: Read `sort` and `order` from `searchParams` in page components**

```tsx
const sort = (searchParams.sort as string) ?? "timestamp";
const order = (searchParams.order as "asc" | "desc") ?? "desc";
```

Pass to data-fetching functions and to the table components as props.

**Step 3: Wire sort `onSort` to update URL params**

In the table component, use `useRouter` + `useSearchParams` to push the updated sort params on column header click.

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Click column headers — URL updates with `?sort=timestamp&order=asc`, data re-fetches in correct order.

**Step 5: Commit**

```bash
git add components/dashboard/IvtTable.tsx components/dashboard/AuditTable.tsx app/dashboard/ivt/page.tsx app/dashboard/audit-log/page.tsx
git commit -m "feat(tables): add server-side column sorting to IVT and Audit Log tables"
```

---

### Task 19: Add filter controls above data tables

**Audit reference:** §4.3
**Files:**

- Create: `components/dashboard/TableFilters.tsx`
- Modify: `components/dashboard/IvtTable.tsx`
- Modify: `components/dashboard/AuditTable.tsx`
- Modify: page components for IVT and Audit

**Step 1: Create `components/dashboard/TableFilters.tsx`**

```tsx
"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface FilterOption {
  value: string;
  label: string;
}

interface TableFiltersProps {
  searchPlaceholder?: string;
  searchParam?: string;
  filters?: Array<{
    param: string;
    label: string;
    options: FilterOption[];
  }>;
}

export function TableFilters({
  searchPlaceholder = "Search...",
  searchParam = "q",
  filters = [],
}: TableFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams();
    router.push(pathname);
  }

  const hasActiveFilters =
    searchParams.get(searchParam) ||
    filters.some((f) => searchParams.get(f.param));

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-48">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder={searchPlaceholder}
          defaultValue={searchParams.get(searchParam) ?? ""}
          onChange={(e) => updateParam(searchParam, e.target.value)}
          className="pl-9 h-9 text-sm"
          aria-label={searchPlaceholder}
        />
      </div>
      {filters.map((f) => (
        <Select
          key={f.param}
          value={searchParams.get(f.param) ?? ""}
          onChange={(e) => updateParam(f.param, e.target.value)}
          options={[{ value: "", label: `All ${f.label}` }, ...f.options]}
          aria-label={`Filter by ${f.label}`}
          className="h-9 text-sm w-auto"
        />
      ))}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAll} className="h-9">
          <X className="w-4 h-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}
```

**Step 2: Add `TableFilters` above the IVT table**

In `app/dashboard/ivt/page.tsx`, above `<IvtTable>`, render:

```tsx
<TableFilters
  searchPlaceholder="Search by IP address..."
  searchParam="ip"
  filters={[
    {
      param: "type",
      label: "IVT Type",
      options: [
        { value: "GIVT", label: "GIVT" },
        { value: "SIVT", label: "SIVT" },
        { value: "suspicious", label: "Suspicious" },
        { value: "clean", label: "Clean" },
      ],
    },
    {
      param: "country",
      label: "Country",
      options: [
        { value: "US", label: "United States" },
        { value: "CN", label: "China" },
        { value: "RU", label: "Russia" },
        // Add more as needed
      ],
    },
  ]}
/>
```

**Step 3: Pass filter params to BigQuery queries**

In the IVT and audit page data-fetching functions, read `ip`, `type`, `country`, `action` from `searchParams` and pass to the query layer as WHERE clause conditions.

**Step 4: Add `TableFilters` above the Audit Log table**

Similarly add filters for action type (CREATE/UPDATE/DELETE/TOGGLE) and user search.

**Step 5: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Type in the search box — URL updates, table data refreshes with filtered results.

**Step 6: Commit**

```bash
git add components/dashboard/TableFilters.tsx app/dashboard/ivt/page.tsx app/dashboard/audit-log/page.tsx
git commit -m "feat(tables): add search and filter controls above IVT and Audit Log tables"
```

---

### Task 20: Wire auto-refresh preference to dashboard pages

**Audit reference:** §7.4
**Files:**

- Create: `components/dashboard/AutoRefresh.tsx`
- Modify: `app/dashboard/page.tsx` (overview)
- Modify: `app/dashboard/traffic/page.tsx`

**Step 1: Create `components/dashboard/AutoRefresh.tsx`**

```tsx
"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface AutoRefreshProps {
  /** Interval in seconds. 0 = disabled. */
  intervalSeconds: number;
}

export default function AutoRefresh({ intervalSeconds }: AutoRefreshProps) {
  const router = useRouter();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!intervalSeconds || intervalSeconds <= 0) return;
    const id = setInterval(refresh, intervalSeconds * 1000);
    return () => clearInterval(id);
  }, [intervalSeconds, refresh]);

  return null; // no visual output
}
```

**Step 2: Load refresh preference in dashboard pages**

In `app/dashboard/page.tsx` (overview), fetch the user's preferences from the database and pass `refreshInterval` to the `AutoRefresh` component:

```tsx
// Server component: fetch preferences
const prefs = await getUserPreferences(session.user.id);

// In the returned JSX:
<AutoRefresh intervalSeconds={Number(prefs?.refreshInterval ?? 0)} />;
```

Add the same to `app/dashboard/traffic/page.tsx`.

**Step 3: Add "Last updated" indicator**

In the dashboard overview page, display a "Last updated: X seconds ago" label using a client component that ticks every second.

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Set refresh interval to 30 seconds in Settings — the Overview page should auto-refresh data every 30 seconds.

**Step 5: Commit**

```bash
git add components/dashboard/AutoRefresh.tsx app/dashboard/page.tsx app/dashboard/traffic/page.tsx
git commit -m "feat(ux): wire auto-refresh preference to dashboard pages via router.refresh()"
```

---

## Phase 5 — Component Architecture

---

### Task 21: Dynamic import chart components

**Audit reference:** §8.2
**Files:**

- Modify: Every page that imports chart components

**Step 1: Update imports in dashboard pages**

In `app/dashboard/page.tsx` (overview), replace static chart imports with dynamic:

```tsx
import dynamic from "next/dynamic";
import { PageSkeleton } from "@/components/ui/page-skeleton";

const TrafficChart = dynamic(() => import("@/components/charts/TrafficChart"), {
  loading: () => <PageSkeleton variant="chart" />,
  ssr: false,
});

const IvtPieChart = dynamic(() => import("@/components/charts/IvtPieChart"), {
  loading: () => <PageSkeleton variant="chart" />,
  ssr: false,
});

const CountryChart = dynamic(() => import("@/components/charts/CountryChart"), {
  loading: () => <PageSkeleton variant="chart" />,
  ssr: false,
});
```

Do the same in `app/dashboard/traffic/page.tsx` and `app/dashboard/ivt/page.tsx`.

**Step 2: Verify**

```bash
npm run build
```

Check the build output — chart bundle should be split into separate chunks. Confirm `.next/static/chunks/` contains separate chart chunk files.

**Step 3: Commit**

```bash
git add app/dashboard/
git commit -m "perf: dynamically import Recharts chart components to reduce initial bundle"
```

---

### Task 22: Add granular error boundaries per data section

**Audit reference:** §8.3
**Files:**

- Create: `components/ui/section-error.tsx`
- Modify: `app/dashboard/page.tsx`
- Modify: `app/dashboard/traffic/page.tsx`

**Step 1: Create `components/ui/section-error.tsx`**

```tsx
"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SectionErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}

export default function SectionError({
  error,
  reset,
  title = "Failed to load section",
}: SectionErrorProps) {
  useEffect(() => {
    // Log to error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 text-center rounded-xl border border-red-100 bg-red-50/50">
      <AlertCircle className="w-8 h-8 text-red-400 mb-3" />
      <h3 className="text-sm font-semibold text-red-700 mb-1">{title}</h3>
      <p className="text-xs text-red-500 mb-4">
        {error.message ?? "An unexpected error occurred"}
      </p>
      <Button variant="outline" size="sm" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
```

**Step 2: Add `error.tsx` files per section**

Next.js App Router supports per-segment error boundaries via `error.tsx` files. For each dashboard sub-route that has its own data loading, create:

- `app/dashboard/ivt/error.tsx`
- `app/dashboard/traffic/error.tsx`
- `app/dashboard/cloud-armor/error.tsx`
- `app/dashboard/audit-log/error.tsx`

Each file:

```tsx
"use client";

import SectionError from "@/components/ui/section-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SectionError error={error} reset={reset} />;
}
```

**Step 3: Verify**

```bash
npx tsc --noEmit
npm run build
```

**Step 4: Commit**

```bash
git add components/ui/section-error.tsx app/dashboard/*/error.tsx
git commit -m "feat(reliability): add granular error boundaries per dashboard section"
```

---

### Task 23: Fix `aria-label` on icon-only buttons

**Audit reference:** §6.6
**Files:**

- Modify: `components/dashboard/RuleActions.tsx`
- Modify: `components/dashboard/SiteActions.tsx`
- Modify: `components/dashboard/SiteForm.tsx`

**Step 1: Update icon-only buttons**

In `RuleActions.tsx`, replace `title="Edit rule"` with `aria-label="Edit rule"` on the Pencil button. Replace `title="Delete rule"` with `aria-label="Delete rule"` on the Trash2 button.

In `SiteActions.tsx`, same pattern — add `aria-label="Delete site"`.

In `SiteForm.tsx`, add `aria-label="Edit site"` on the Pencil button.

**Step 2: Fix `HelpTooltip.tsx`**

Update `aria-label` to be context-specific. The component already has `aria-label="Help"` but change it to be associated with what it's help for. Modify the `HelpTooltipProps` interface to accept an optional `aria-label` override:

```tsx
interface HelpTooltipProps {
  helpKey: string;
  className?: string;
  ariaLabel?: string;
}
```

Use it: `aria-label={ariaLabel ?? "Help"}`.

Also add `role="tooltip"` and an `id` + `aria-describedby` connection:

```tsx
const tooltipId = `tooltip-${helpKey}`;

// On the button:
aria-describedby={open ? tooltipId : undefined}

// On the tooltip div:
id={tooltipId}
role="tooltip"
```

**Step 3: Fix `CardTitle` to render as `<h3>`**

Open `components/ui/card.tsx`. Change `CardTitle` from:

```tsx
function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("...", className)} {...props} />;
}
```

To:

```tsx
function CardTitle({
  className,
  as: Tag = "h3",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement> & { as?: "h2" | "h3" | "h4" }) {
  return (
    <Tag
      className={cn(
        "text-base font-semibold leading-none tracking-tight",
        className,
      )}
      {...props}
    />
  );
}
```

**Step 4: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Use a screen reader to confirm icon-only buttons are announced with meaningful labels.

**Step 5: Commit**

```bash
git add components/dashboard/RuleActions.tsx components/dashboard/SiteActions.tsx components/dashboard/SiteForm.tsx components/dashboard/HelpTooltip.tsx components/ui/card.tsx
git commit -m "fix(a11y): add aria-label to icon-only buttons, fix CardTitle heading hierarchy, add tooltip ARIA"
```

---

### Task 24: Fix chart fullscreen — keyboard Escape close

**Audit reference:** §7.6
**Files:**

- Modify: `components/charts/ChartActions.tsx`

**Step 1: Add Escape key handler to fullscreen overlay**

Read `components/charts/ChartActions.tsx` to understand the current fullscreen implementation. Find where fullscreen state is managed and the overlay is rendered.

Add a `useEffect` that listens for Escape:

```tsx
useEffect(() => {
  if (!fullscreen) return;
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") setFullscreen(false);
  }
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [fullscreen]);
```

Also add `aria-label="Close fullscreen"` and `role="dialog"` on the fullscreen overlay, with `aria-modal="true"`.

**Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

Open a chart fullscreen — Escape should close it.

**Step 3: Commit**

```bash
git add components/charts/ChartActions.tsx
git commit -m "fix(a11y): add Escape key handler and ARIA to chart fullscreen overlay"
```

---

### Task 25: Add swipe-to-close for mobile sidebar drawer

**Audit reference:** §5.4
**Files:**

- Modify: `components/dashboard/DashboardNav.tsx`

**Step 1: Add drag handler to mobile drawer using `framer-motion`**

`framer-motion` is already installed. Wrap the mobile `<aside>` (the drawer) with `motion.aside` and add a drag constraint:

```tsx
import { motion } from "framer-motion";

// Replace the mobile drawer <aside> with:
<motion.aside
  className={cn(
    "lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200/60 shadow-xl",
    // Remove transition classes — framer-motion handles animation
  )}
  initial={{ x: "-100%" }}
  animate={{ x: mobileOpen ? 0 : "-100%" }}
  transition={{ type: "spring", damping: 30, stiffness: 300 }}
  drag="x"
  dragConstraints={{ left: -288, right: 0 }}
  dragElastic={0.1}
  onDragEnd={(_, info) => {
    if (info.offset.x < -50) {
      setMobileOpen(false);
    }
  }}
>
  {/* existing drawer content */}
</motion.aside>;
```

**Step 2: Verify**

```bash
npx tsc --noEmit
npm run lint
```

On a mobile viewport (or browser DevTools mobile emulation), open the drawer and swipe left — it should close.

**Step 3: Commit**

```bash
git add components/dashboard/DashboardNav.tsx
git commit -m "feat(mobile): add swipe-to-close gesture to mobile sidebar drawer via framer-motion"
```

---

## Final Verification

After all tasks are complete:

```bash
# Full type check
npx tsc --noEmit

# Lint and format check
npm run lint

# Production build
npm run build

# Start production server
npm run start
```

Manual checklist:

- [ ] All dialogs trap focus and close on Escape
- [ ] SiteSelector navigable by keyboard
- [ ] Skip link appears on focus and jumps to `#main-content`
- [ ] Toast notifications fire on create/edit/delete
- [ ] Confirm dialog replaces native `confirm()` on all deletes
- [ ] Sidebar collapse state persists across page refresh
- [ ] Breadcrumbs show on all deep pages
- [ ] Footer sticks to viewport bottom on short-content pages
- [ ] Chart colors reference design tokens
- [ ] Dark mode toggle shifts page to dark theme
- [ ] IVT and Audit tables have pagination + sorting + filter controls
- [ ] Fullscreen chart closes on Escape
- [ ] Mobile sidebar closes on swipe-left
- [ ] No `console.log` or `window.location.reload` or `window.confirm` remaining

```bash
# Final check for prohibited patterns
grep -rn "window\.location\.reload\|window\.confirm\|console\.log" app/ components/ lib/ --include="*.tsx" --include="*.ts"
```

Expected: no matches.

export interface MenuItem {
  href: string;
  label: string;
  description: string;
  category: string;
}

export const MENU_ITEMS: readonly MenuItem[] = [
  {
    href: "/mobility",
    label: "Mobility",
    description:
      "Exploring movement, travel, and the vehicles that connect us to places and experiences.",
    category: "mobility",
  },
  {
    href: "/system",
    label: "System",
    description:
      "Building, optimizing, and understanding the systems that power our digital lives.",
    category: "system",
  },
  {
    href: "/asset",
    label: "Asset",
    description:
      "Thoughts on wealth, investment, and the philosophy of building long-term value.",
    category: "asset",
  },
  {
    href: "/kernel",
    label: "Kernel",
    description:
      "Deep reflections on philosophy, design principles, and the core ideas that shape our thinking.",
    category: "kernel",
  },
] as const;

export function isValidCategory(
  category: string | undefined
): category is MenuItem["category"] {
  if (!category) return false;
  return MENU_ITEMS.some((item) => item.category === category);
}

export function getCategoryBySlug(
  slug: string | undefined
): MenuItem | undefined {
  if (!slug) return undefined;
  return MENU_ITEMS.find((item) => item.category === slug);
}

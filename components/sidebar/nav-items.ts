import {
  LayoutDashboard,
  Image,
  Tags,
  Package,
  Ruler,
  ShoppingCart,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: (storeId: string) => string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const navItems: NavItem[] = [
  {
    href: (storeId) => `/${storeId}`,
    label: "Overview",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: (storeId) => `/${storeId}/billboards`,
    label: "Billboards",
    icon: Image,
  },
  {
    href: (storeId) => `/${storeId}/categories`,
    label: "Categories",
    icon: Tags,
  },
  {
    href: (storeId) => `/${storeId}/products`,
    label: "Products",
    icon: Package,
  },
  {
    href: (storeId) => `/${storeId}/sizes`,
    label: "Sizes",
    icon: Ruler,
  },
  {
    href: (storeId) => `/${storeId}/orders`,
    label: "Orders",
    icon: ShoppingCart,
  },
  {
    href: (storeId) => `/${storeId}/settings`,
    label: "Settings",
    icon: Settings,
  },
];

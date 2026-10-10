"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";

export function ClerkThemedProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      afterSignOutUrl="/"
      appearance={{ theme: resolvedTheme === "dark" ? dark : undefined }}
    >
      {children}
    </ClerkProvider>
  );
}

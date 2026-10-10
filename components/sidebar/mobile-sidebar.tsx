"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { Store } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import StoreSwitcher from "@/components/store-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarNav } from "./sidebar-nav";

interface MobileSidebarProps {
  storeId: string;
  stores: Store[];
}

export const MobileSidebar = ({ storeId, stores }: MobileSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-3 border-b bg-background px-4 py-2 lg:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <Button
          variant="outline"
          size="icon"
          aria-label="Open navigation menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
        <SheetContent side="left" className="flex w-72 flex-col p-4">
          <SheetHeader className="mb-4 flex-row items-center gap-2 space-y-0 text-left">
            <div className="h-7 w-7 rounded-md bg-primary" />
            <SheetTitle>Commerce</SheetTitle>
          </SheetHeader>

          <StoreSwitcher items={stores} />

          <div className="mt-6 flex-1 overflow-y-auto">
            <SidebarNav storeId={storeId} onNavigate={() => setOpen(false)} />
          </div>

          <div className="mt-4 flex items-center gap-2 border-t pt-4">
            <UserButton />
            <span className="flex-1 truncate text-sm font-medium">Account</span>
            <ModeToggle />
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">Dashboard</span>
    </div>
  );
};

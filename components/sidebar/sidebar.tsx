import { UserButton } from "@clerk/nextjs";
import { Store } from "@prisma/client";

import StoreSwitcher from "@/components/store-switcher";
import { ModeToggle } from "@/components/mode-toggle";
import { SidebarNav } from "./sidebar-nav";

interface SidebarProps {
  storeId: string;
  stores: Store[];
}

export const Sidebar = ({ storeId, stores }: SidebarProps) => {
  return (
    <div className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r bg-background p-4 lg:flex">
      <div className="mb-4 flex items-center gap-2 px-1">
        <div className="h-7 w-7 rounded-md bg-primary" />
        <span className="text-base font-bold">Commerce</span>
      </div>

      <StoreSwitcher items={stores} />

      <div className="mt-6 flex-1 overflow-y-auto">
        <SidebarNav storeId={storeId} />
      </div>

      <div className="mt-4 flex items-center gap-2 border-t pt-4">
        <UserButton />
        <span className="flex-1 truncate text-sm font-medium">Account</span>
        <ModeToggle />
      </div>
    </div>
  );
};

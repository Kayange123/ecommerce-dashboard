"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import React, { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X } from "lucide-react";
import { Dialog } from "@headlessui/react";
import { UserButton } from "@clerk/nextjs";
import IconButton from "./ui/IconButton";
const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  const pathname = usePathname();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);
  const onOpen = () => setIsOpen(true);
  const onClose = () => setIsOpen(false);
  const routes = [
    {
      href: `/${params.storeId}`,
      label: "Overview",
      active: pathname === `/${params.storeId}`,
    },
    {
      href: `/${params.storeId}/billboards`,
      label: "My billboards",
      active: pathname === `/${params.storeId}/billboards`,
    },
    {
      href: `/${params.storeId}/categories`,
      label: "Categories",
      active: pathname === `/${params.storeId}/categories`,
    },
    {
      href: `/${params.storeId}/products`,
      label: "Products",
      active: pathname === `/${params.storeId}/products`,
    },
    {
      href: `/${params.storeId}/sizes`,
      label: "My sizes",
      active: pathname === `/${params.storeId}/sizes`,
    },
    {
      href: `/${params.storeId}/orders`,
      label: "My orders",
      active: pathname === `/${params.storeId}/orders`,
    },
    {
      href: `/${params.storeId}/settings`,
      label: "Settings",
      active: pathname === `/${params.storeId}/settings`,
    },
  ];
  return (
    <>
      <nav className={cn("space-x-4", className)}>
        <div
          className={cn("hidden lg:flex items-center space-x-4 lg:space-x-6")}
        >
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-primary",
                route.active
                  ? "text-black dark:text-white"
                  : "text-muted-foreground"
              )}
            >
              {route.label}
            </Link>
          ))}
          <div className="mx-auto flex justify-center items-center space-x-4">
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
        <div className="lg:hidden">
          <Button className="lg:hidden bg-white" onClick={onOpen}>
            <Menu size={25} color="black" />
          </Button>
          <Dialog
            onClose={onClose}
            open={isOpen}
            as="div"
            className="relative z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
            <div className="flex fixed inset-0">
              <Dialog.Panel className="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto shadow-xl bg-white py-6 pb-4">
                <div className="flex items-center justify-end px-4">
                  <IconButton icon={<X size={20} />} onClick={onClose} />
                </div>
                <div className="mx-auto flex justify-center items-center space-x-4">
                  <UserButton afterSignOutUrl="/" />
                </div>
                <div className="flex flex-col w-full space-y-3 mt-10 items-center">
                  {routes.map((route) => (
                    <Link
                      onClick={onClose}
                      key={route.href}
                      href={route.href}
                      className={cn(
                        " font-medium text-xl transition-colors hover:text-primary",
                        route.active
                          ? "text-black dark:text-white"
                          : "text-muted-foreground"
                      )}
                    >
                      {route.label}
                    </Link>
                  ))}
                </div>
              </Dialog.Panel>
            </div>
          </Dialog>
        </div>
      </nav>
    </>
  );
};

export default MainNav;

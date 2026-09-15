import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import React from "react";
import MainNav from "./MainNav";
import StoreSwitcher from "@/components/store-switcher";
import { redirect } from "next/navigation";
import prismadb from "@/lib/prismadb";

const Navbar = async () => {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }
  const stores = await prismadb.store.findMany({
    where: {
      userId,
    },
  });
  return (
    <div className="border-b py-2">
      <div className="flex h-14 items-center justify-between px-4">
        <StoreSwitcher items={stores} />
        <MainNav className=" " />
      </div>
    </div>
  );
};

export default Navbar;

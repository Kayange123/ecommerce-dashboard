import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar/sidebar";
import { MobileSidebar } from "@/components/sidebar/mobile-sidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ storeId: string }>;
}
export default async function DashboardLayout(props: DashboardLayoutProps) {
  const params = await props.params;

  const { children } = props;

  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const store = await prismadb.store.findFirst({
    where: {
      id: params?.storeId,
      userId,
    },
  });
  if (!store) return redirect("/");

  const stores = await prismadb.store.findMany({
    where: {
      userId,
    },
  });

  return (
    <div className="h-full">
      <Sidebar storeId={params.storeId} stores={stores} />
      <MobileSidebar storeId={params.storeId} stores={stores} />
      <main className="lg:pl-64">{children}</main>
    </div>
  );
}

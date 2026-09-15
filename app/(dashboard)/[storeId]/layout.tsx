import Navbar from "@/components/Navbar";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

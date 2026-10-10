import SettingsForm from "@/components/SettingsForm";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

interface SettingPageProps {
  params: Promise<{
    storeId: string;
  }>;
}

const SettingPage = async (props: SettingPageProps) => {
  const params = await props.params;

  const { storeId } = params;

  const { userId } = await auth();

  if (!userId) redirect("/sign-in");
  const store = await prismadb.store.findFirst({
    where: {
      id: storeId,
      userId,
    },
    include: {
      _count: {
        select: {
          products: true,
          categories: true,
          billboards: true,
          sizes: true,
        },
      },
    },
  });
  if (!store) redirect("/");
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <SettingsForm initialData={store} counts={store._count} />
      </div>
    </div>
  );
};

export default SettingPage;

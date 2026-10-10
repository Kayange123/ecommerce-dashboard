import { ListPageSkeleton } from "@/components/skeletons/list-page-skeleton";

export default function Loading() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <ListPageSkeleton />
      </div>
    </div>
  );
}

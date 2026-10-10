import { FormPageSkeleton } from "@/components/skeletons/form-page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8">
        <Skeleton className="mb-8 h-24 w-24 rounded-md" />
        <FormPageSkeleton fields={4} />
      </div>
    </div>
  );
}

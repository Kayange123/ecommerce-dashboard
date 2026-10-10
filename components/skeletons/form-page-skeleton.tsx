import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export const FormPageSkeleton = ({ fields = 3 }: { fields?: number }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-9 w-9" />
      </div>
      <Separator className="my-4" />
      <div className="grid gap-8 sm:grid-cols-3">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="mt-8 h-10 w-28" />
    </div>
  );
};

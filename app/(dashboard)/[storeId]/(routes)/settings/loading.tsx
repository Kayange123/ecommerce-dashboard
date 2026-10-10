import { FormPageSkeleton } from "@/components/skeletons/form-page-skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <FormPageSkeleton fields={1} />
      </div>
    </div>
  );
}

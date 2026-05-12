import { Skeleton } from "@/components/shared/loading-skeleton";
export default function Loading() {
  return (
    <div className="space-y-6 max-w-3xl">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-6 md:grid-cols-3">
        <Skeleton className="h-64 rounded-xl" />
        <div className="md:col-span-2 space-y-4">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

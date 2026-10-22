import { SkeletonGrid } from "@/components/ui";

export default function Loading() {
  return (
    <div className="container-page py-8">
      <div className="h-3 w-40 animate-pulse rounded bg-mist" />
      <div className="mt-5 h-9 w-64 animate-pulse rounded bg-mist" />
      <div className="mt-2 h-3 w-32 animate-pulse rounded bg-mist" />
      <div className="mt-8">
        <SkeletonGrid count={8} />
      </div>
    </div>
  );
}

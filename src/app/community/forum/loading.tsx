import { SkeletonList } from "@/components/Skeleton";

export default function ForumLoading() {
  return (
    <div className="page-padding">
      <div className="container container-md">
        <SkeletonList count={5} />
      </div>
    </div>
  );
}

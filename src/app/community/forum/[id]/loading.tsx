import { SkeletonDetail } from "@/components/Skeleton";

export default function TopicLoading() {
  return (
    <div className="page-padding">
      <div className="container container-md">
        <SkeletonDetail />
      </div>
    </div>
  );
}

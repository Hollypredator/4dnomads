import { SkeletonList } from "@/components/Skeleton";

export default function EmergencyLoading() {
  return (
    <div className="page-padding">
      <div className="container container-md">
        <SkeletonList count={3} />
      </div>
    </div>
  );
}

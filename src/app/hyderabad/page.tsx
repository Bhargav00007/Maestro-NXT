import RegionPage from "@/components/regionPage";
import RegionLayout from "../region-layout";
import { Activity } from "lucide-react";

export default function HyderabadPage() {
  return (
    <RegionLayout>
      <RegionPage
        region="hyderabad"
        title="Hyderabad"
        icon={<Activity className="h-6 w-6" />}
        color="bg-orange-100 text-orange-600"
      />
    </RegionLayout>
  );
}
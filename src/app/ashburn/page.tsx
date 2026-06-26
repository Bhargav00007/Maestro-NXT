import RegionPage from "@/components/regionPage";
import RegionLayout from "../region-layout";
import { Server } from "lucide-react";

export default function AshburnPage() {
  return (
    <RegionLayout>
      <RegionPage
        region="ashburn"
        title="Data Center (Ashburn)"
        icon={<Server className="h-6 w-6" />}
        color="bg-blue-100 text-blue-600"
      />
    </RegionLayout>
  );
}
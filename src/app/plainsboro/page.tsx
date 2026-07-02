import RegionPage from "@/components/regionPage";
import RegionLayout from "../region-layout";
import { Database } from "lucide-react";

export default function PlainsboroPage() {
  return (
    <RegionLayout>
      <RegionPage
        region="plainsboro"
        title="Plainsboro"
        icon={<Database className="h-6 w-6" />}
        color="bg-purple-100 text-purple-600"
      />
    </RegionLayout>
  );
}
import RegionPage from "@/components/regionPage";
import RegionLayout from "../region-layout";
import { Server } from "lucide-react";

export default function CulpepperPage() {
  return (
    <RegionLayout>
      <RegionPage
        region="culpepper"
        title="Data Center (Culpepper)"
        icon={<Server className="h-6 w-6" />}
        color="bg-blue-100 text-blue-600"
      />
    </RegionLayout>
  );
}
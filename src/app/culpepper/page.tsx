import RegionPage from "@/components/regionPage";
import RegionLayout from "../region-layout";
import { Server } from "lucide-react";

export default function CulpepperPage() {
  return (
    <RegionLayout>
      <RegionPage
        region="culpepper"
        title="Culpepper"
        icon={<Server className="h-6 w-6" />}
        color="bg-green-100 text-green-600"
      />
    </RegionLayout>
  );
}
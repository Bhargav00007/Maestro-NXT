import RegionPage from "@/components/regionPage";
import RegionLayout from "../region-layout";
import { Wifi } from "lucide-react";

export default function SingaporePage() {
  return (
    <RegionLayout>
      <RegionPage
        region="singapore"
        title="Singapore"
        icon={<Wifi className="h-6 w-6" />}
        color="bg-red-100 text-red-600"
      />
    </RegionLayout>
  );
}
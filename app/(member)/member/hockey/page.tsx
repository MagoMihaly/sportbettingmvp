import { HockeySectionNav } from "@/components/hockey-section-nav";
import { HockeyWorkspace } from "@/components/hockey-workspace";
import { getDashboardData } from "@/lib/data/dashboard";

export default async function HockeyPage() {
  const payload = await getDashboardData();
  return (
    <div className="space-y-6">
      <HockeySectionNav pathname="/member/hockey" />
      <HockeyWorkspace payload={payload} />
    </div>
  );
}

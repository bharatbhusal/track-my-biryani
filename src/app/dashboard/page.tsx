import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";

export const metadata = {
	title: "Dashboard",
};

export default function DashboardPage() {
	return (
		<section className="space-y-4 py-4">
			<DashboardOverview />
		</section>
	);
}

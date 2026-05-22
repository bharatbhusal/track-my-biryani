import { LogsTable } from "@/features/logs/components/logs-table";

export const metadata = {
	title: "Logs",
};

export default function LogsPage() {
	return (
		<section className="space-y-4 py-4">
			<LogsTable />
		</section>
	);
}

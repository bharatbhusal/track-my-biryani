"use client";

import { Button } from "@/components/ui/button";
import { Link } from "lucide-react";

export default function Error({
	error,
	reset,
}: {
	error: Error;
	reset: () => void;
}) {
	return (
		<div className="mx-4 mt-[50%] max-w-xl rounded-xl border border-red-300 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/20">
			<h2 className="text-lg font-semibold">
				Something went wrong
			</h2>
			<p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
				{error.message}
			</p>
			<div className="flex gap-4 items-center">
				<Button className="mt-4" onClick={reset}>
					Try again
				</Button>
				<Link href="/dashboard" className="mt-4 inline-block">
					<Button>Go to Dashboard</Button>
				</Link>
			</div>
		</div>
	);
}

"use client";

import { useState } from "react";
import { FiDatabase } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { bucketsApi } from "@/lib/api/buckets";
import { bucketErrorMessage } from "./bucket-settings";

export function MigrationCard() {
	const [migrating, setMigrating] = useState(false);

	const handleMigrate = async () => {
		setMigrating(true);
		try {
			const result = await bucketsApi.runMigration();
			toast.success(
				`Migrated ${result.migratedCategories} categories and ${result.migratedExpenses} expenses to your Personal bucket`,
			);
		} catch (err) {
			toast.error(bucketErrorMessage(err, "Migration failed"));
		} finally {
			setMigrating(false);
		}
	};

	return (
		<Card>
			<div className="flex items-center justify-between gap-3">
				<div className="min-w-0">
					<p className="text-sm font-medium">
						Migrate to Personal bucket
					</p>
					<p className="truncate text-xs text-[var(--color-muted)]">
						Index existing data under the Personal bucket.
						Safe to run again.
					</p>
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={handleMigrate}
					disabled={migrating}
				>
					{migrating ? (
						<Spinner className="mr-1.5" />
					) : (
						<FiDatabase className="mr-1.5" />
					)}
					Migrate
				</Button>
			</div>
		</Card>
	);
}

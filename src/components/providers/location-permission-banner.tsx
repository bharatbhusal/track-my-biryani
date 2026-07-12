"use client";

import { useState } from "react";
import { MapPin, Loader2 } from "lucide-react";
import { useAppDispatch } from "@/store/hooks";
import { setLocationPermission } from "@/store/slices/uiSlice";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function LocationPermissionBanner() {
	const dispatch = useAppDispatch();
	const [isRequesting, setIsRequesting] = useState(false);

	const handleAllow = async () => {
		setIsRequesting(true);
		try {
			await new Promise<GeolocationPosition>((resolve, reject) => {
				navigator.geolocation.getCurrentPosition(resolve, reject, {
					enableHighAccuracy: true,
					timeout: 10000,
				});
			});
			dispatch(setLocationPermission("granted"));
		} catch {
			dispatch(setLocationPermission("denied"));
		} finally {
			setIsRequesting(false);
		}
	};

	const handleDeny = () => {
		dispatch(setLocationPermission("denied"));
	};

	return (
		<div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 md:pb-6 safe-area-pb">
			<Card className="mx-auto max-w-2xl">
				<div className="p-4">
					<div className="flex items-start gap-3">
						<div className="flex-shrink-0 mt-0.5">
							<MapPin className="h-5 w-5 text-[var(--color-primary)]" />
						</div>
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-[var(--color-text)]">
								Allow location access?
							</p>
							<p className="mt-1 text-sm text-[var(--color-muted)]">
								Track My Biryani uses your location to attach coordinates to expenses.
							</p>
						</div>
					</div>
					<div className="mt-4 flex gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={handleDeny}
							disabled={isRequesting}
						>
							Don&apos;t allow
						</Button>
						<Button
							className="flex-1"
							onClick={handleAllow}
							disabled={isRequesting}
						>
							{isRequesting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Requesting...
								</>
							) : (
								"Allow"
							)}
						</Button>
					</div>
				</div>
			</Card>
		</div>
	);
}
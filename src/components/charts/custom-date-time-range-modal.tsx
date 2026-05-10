"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CustomDateTimeRangeModalProps = {
	open: boolean;
	initialFrom: string;
	initialTo: string;
	hasLocalOverride: boolean;
	onClose: () => void;
	onApplyGlobal: (from: string, to: string) => void;
	onApplyLocal: (from: string, to: string) => void;
	onClearLocal: () => void;
};

export function CustomDateTimeRangeModal({
	open,
	initialFrom,
	initialTo,
	hasLocalOverride,
	onClose,
	onApplyGlobal,
	onApplyLocal,
	onClearLocal,
}: CustomDateTimeRangeModalProps) {
	const [from, setFrom] = useState(initialFrom);
	const [to, setTo] = useState(initialTo);

	return (
		<Modal
			open={open}
			title="Choose Custom Date-Time Range"
			onClose={onClose}
		>
			<div className="space-y-3">
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2">
					<label className="text-sm">
						From
						<Input
							type="datetime-local"
							value={from}
							onChange={(event) => setFrom(event.target.value)}
						/>
					</label>
					<label className="text-sm">
						To
						<Input
							type="datetime-local"
							value={to}
							onChange={(event) => setTo(event.target.value)}
						/>
					</label>
				</div>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-3">
					<Button
						disabled={!from || !to}
						onClick={() => onApplyGlobal(from, to)}
					>
						Apply Globally
					</Button>
					<Button
						variant="outline"
						disabled={!from || !to}
						onClick={() => onApplyLocal(from, to)}
					>
						Apply to Dashboard Only
					</Button>
					<Button
						variant="ghost"
						disabled={!hasLocalOverride}
						onClick={onClearLocal}
					>
						Clear Local Range
					</Button>
				</div>
			</div>
		</Modal>
	);
}

"use client";

import { toPng } from "html-to-image";
import { ReactNode, useRef } from "react";
import { FiDownload } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { buildTimestampedFilename } from "@/lib/naming";

type ExportableChartProps = {
	title: string;
	children: ReactNode;
};

export function ExportableChart({
	title,
	children,
}: ExportableChartProps) {
	const ref = useRef<HTMLDivElement | null>(null);

	const exportPng = async () => {
		if (!ref.current) {
			return;
		}

		const dataUrl = await toPng(ref.current);
		const link = document.createElement("a");
		link.download = buildTimestampedFilename({
			baseName: title,
			extension: "png",
		});
		link.href = dataUrl;
		link.click();
	};

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-end">
				<Button
					variant="outline"
					onClick={exportPng}
					aria-label={`Export ${title} as PNG`}
					title="Export chart as PNG"
					className="h-9 w-9 p-0"
				>
					<FiDownload aria-hidden="true" />
				</Button>
			</div>
			<div
				ref={ref}
				className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
			>
				<h3 className="mb-2 text-sm font-semibold">{title}</h3>
				{children}
			</div>
		</div>
	);
}

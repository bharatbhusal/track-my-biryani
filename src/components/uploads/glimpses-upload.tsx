"use client";

import { useState } from "react";
import {
	FiCamera,
	FiRefreshCw,
	FiUploadCloud,
	FiX,
} from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "@/components/ui/button";
import { uploadsApi } from "@/lib/api/uploads";
import { buildUploadPublicId } from "@/lib/naming";
import {
	compressImageIfNeeded,
	uploadImageToCloudinary,
	validateUploadFile,
} from "@/lib/uploads/client";

type UploadingItem = {
	id: string;
	file: File;
	progress: number;
	status: "uploading" | "failed";
};

type GlimpsesUploadProps = {
	value: string[];
	onChange: (value: string[]) => void;
	expenseTitle?: string;
};

function isMobileDevice(): boolean {
	if (typeof navigator === "undefined") {
		return false;
	}

	// Prefer UA check but also allow devices with touch/MediaDevices support
	return (
		/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
		!!(
			navigator.maxTouchPoints && navigator.maxTouchPoints > 0
		) ||
		!!(
			navigator.mediaDevices &&
			typeof navigator.mediaDevices.getUserMedia === "function"
		)
	);
}

export function GlimpsesUpload({
	value,
	onChange,
	expenseTitle = "expense",
}: GlimpsesUploadProps) {
	const [isDragging, setIsDragging] = useState(false);
	const [uploading, setUploading] = useState<
		UploadingItem[]
	>([]);
	const [cloudName, setCloudName] = useState("");

	const hasPending = uploading.some(
		(item) => item.status === "uploading",
	);

	const handleUpload = async (files: FileList | File[]) => {
		const fileList = Array.from(files);
		if (fileList.length === 0) {
			return;
		}

		if (value.length + fileList.length > 5) {
			toast.error(
				"You can upload up to 5 glimpses per expense.",
			);
			return;
		}

		const validationError = fileList
			.map(validateUploadFile)
			.find(Boolean);
		if (validationError) {
			toast.error(validationError);
			return;
		}

		for (const file of fileList) {
			const id = crypto.randomUUID();
			setUploading((current) => [
				...current,
				{ id, file, progress: 0, status: "uploading" },
			]);

			try {
				const preparedFile = await compressImageIfNeeded(file);
				const publicId = buildUploadPublicId(
					expenseTitle || "expense",
				);
				const signature =
					await uploadsApi.getSignature(publicId);

				const uploaded = await uploadImageToCloudinary(
					preparedFile,
					signature,
					(progress) => {
						setUploading((current) =>
							current.map((item) =>
								item.id === id ? { ...item, progress } : item,
							),
						);
					},
				);

				onChange([...value, uploaded.secureUrl]);
				setUploading((current) =>
					current.filter((item) => item.id !== id),
				);
			} catch (error) {
				toast.error(
					error instanceof Error
						? error.message
						: "Upload failed",
				);
				setUploading((current) =>
					current.map((item) =>
						item.id === id ? { ...item, status: "failed" } : item,
					),
				);
			}
		}
	};

	const retryUpload = async (id: string) => {
		const failed = uploading.find((item) => item.id === id);
		if (!failed) return;

		setUploading((current) =>
			current.map((item) =>
				item.id === id
					? { ...item, status: "uploading", progress: 0 }
					: item,
			),
		);
		await handleUpload([failed.file]);
		setUploading((current) =>
			current.filter((item) => item.id !== id),
		);
	};

	return (
		<div className="space-y-3">
			<div
				className={`rounded-lg border border-dashed p-4 text-center transition ${isDragging ? "border-emerald-500 bg-emerald-500/10" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}
				onDragOver={(event) => {
					event.preventDefault();
					setIsDragging(true);
				}}
				onDragLeave={() => setIsDragging(false)}
				onDrop={(event) => {
					event.preventDefault();
					setIsDragging(false);
					void handleUpload(event.dataTransfer.files);
				}}
			>
				<FiUploadCloud className="mx-auto mb-2 text-xl text-emerald-500" />
				<p className="text-sm text-[var(--color-muted)]">
					Drag & drop glimpses here, or choose files
				</p>
				<div className="mt-3 flex flex-wrap items-center justify-center gap-2">
					<label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500">
						<FiUploadCloud />
						Browse
						<input
							type="file"
							className="hidden"
							accept="image/jpeg,image/png,image/webp,image/heic"
							multiple
							onChange={(event) => {
								if (!event.target.files) return;
								void handleUpload(event.target.files);
							}}
						/>
					</label>
					<label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] px-3 py-2 text-sm">
						<FiCamera />
						Camera
						<input
							type="file"
							className="hidden"
							accept="image/*"
							{...(isMobileDevice()
								? { capture: "environment" as const }
								: {})}
							multiple
							onChange={(event) => {
								if (!event.target.files) return;
								void handleUpload(event.target.files);
							}}
						/>
					</label>
				</div>
			</div>

			{uploading.length > 0 && (
				<ul className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
					{uploading.map((item) => (
						<li key={item.id} className="space-y-1 text-sm">
							<div className="flex items-center justify-between">
								<span className="max-w-[80%] truncate">
									{item.file.name}
								</span>
								{item.status === "failed" ? (
									<Button
										type="button"
										variant="ghost"
										className="h-auto p-1 text-amber-600"
										onClick={() => void retryUpload(item.id)}
									>
										<FiRefreshCw /> Retry
									</Button>
								) : (
									<span>{item.progress}%</span>
								)}
							</div>
							<div className="h-1.5 rounded bg-black/10">
								<div
									className={`h-1.5 rounded ${item.status === "failed" ? "bg-amber-500" : "bg-emerald-500"}`}
									style={{ width: `${item.progress}%` }}
								/>
							</div>
						</li>
					))}
				</ul>
			)}

			{value.length > 0 && (
				<ul className="grid grid-cols-2 gap-2 md:grid-cols-3">
					{value.map((item) => (
						<li
							key={item}
							className="relative overflow-hidden rounded-lg border border-[var(--color-border)]"
						>
							{/* eslint-disable-next-line @next/next/no-img-element */}
							<img
								src={item}
								alt="Glimpse preview"
								className="h-28 w-full object-cover"
								loading="lazy"
							/>
							<button
								type="button"
								className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white"
								onClick={() =>
									onChange(value.filter((each) => each !== item))
								}
							>
								<FiX />
							</button>
						</li>
					))}
				</ul>
			)}

			{hasPending && (
				<p className="text-xs text-[var(--color-muted)]">
					Uploads in progress...
				</p>
			)}
		</div>
	);
}

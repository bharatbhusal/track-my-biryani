"use client";

import { useEffect, useState } from "react";
import {
	FiEdit2,
	FiLogOut,
	FiPlus,
	FiTrash2,
	FiUserPlus,
	FiUsers,
} from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { bucketsApi } from "@/lib/api/buckets";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	createBucket,
	deleteBucket,
	fetchBuckets,
	inviteUser,
	leaveBucket,
	revokeInvite,
	updateBucket,
} from "@/store/slices/bucketSlice";
import { setActiveBucketId } from "@/store/slices/uiSlice";
import type {
	BucketMemberWithName,
	BucketSummary,
} from "@/types/bucket.types";

const BUCKET_ICONS = ["📁", "🏠", "✈️", "🍜", "🎉", "💼", "🏖️", "⚽"];

export function bucketErrorMessage(
	err: unknown,
	fallback: string,
): string {
	if (err instanceof Error) {
		return err.message;
	}
	if (
		err &&
		typeof err === "object" &&
		"message" in err
	) {
		return String(
			(err as { message?: unknown }).message ?? fallback,
		);
	}
	return fallback;
}

export function BucketSettings() {
	const dispatch = useAppDispatch();
	const { buckets, loading } = useAppSelector(
		(s) => s.buckets,
	);
	const activeBucketId = useAppSelector(
		(s) => s.ui.activeBucketId,
	);

	const [createOpen, setCreateOpen] = useState(false);
	const [newName, setNewName] = useState("");
	const [newIcon, setNewIcon] = useState("📁");
	const [renaming, setRenaming] = useState<BucketSummary | null>(
		null,
	);
	const [renameName, setRenameName] = useState("");
	const [inviting, setInviting] = useState<BucketSummary | null>(
		null,
	);
	const [inviteUsername, setInviteUsername] = useState("");
	const [deleting, setDeleting] = useState<BucketSummary | null>(
		null,
	);
	const [leaving, setLeaving] = useState<BucketSummary | null>(
		null,
	);
	const [managing, setManaging] = useState<BucketSummary | null>(
		null,
	);
	const [members, setMembers] = useState<BucketMemberWithName[]>(
		[],
	);
	const [membersLoading, setMembersLoading] = useState(false);
	const [pending, setPending] = useState(false);

	useEffect(() => {
		dispatch(fetchBuckets());
	}, [dispatch]);

	const resetActiveIfDeleted = (id: string) => {
		if (activeBucketId === id) {
			dispatch(setActiveBucketId(null));
		}
	};

	const handleCreate = async () => {
		const name = newName.trim();
		if (!name) return;
		setPending(true);
		try {
			await dispatch(
				createBucket({ name, icon: newIcon }),
			).unwrap();
			toast.success(`Bucket "${name}" created`);
			setCreateOpen(false);
			setNewName("");
			setNewIcon("📁");
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to create bucket"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleRename = async () => {
		if (!renaming?._id) return;
		const name = renameName.trim();
		if (!name) return;
		setPending(true);
		try {
			await dispatch(
				updateBucket({ id: renaming._id, name }),
			).unwrap();
			toast.success("Bucket renamed");
			setRenaming(null);
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to rename bucket"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleDelete = async () => {
		if (!deleting?._id) return;
		setPending(true);
		try {
			await dispatch(deleteBucket(deleting._id)).unwrap();
			resetActiveIfDeleted(deleting._id);
			toast.success("Bucket deleted");
			setDeleting(null);
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to delete bucket"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleInvite = async () => {
		if (!inviting?._id) return;
		const username = inviteUsername.trim();
		if (!username) return;
		setPending(true);
		try {
			await dispatch(
				inviteUser({ id: inviting._id, username }),
			).unwrap();
			toast.success(`Invited ${username}`);
			setInviting(null);
			setInviteUsername("");
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to invite user"),
			);
		} finally {
			setPending(false);
		}
	};

	const loadMembers = async (bucket: BucketSummary) => {
		if (!bucket._id) return;
		setMembersLoading(true);
		try {
			const detail = await bucketsApi.getBucket(bucket._id);
			setMembers(detail.members);
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to load members"),
			);
		} finally {
			setMembersLoading(false);
		}
	};

	const openManage = (bucket: BucketSummary) => {
		setManaging(bucket);
		loadMembers(bucket);
	};

	const handleRevoke = async (
		member: BucketMemberWithName,
	) => {
		if (!managing?._id) return;
		setPending(true);
		try {
			await dispatch(
				revokeInvite({
					id: managing._id,
					userId: member.userId,
				}),
			).unwrap();
			toast.success(
				`Removed ${member.name || member.username || "member"}`,
			);
			await loadMembers(managing);
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to remove member"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleLeave = async (bucket: BucketSummary) => {
		if (!bucket._id) return;
		setPending(true);
		try {
			await dispatch(leaveBucket(bucket._id)).unwrap();
			resetActiveIfDeleted(bucket._id);
			toast.success(`Left ${bucket.name}`);
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to leave bucket"),
			);
		} finally {
			setPending(false);
		}
	};

	return (
		<section className="space-y-3">
			<div className="flex items-center justify-between gap-3">
				<div>
					<h2 className="text-sm font-semibold tracking-tight">
						Buckets
					</h2>
					<p className="text-xs text-[var(--color-muted)]">
						Shared expense groups. Your own data lives in
						Personal.
					</p>
				</div>
				<Button size="sm" onClick={() => setCreateOpen(true)}>
					<FiPlus className="mr-1.5" />
					Create
				</Button>
			</div>

			{loading && buckets.length === 0 ? (
				<div className="space-y-2">
					<Skeleton className="h-16 w-full" />
					<Skeleton className="h-16 w-full" />
				</div>
			) : (
				buckets.map((bucket) => {
					const isPersonal = bucket._id === null;
					const isOwner = bucket.role === "owner";
					return (
						<Card
							key={bucket._id ?? "personal"}
							className="flex items-center justify-between gap-3 py-3"
						>
							<div className="min-w-0">
								<p className="truncate text-sm font-medium">
									<span className="mr-1.5">
										{bucket.icon ?? "📁"}
									</span>
									{bucket.name}
								</p>
								<p className="truncate text-xs text-[var(--color-muted)]">
									{bucket.memberCount}{" "}
									{bucket.memberCount === 1
										? "member"
										: "members"}{" "}
									· {isOwner ? "Owner" : "Member"}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								{isOwner && !isPersonal ? (
									<>
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Rename ${bucket.name}`}
											onClick={() => {
												setRenaming(bucket);
												setRenameName(bucket.name);
											}}
										>
											<FiEdit2 className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Invite to ${bucket.name}`}
											onClick={() => setInviting(bucket)}
										>
											<FiUserPlus className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Manage members of ${bucket.name}`}
											onClick={() => openManage(bucket)}
										>
											<FiUsers className="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Delete ${bucket.name}`}
											onClick={() => setDeleting(bucket)}
										>
											<FiTrash2 className="h-4 w-4" />
										</Button>
									</>
								) : !isPersonal ? (
									<Button
										variant="ghost"
										size="sm"
										disabled={pending}
										onClick={() => setLeaving(bucket)}
									>
										<FiLogOut className="mr-1.5" />
										Leave
									</Button>
								) : null}
							</div>
						</Card>
					);
				})
			)}

			<Drawer
				open={createOpen}
				onClose={() => setCreateOpen(false)}
				title="Create bucket"
				description="A shared space to track expenses with others."
			>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						handleCreate();
					}}
				>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-[var(--color-foreground)]">
							Name
						</label>
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="Weekend trip"
							autoFocus
						/>
					</div>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-[var(--color-foreground)]">
							Icon
						</label>
						<div className="flex flex-wrap gap-1.5">
							{BUCKET_ICONS.map((icon) => (
								<button
									key={icon}
									type="button"
									aria-label={`Icon ${icon}`}
									aria-pressed={newIcon === icon}
									onClick={() => setNewIcon(icon)}
									className={cn(
										"flex h-9 w-9 items-center justify-center rounded-xl border text-lg transition-colors",
										newIcon === icon
											? "border-[var(--color-primary)] bg-[var(--color-primary-muted)] ring-1 ring-[var(--color-primary)]"
											: "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)]",
									)}
								>
									{icon}
								</button>
							))}
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setCreateOpen(false)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={pending || !newName.trim()}
						>
							{pending ? <Spinner className="mr-2" /> : null}
							Create
						</Button>
					</div>
				</form>
			</Drawer>

			<Drawer
				open={renaming !== null}
				onClose={() => setRenaming(null)}
				title={`Rename ${renaming?.name ?? ""}`}
				description="Update this bucket's name."
			>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						handleRename();
					}}
				>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-[var(--color-foreground)]">
							Name
						</label>
						<Input
							value={renameName}
							onChange={(e) => setRenameName(e.target.value)}
							placeholder="Bucket name"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setRenaming(null)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={pending || !renameName.trim()}
						>
							{pending ? <Spinner className="mr-2" /> : null}
							Save
						</Button>
					</div>
				</form>
			</Drawer>

			<Drawer
				open={inviting !== null}
				onClose={() => setInviting(null)}
				title={`Invite to ${inviting?.name ?? ""}`}
				description="Invite by exact username."
			>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						handleInvite();
					}}
				>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-[var(--color-foreground)]">
							Username
						</label>
						<Input
							value={inviteUsername}
							onChange={(e) =>
								setInviteUsername(e.target.value)
							}
							placeholder="username"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setInviting(null)}
						>
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={pending || !inviteUsername.trim()}
						>
							{pending ? <Spinner className="mr-2" /> : null}
							Invite
						</Button>
					</div>
				</form>
			</Drawer>

			<Drawer
				open={managing !== null}
				onClose={() => setManaging(null)}
				title={`${managing?.name ?? ""} members`}
				description="Revoke pending invites or remove members."
			>
				{membersLoading ? (
					<div className="space-y-2">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : (
					<ul className="space-y-2">
						{members
							.filter((m) => m.role !== "owner")
							.map((member) => (
								<li
									key={member.userId}
									className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2"
								>
									<div className="min-w-0">
										<p className="truncate text-sm font-medium">
											{member.name}
										</p>
										<p className="truncate text-xs text-[var(--color-muted)]">
											{member.status === "pending"
												? "Pending invitation"
												: "Member"}
										</p>
									</div>
									<Button
										variant="ghost"
										size="sm"
										disabled={pending}
										onClick={() => handleRevoke(member)}
									>
										Remove
									</Button>
								</li>
							))}
						{members.filter((m) => m.role !== "owner")
							.length === 0 && (
							<p className="text-sm text-[var(--color-muted)]">
								No other members yet.
							</p>
						)}
					</ul>
				)}
			</Drawer>

			<ConfirmDialog
				open={deleting !== null}
				title="Delete bucket"
				description={`Delete "${deleting?.name ?? ""}"? All shared data will be lost. This cannot be undone.`}
				onConfirm={handleDelete}
				onCancel={() => setDeleting(null)}
			/>

			<ConfirmDialog
				open={leaving !== null}
				title="Leave bucket"
				description={`Leave "${leaving?.name ?? ""}"? You will lose access to its expenses.`}
				onConfirm={() => {
					if (leaving) handleLeave(leaving);
				}}
				onCancel={() => setLeaving(null)}
			/>
		</section>
	);
}

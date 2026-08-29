"use client";

import { useState } from "react";
import Link from "next/link";
import { FiMoreVertical } from "react-icons/fi";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	ConfirmDialog,
	Modal,
} from "@/components/modals/dialog";
import { DropdownList } from "@/components/ui/dropdown-list";
import { EmojiBadge } from "@/components/ui/emoji-badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/lib/format";
import { shareLink } from "@/lib/share";
import { bucketsApi } from "@/lib/api/buckets";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
	deleteBucket,
	inviteUser,
	leaveBucket,
	revokeInvite,
} from "@/store/slices/bucketSlice";
import { BucketForm, bucketErrorMessage } from "./bucket-form";
import type {
	BucketMemberWithName,
	BucketSummary,
} from "@/types/bucket.types";

type BucketCardProps = {
	bucket: BucketSummary;
	onDelete?: () => void;
	onLeave?: () => void;
};

export function BucketCard({
	bucket,
	onDelete,
	onLeave,
}: BucketCardProps) {
	const dispatch = useAppDispatch();
	const currency = useAppSelector((s) => s.ui.currency);

	const isOwner = bucket.role === "owner";
	const isPersonal = Boolean(bucket.isPersonal);

	const [renaming, setRenaming] = useState(false);
	const [inviting, setInviting] = useState(false);
	const [inviteUsername, setInviteUsername] = useState("");
	const [deleting, setDeleting] = useState(false);
	const [leaving, setLeaving] = useState(false);
	const [managing, setManaging] = useState(false);
	const [revoking, setRevoking] =
		useState<BucketMemberWithName | null>(null);
	const [members, setMembers] = useState<
		BucketMemberWithName[]
	>([]);
	const [membersLoading, setMembersLoading] = useState(false);
	const [pending, setPending] = useState(false);

	const loadMembers = async () => {
		if (!bucket._id) return;
		setMembersLoading(true);
		try {
			const detail = await bucketsApi.getBucketStats(bucket._id);
			setMembers(detail.members);
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to load members"),
			);
		} finally {
			setMembersLoading(false);
		}
	};

	const openManage = () => {
		setManaging(true);
		void loadMembers();
	};

	const handleInvite = async () => {
		if (!bucket._id) return;
		const username = inviteUsername.trim();
		if (!username) return;
		setPending(true);
		try {
			await dispatch(
				inviteUser({ id: bucket._id, username }),
			).unwrap();
			toast.success(`Invited ${username}`);
			setInviting(false);
			setInviteUsername("");
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to invite user"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleDelete = async () => {
		if (!bucket._id) return;
		setPending(true);
		try {
			await dispatch(deleteBucket(bucket._id)).unwrap();
			toast.success("Bucket deleted");
			setDeleting(false);
			onDelete?.();
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to delete bucket"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleRevoke = async (
		member: BucketMemberWithName,
	) => {
		if (!bucket._id) return;
		setPending(true);
		try {
			await dispatch(
				revokeInvite({ id: bucket._id, userId: member.userId }),
			).unwrap();
			toast.success(
				`Removed ${member.name || member.username || "member"}`,
			);
			setRevoking(null);
			await loadMembers();
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to remove member"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleLeave = async () => {
		if (!bucket._id) return;
		setPending(true);
		try {
			await dispatch(leaveBucket(bucket._id)).unwrap();
			toast.success(`Left ${bucket.name}`);
			setLeaving(false);
			onLeave?.();
		} catch (err) {
			toast.error(
				bucketErrorMessage(err, "Failed to leave bucket"),
			);
		} finally {
			setPending(false);
		}
	};

	const handleShare = () => {
		const url = `${window.location.origin}/buckets/${bucket._id}`;
		return shareLink({
			url,
			title: bucket.name,
		});
	};

	const handleMenu = (value: string) => {
		if (value === "share") void handleShare();
		else if (value === "members") openManage();
		else if (value === "invite") setInviting(true);
		else if (value === "edit") setRenaming(true);
		else if (value === "leave") setLeaving(true);
		else if (value === "delete") setDeleting(true);
	};

	const menuOptions = [
		{ value: "share", label: "Share" },
		{ value: "members", label: "View Members" },
		...(isOwner && !isPersonal
			? [
					{ value: "invite", label: "Invite" },
					{ value: "edit", label: "Edit" },
					{ value: "delete", label: "Delete" },
				]
			: []),
		...(!isOwner && !isPersonal
			? [{ value: "leave", label: "Leave" }]
			: []),
	];

	return (
		<>
			<Card>
				<Link href={`/buckets/${bucket._id}`}>
					<div className="flex gap-2 items-center">
						<EmojiBadge
							emoji={bucket.icon ?? "📁"}
							color="var(--color-surface-muted)"
						/>
						<div className="flex-1 min-w-0">
							<p className="font-medium truncate">
								{bucket.name}
							</p>
							<p className="text-xs text-[var(--color-muted)] truncate">
								{bucket.memberCount}{" "}
								{bucket.memberCount === 1 ? "member" : "members"}
								{bucket.ownerName
									? ` · ${isOwner ? "You" : bucket.ownerName}`
									: ` · ${isOwner ? "Owner" : "Member"}`}
							</p>
						</div>
						<div className="text-right shrink-0">
							<p className="font-semibold tabular-nums">
								{formatCurrency(bucket.totalAmount ?? 0, currency)}
							</p>
							<p className="text-xs text-[var(--color-muted)] tabular-nums">
								{bucket.expenseCount ?? 0}{" "}
								{(bucket.expenseCount ?? 0) === 1 ? "expense" : "expenses"}
							</p>
						</div>
						<DropdownList
							value=""
							placeholder="Actions"
							trigger={
								<FiMoreVertical className="h-4 w-4" />
							}
							options={menuOptions}
							onValueChange={handleMenu}
							aria-label="Bucket actions"
							className="h-8 w-8 cursor-pointer"
							onClick={(e) => {
								e.preventDefault();
								e.stopPropagation();
							}}
						/>
					</div>
				</Link>
			</Card>

			<Modal
				open={renaming}
				onClose={() => setRenaming(false)}
				title="Rename Bucket"
				subtitle="Update details"
				description="Update this bucket's name and icon."
			>
				<BucketForm
					bucket={bucket}
					onSuccess={() => setRenaming(false)}
					onCancel={() => setRenaming(false)}
				/>
			</Modal>

			<Modal
				open={inviting}
				onClose={() => setInviting(false)}
				title={`Invite to ${bucket.name}`}
				subtitle="Add a collaborator"
				description="Invite by exact username."
			>
				<form
					className="space-y-4"
					onSubmit={(e) => {
						e.preventDefault();
						void handleInvite();
					}}
				>
					<div className="space-y-1.5">
						<label className="text-sm font-medium text-[var(--color-foreground)]">
							Username
						</label>
						<Input
							value={inviteUsername}
							onChange={(e) => setInviteUsername(e.target.value)}
							placeholder="username"
							autoFocus
						/>
					</div>
					<div className="flex justify-end gap-2">
						<Button
							type="button"
							variant="ghost"
							onClick={() => setInviting(false)}
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
			</Modal>

			<Modal
				open={managing}
				onClose={() => setManaging(false)}
				title={`${bucket.name} members`}
				subtitle="Manage access"
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
										onClick={() => setRevoking(member)}
									>
										Remove
									</Button>
								</li>
							))}
						{members.filter((m) => m.role !== "owner").length ===
							0 && (
							<p className="text-sm text-[var(--color-muted)]">
								No other members yet.
							</p>
						)}
					</ul>
				)}
			</Modal>

			<ConfirmDialog
				open={deleting}
				title="Delete bucket"
				subtitle="Permanent action"
				description={`Delete "${bucket.name}"? All shared data will be lost. This cannot be undone.`}
				onConfirm={() => void handleDelete()}
				onCancel={() => setDeleting(false)}
			/>

			<ConfirmDialog
				open={revoking !== null}
				title="Remove member"
				subtitle="Revoke access"
				description={`Remove ${revoking?.name || revoking?.username || "this member"}? They will lose access to "${bucket.name}".`}
				onConfirm={() => {
					if (revoking) void handleRevoke(revoking);
				}}
				onCancel={() => setRevoking(null)}
			/>

			<ConfirmDialog
				open={leaving}
				title="Leave bucket"
				subtitle="Revoke access"
				description={`Leave "${bucket.name}"? You will lose access to its expenses.`}
				onConfirm={() => void handleLeave()}
				onCancel={() => setLeaving(false)}
			/>
		</>
	);
}

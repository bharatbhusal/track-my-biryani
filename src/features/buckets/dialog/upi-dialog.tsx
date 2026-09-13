"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog, Modal } from "@/components/modals/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { bucketsApi } from "@/lib/api/buckets";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchBucketBalances, fetchBucketDetail } from "@/store/slices/bucketSlice";
import { bucketErrorMessage } from "../bucket-form";
import type { BucketDetail } from "@/constants/types/bucket.types";

export function UpiDialog({
  bucket,
  open,
  onClose,
}: {
  bucket: BucketDetail;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Your UPI id"
      subtitle="How members pay you"
      description={`Members who owe you in "${bucket.name}" can pay this UPI id directly.`}
    >
      {/* ponytail: Modal children remount on every open, so the form state (and
          prefill from the member's saved upiId) starts fresh each time */}
      <UpiForm key={bucket._id} bucket={bucket} onSaved={onClose} />
    </Modal>
  );
}

function UpiForm({ bucket, onSaved }: { bucket: BucketDetail; onSaved: () => void }) {
  const dispatch = useAppDispatch();
  const myId = useAppSelector((s) => s.auth.user?.id);
  const currentUpiId = bucket.members.find((m) => m.userId === myId)?.upiId ?? "";
  const [upiId, setUpiId] = useState(currentUpiId);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const valid = upiId.trim().length > 0 && upiId.includes("@") && !upiId.includes(" ");

  const handleSave = async () => {
    if (!valid) return;
    setConfirmOpen(false);
    setSaving(true);
    try {
      // ponytail: no updateMemberUpiId thunk in the store yet — hit the API and refresh the store slices directly
      await bucketsApi.updateMemberUpiId(bucket._id, upiId.trim());
      dispatch(fetchBucketBalances(bucket._id));
      dispatch(fetchBucketDetail(bucket._id));
      toast.success("UPI id updated");
      onSaved();
    } catch (err) {
      toast.error(bucketErrorMessage(err, "Failed to update UPI id"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {currentUpiId && (
        <p className="mb-3 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)]">
          Currently set:{" "}
          <span className="font-medium text-[var(--color-text)]">{currentUpiId}</span>
        </p>
      )}
      <label className="space-y-1.5">
        <span className="text-sm font-medium text-[var(--color-text)]">UPI id</span>
        <Input
          type="text"
          inputMode="email"
          placeholder="yourname@upi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          autoFocus
        />
      </label>
      <p className="mt-2 text-xs text-[var(--color-muted)]">
        Must be a valid UPI id — like <span className="tabular-nums">name@bank</span>.
      </p>
      <Button
        className="mt-3 w-full"
        disabled={!valid || saving}
        onClick={() => setConfirmOpen(true)}
      >
        {saving ? (
          <>
            <Spinner className="mr-2" />
            Saving...
          </>
        ) : (
          "Save UPI id"
        )}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Update your UPI id?"
        subtitle="Members will use it to pay you"
        description={`Members who owe you in "${bucket.name}" will see this UPI id when settling up.`}
        onConfirm={() => void handleSave()}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

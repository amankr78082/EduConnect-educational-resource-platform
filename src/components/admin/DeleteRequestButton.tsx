import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Trash2, Loader2 } from "lucide-react";
import { mysqlClient } from "@/integrations/mysql/client";
import { toast } from "sonner";

interface Props {
  tableName: string;
  recordId: string;
  recordLabel?: string;
  size?: "sm" | "default" | "icon";
  variant?: "ghost" | "outline" | "destructive";
}

export const DeleteRequestButton = ({
  tableName, recordId, recordLabel, size = "sm", variant = "ghost",
}: Props) => {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason.trim()) {
      toast.error("Reason zaroori hai");
      return;
    }
    setSubmitting(true);
    const { data: { user } } = await mysqlClient.auth.getUser();
    if (!user) {
      toast.error("Login required");
      setSubmitting(false);
      return;
    }
    const { error } = await mysqlClient.from("delete_requests").insert({
      table_name: tableName,
      record_id: recordId,
      record_label: recordLabel || null,
      reason: reason.trim(),
      requested_by: user.id,
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Delete request bhej diya — admin review karega");
      setOpen(false);
      setReason("");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size} variant={variant} className="text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Deletion</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <p className="text-sm text-muted-foreground">
            Item: <span className="font-medium text-foreground">{recordLabel || recordId}</span>
          </p>
          <div className="space-y-2">
            <Label>Reason *</Label>
            <Textarea
              placeholder="Kyu delete karna hai?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Admin ko request bheji jayegi. Approve hone ke baad hi delete hoga.
          </p>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={submitting} variant="destructive">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};



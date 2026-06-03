import { useState } from "react";
import { Download, Eye, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiClientError } from "@/api/client";

interface ReceiptActionsProps {
  studentId: string;
  receiptId: string;
  receiptNumber?: string;
  compact?: boolean;
  className?: string;
  onActionClick?: (e: React.MouseEvent) => void;
}

type ReceiptAction = "view" | "download" | "pdf";

async function runReceiptAction(
  action: ReceiptAction,
  studentId: string,
  receiptId: string,
  receiptNumber?: string
) {
  const receipt = await import("@/lib/receipt");
  if (action === "view") {
    await receipt.openReceiptInNewTab(studentId, receiptId);
    return;
  }
  if (action === "download") {
    await receipt.downloadReceiptHtml(studentId, receiptId, receiptNumber);
    return;
  }
  await receipt.printReceiptAsPdf(studentId, receiptId);
}

export function ReceiptActions({
  studentId,
  receiptId,
  receiptNumber,
  compact = false,
  className,
  onActionClick,
}: ReceiptActionsProps) {
  const [busy, setBusy] = useState<ReceiptAction | null>(null);

  const run = async (e: React.MouseEvent, action: ReceiptAction) => {
    onActionClick?.(e);
    e.stopPropagation();
    setBusy(action);
    try {
      await runReceiptAction(action, studentId, receiptId, receiptNumber);
      if (action === "download") {
        toast.success("Receipt downloaded");
      }
    } catch (err) {
      toast.error(err instanceof ApiClientError ? err.message : "Receipt action failed");
    } finally {
      setBusy(null);
    }
  };

  if (compact) {
    return (
      <div className={`flex flex-wrap gap-1 ${className ?? ""}`}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          disabled={busy !== null}
          onClick={(e) => void run(e, "view")}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          disabled={busy !== null}
          onClick={(e) => void run(e, "download")}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={(e) => void run(e, "view")}
      >
        <Eye className="h-3.5 w-3.5 mr-1" />
        {busy === "view" ? "Opening…" : "View"}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy !== null}
        onClick={(e) => void run(e, "download")}
      >
        <Download className="h-3.5 w-3.5 mr-1" />
        {busy === "download" ? "Downloading…" : "Download"}
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={busy !== null}
        onClick={(e) => void run(e, "pdf")}
      >
        <FileText className="h-3.5 w-3.5 mr-1" />
        {busy === "pdf" ? "Preparing…" : "Save as PDF"}
      </Button>
    </div>
  );
}

/** @deprecated Use ReceiptActions */
export function ViewReceiptButton(props: Omit<ReceiptActionsProps, "compact">) {
  return <ReceiptActions {...props} />;
}

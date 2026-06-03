import { endpoints } from "@/api/endpoints";
import { useAuthStore } from "@/stores/authStore";
import { ApiClientError } from "@/api/client";

function receiptFilename(receiptNumber?: string, receiptId?: string) {
  const base = (receiptNumber || receiptId || "receipt").replace(/[^\w-]+/g, "_");
  return `receipt-${base}`;
}

export async function fetchReceiptHtml(studentId: string, receiptId: string): Promise<string> {
  const token = useAuthStore.getState().accessToken;
  const url = endpoints.studentReceiptRender(studentId, receiptId);

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    let message = "Could not load receipt";
    try {
      const body = await response.json();
      message = body?.message ?? message;
    } catch {
      /* ignore */
    }
    throw new ApiClientError(message, response.status);
  }

  return response.text();
}

/** Opens printable receipt HTML in a new browser tab (requires auth). */
export async function openReceiptInNewTab(studentId: string, receiptId: string) {
  const html = await fetchReceiptHtml(studentId, receiptId);
  const tab = window.open("", "_blank");
  if (!tab) {
    throw new ApiClientError("Pop-up blocked. Allow pop-ups to view the receipt.", 400);
  }
  tab.document.open();
  tab.document.write(html);
  tab.document.close();
}

/** Downloads receipt as an HTML file (open in browser or print to PDF). */
export async function downloadReceiptHtml(
  studentId: string,
  receiptId: string,
  receiptNumber?: string
) {
  const html = await fetchReceiptHtml(studentId, receiptId);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = `${receiptFilename(receiptNumber, receiptId)}.html`;
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

/** Opens receipt and triggers the browser print dialog (Save as PDF). */
export async function printReceiptAsPdf(studentId: string, receiptId: string) {
  const html = await fetchReceiptHtml(studentId, receiptId);
  const tab = window.open("", "_blank");
  if (!tab) {
    throw new ApiClientError("Pop-up blocked. Allow pop-ups to print the receipt.", 400);
  }
  tab.document.open();
  tab.document.write(html);
  tab.document.close();
  tab.focus();
  window.setTimeout(() => {
    tab.print();
  }, 400);
}

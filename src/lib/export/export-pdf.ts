/** Lazy-loaded PDF export via html2canvas + jsPDF — only loads when invoked. */
export async function exportElementToPdf(element: HTMLElement, filename = "export.pdf") {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height],
  });

  pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}

/** Render HTML string to PDF using an off-screen iframe. */
export async function exportHtmlToPdf(html: string, filename = "export.pdf") {
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.left = "-10000px";
  iframe.style.top = "0";
  iframe.style.width = "794px";
  iframe.style.height = "1123px";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  if (!doc) {
    document.body.removeChild(iframe);
    throw new Error("Could not create print frame");
  }

  doc.open();
  doc.write(html);
  doc.close();

  await new Promise<void>((resolve) => {
    iframe.onload = () => resolve();
    window.setTimeout(resolve, 300);
  });

  try {
    if (doc.body) {
      await exportElementToPdf(doc.body, filename);
    }
  } finally {
    document.body.removeChild(iframe);
  }
}

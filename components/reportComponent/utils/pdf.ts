import jsPDF from "jspdf"
import html2canvas from "html2canvas"

function fixOklchColors(clonedDoc: Document) {
  try {
    const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]')
    links.forEach((link) => link.remove())
    const styles = clonedDoc.querySelectorAll("style")
    styles.forEach((style) => {
      if (style.textContent?.includes("oklch")) {
        style.remove()
      }
    })
    const styleEl = clonedDoc.createElement("style")
    styleEl.id = "html2canvas-safe-colors"
    const safeCSS = `
      :root, html, body {
        color: #000000;
        background: #ffffff;
      }
      .a4-page,
      .a4-page * {
        color: #000000 !important;
        background: transparent !important;
        background-color: transparent !important;
        border-color: #000000 !important;
        box-shadow: none !important;
        filter: none !important;
      }
      .a4-page {
        background: #ffffff !important;
      }
      .page-content {
        color: #000000 !important;
        font-family: "Times New Roman", serif !important;
      }
      table {
        border-collapse: collapse !important;
      }
      table, th, td {
        border-color: #000000 !important;
      }
    `
    styleEl.textContent = safeCSS
    if (!clonedDoc.head) {
      const head = clonedDoc.createElement("head")
      clonedDoc.documentElement.insertBefore(head, clonedDoc.body)
    }
    clonedDoc.head.appendChild(styleEl)
  } catch {
    // swallow
  }
}

export async function downloadPagesAsPdf(pagesContainer: HTMLElement, fileName: string) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  const pages = pagesContainer.querySelectorAll(".a4-page")
  for (let i = 0; i < pages.length; i++) {
    if (i > 0) pdf.addPage()
    const page = pages[i] as HTMLElement
    const canvas = await html2canvas(page, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => fixOklchColors(clonedDoc),
    })
    const imgData = canvas.toDataURL("image/png")
    const imgProps = pdf.getImageProperties(imgData)
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth
    const imgHeight = (imgProps.height * imgWidth) / imgProps.width
    const y = imgHeight > pdfHeight ? 0 : (pdfHeight - imgHeight) / 2
    pdf.addImage(imgData, "PNG", 0, y, imgWidth, imgHeight)
  }
  pdf.save(fileName)
}



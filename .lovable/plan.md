# Export System Architecture Diagram to PDF

Render the existing Mermaid diagram at `/mnt/documents/System_Architecture.mmd` into a PDF for submission.

## Steps

1. Use `@mermaid-js/mermaid-cli` (mmdc) via `npx` to render the `.mmd` file to a high-resolution PDF.
2. Save the output as `/mnt/documents/System_Architecture.pdf`.
3. Visually QA the PDF by converting it to an image and inspecting for clipped nodes, overflow, or unreadable text. Re-render with adjusted width/scale if needed.
4. Deliver the PDF as a downloadable artifact.

## Technical details

- Command: `npx -y @mermaid-js/mermaid-cli -i /mnt/documents/System_Architecture.mmd -o /mnt/documents/System_Architecture.pdf -b white --pdfFit`
- If mmdc fails (puppeteer/chromium issues in sandbox), fall back to: render to PNG/SVG first, then convert SVG to PDF with `rsvg-convert` or wrap PNG into a PDF with reportlab.
- QA: `pdftoppm -jpeg -r 150 /mnt/documents/System_Architecture.pdf /tmp/qa` and inspect pages.

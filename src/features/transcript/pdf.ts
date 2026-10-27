import "server-only";
import PDFParser from "pdf2json";
/** Written by Michael's Codex. Parse in memory; no PDF or transcript text is written to disk. */
export function extractTranscriptText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const parser = new PDFParser();
    const timer = setTimeout(() => {
      parser.destroy();
      reject(
        new Error("This PDF took too long to read. Try a smaller transcript."),
      );
    }, 15000);
    parser.on("pdfParser_dataError", () => {
      clearTimeout(timer);
      parser.destroy();
      reject(
        new Error(
          "The PDF could not be read. Upload an unlocked PDF with selectable text.",
        ),
      );
    });
    parser.on("pdfParser_dataReady", (data) => {
      clearTimeout(timer);
      try {
        if (data.Pages.length > 40)
          throw new Error("Use a transcript of 40 pages or fewer.");
        // UMN prints two independent reading columns. Reading by y across the
        // full page interleaves semesters and even drops a continued course at
        // the top right. The repeated Course table labels distinguish this
        // layout from a one-column transcript that happens to have wide rows.
        const twoColumns = data.Pages.some((page) => {
          const labels = page.Texts.filter(
            (item) =>
              item.R.map((run) => decodeURIComponent(run.T))
                .join("")
                .trim() === "Course",
          );
          return (
            labels.some((item) => item.x < page.Width / 4) &&
            labels.some(
              (item) =>
                item.x >= page.Width / 2 && item.x < (page.Width * 3) / 4,
            )
          );
        });
        const text = data.Pages.map((page) =>
          [...page.Texts]
            .sort(
              (a, b) =>
                (twoColumns
                  ? Number(a.x >= page.Width / 2) -
                    Number(b.x >= page.Width / 2)
                  : 0) ||
                Math.round(a.y * 10) - Math.round(b.y * 10) ||
                a.x - b.x,
            )
            .map((item) =>
              item.R.map((run) => decodeURIComponent(run.T)).join(""),
            )
            .join(" "),
        ).join("\n");
        resolve(text);
      } catch {
        reject(
          new Error(
            "The transcript text could not be read. Use an unlocked PDF of 40 pages or fewer.",
          ),
        );
      } finally {
        parser.destroy();
      }
    });
    const input = Buffer.alloc(buffer.length);
    input.set(buffer);
    try {
      parser.parseBuffer(input, 0);
    } catch {
      clearTimeout(timer);
      parser.destroy();
      reject(new Error("The PDF could not be read."));
    }
  });
}

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
        const text = data.Pages.map((page) =>
          [...page.Texts]
            .sort(
              (a, b) =>
                Math.round(a.y * 10) - Math.round(b.y * 10) || a.x - b.x,
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

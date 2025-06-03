import { NextRequest, NextResponse } from "next/server";
import PDFParser from "pdf2json";

export const POST = async (req: NextRequest) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  const text = await new Promise<string>((resolve, reject) => {
    const parser = new PDFParser();
    parser.on("pdfParser_dataError", err => reject(err.parserError));
    parser.on("pdfParser_dataReady", pdfData => {
      const rawText = pdfData?.Pages?.map((page: any) =>
        page.Texts?.map((t: any) =>
          t.R?.map((r: any) => decodeURIComponent(r.T)).join("")
        ).join(" ")
      ).join("\n") ?? "";
      resolve(rawText);
    });
    parser.parseBuffer(buffer);
  });

  return NextResponse.json({ text });
};
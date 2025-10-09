import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";
import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);


export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Load the docx file as a binary
    const templatePath = join(process.cwd(), "public", "templates", "delivery-report.docx");
    const content = readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // Render the document (replace all occurences of placeholders)
    doc.render(data);

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // Set response headers for file download
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    headers.set('Content-Disposition', `attachment; filename="bien-ban-giao-thiet-bi-${dayjs().tz('Asia/Ho_Chi_Minh').toDate().toISOString().split('T')[0]}.docx"`);
    headers.set('Content-Length', buf.length.toString());

    return new NextResponse(buf as any, {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Error generating delivery document:', error);
    return NextResponse.json(
      { error: 'Failed to generate document' },
      { status: 500 }
    );
  }
}

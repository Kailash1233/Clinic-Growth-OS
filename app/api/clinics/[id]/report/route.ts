import { NextRequest, NextResponse } from "next/server";
import { buildGrowthReport } from "@/lib/report";
import { renderGrowthReportPdf } from "@/lib/reportPdf";

export const dynamic = "force-dynamic";

/** Downloadable PDF of a clinic's Growth Report. Public, like the report page itself. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const report = await buildGrowthReport(params.id);
  if (!report) return NextResponse.json({ error: "No report for this clinic yet" }, { status: 404 });

  const pdf = await renderGrowthReportPdf(report);
  const filename = `growth-report-${report.clinic.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`;
  return new NextResponse(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

import { getAuthorizedProof } from "@/services/payment";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const accessToken = new URL(request.url).searchParams.get("access");
  const proof = await getAuthorizedProof(submissionId, accessToken);

  if (!proof) {
    return Response.json({ error: "Bukti tidak ditemukan atau akses ditolak." }, { status: 404 });
  }

  const safeName = proof.originalName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120);
  return new Response(proof.data, {
    status: 200,
    headers: {
      "Content-Type": proof.contentType,
      "Content-Disposition": `inline; filename="${safeName || "bukti-pembayaran"}"`,
      "Cache-Control": "private, no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

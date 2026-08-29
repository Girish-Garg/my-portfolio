export async function GET() {
  return Response.json(
    {
      ok: true,
      status: "healthy",
      service: "my-portfolio",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

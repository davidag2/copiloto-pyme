const voiceResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Hola. Estas llamando a Copiloto Pyme. La linea telefonica esta funcionando correctamente.</Say>
</Response>`;

export async function POST() {
  return new Response(voiceResponse, {
    status: 200,
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return POST();
}

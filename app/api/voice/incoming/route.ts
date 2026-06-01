import { NextResponse } from "next/server";

const voiceIntro =
  "Hola, estas llamando a Copiloto Pyme, el sistema operativo con inteligencia artificial para administrar tu empresa. " +
  "Muy pronto este numero atendera ventas, soporte, quejas y reclamos. " +
  "Por ahora estamos probando la linea telefonica. Gracias por llamar.";

function createVoiceResponse() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="es-CO">${voiceIntro}</Say>
  <Pause length="1"/>
  <Say voice="alice" language="es-CO">Para conocer Copiloto Pyme, visita copilotopyme punto com.</Say>
  <Hangup/>
</Response>`;
}

export async function POST() {
  return new NextResponse(createVoiceResponse(), {
    headers: {
      "Content-Type": "text/xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET() {
  return POST();
}

import { env } from "../env.js";
import { prisma } from "../db/prisma.js";

// Integración con WhatsApp Cloud API (Meta):
// https://developers.facebook.com/docs/whatsapp/cloud-api
//
// Para producción hace falta:
//  1. Un número de WhatsApp Business verificado.
//  2. Plantillas de mensaje (HSM) aprobadas por Meta para recordatorios
//     y avisos de hueco libre en lista de espera (los mensajes fuera de
//     la ventana de 24h de conversación solo se pueden enviar con
//     plantilla).
//  3. WHATSAPP_PHONE_NUMBER_ID y WHATSAPP_ACCESS_TOKEN en el entorno.
//
// Sin esas variables, el cliente entra en "modo demo": no llama a Meta,
// solo registra el mensaje en WhatsappMessageLog para poder probar el
// flujo completo (recordatorios, lista de espera) sin coste ni cuenta.

interface SendTemplateMessageInput {
  toPhone: string;
  templateName: string;
  languageCode?: string;
  // Parámetros posicionales del cuerpo de la plantilla, en orden.
  bodyParams?: string[];
}

export async function sendWhatsappTemplate(input: SendTemplateMessageInput): Promise<void> {
  const payload = {
    messaging_product: "whatsapp",
    to: normalizePhone(input.toPhone),
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode ?? "es" },
      components: input.bodyParams?.length
        ? [
            {
              type: "body",
              parameters: input.bodyParams.map((text) => ({ type: "text", text })),
            },
          ]
        : undefined,
    },
  };

  if (env.whatsappDemoMode) {
    await prisma.whatsappMessageLog.create({
      data: {
        toPhone: input.toPhone,
        templateName: input.templateName,
        payload: JSON.stringify(payload),
        status: "sent",
      },
    });
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/${env.whatsappApiVersion}/${env.whatsappPhoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.whatsappAccessToken}`,
        },
        body: JSON.stringify(payload),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`WhatsApp API ${res.status}: ${body}`);
    }

    await prisma.whatsappMessageLog.create({
      data: {
        toPhone: input.toPhone,
        templateName: input.templateName,
        payload: JSON.stringify(payload),
        status: "sent",
      },
    });
  } catch (err) {
    await prisma.whatsappMessageLog.create({
      data: {
        toPhone: input.toPhone,
        templateName: input.templateName,
        payload: JSON.stringify(payload),
        status: "failed",
        errorMessage: err instanceof Error ? err.message : String(err),
      },
    });
    throw err;
  }
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "");
}

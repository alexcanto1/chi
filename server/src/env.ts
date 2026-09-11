import "dotenv/config";

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

export const env = {
  port: Number(optional("PORT", "4000")),

  // EposNow Open API. Regístrate como desarrollador en
  // https://developer.eposnowhq.com/Docs/SignUp para obtener estas
  // credenciales. Sin ellas, el cliente funciona en modo demo con datos
  // de ejemplo para poder probar la app.
  eposnowApiKey: optional("EPOSNOW_API_KEY"),
  eposnowBaseUrl: optional("EPOSNOW_BASE_URL", "https://api.eposnowhq.com/api/V4"),
  eposnowDemoMode: optional("EPOSNOW_API_KEY") === "",

  // WhatsApp Cloud API (Meta). Necesitas un número de WhatsApp Business
  // verificado y un token de acceso permanente del sistema de negocio.
  whatsappPhoneNumberId: optional("WHATSAPP_PHONE_NUMBER_ID"),
  whatsappAccessToken: optional("WHATSAPP_ACCESS_TOKEN"),
  whatsappApiVersion: optional("WHATSAPP_API_VERSION", "v20.0"),
  whatsappVerifyToken: optional("WHATSAPP_VERIFY_TOKEN", "chicomalo-verify"),
  whatsappDemoMode: optional("WHATSAPP_ACCESS_TOKEN") === "",
};

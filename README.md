# Agenda Chicomalo

App de agenda de citas para Chicomalo, pensada como complemento del
Marketplace de EposNow: usa la API de EposNow como fuente de verdad de
citas, clientes y empleados, y añade encima lo que EposNow no trae de
serie: una agenda visual por barbero, lista de espera con avisos por
WhatsApp y recordatorios automáticos de cita.

## Qué incluye

- **Agenda visual** (`client/`): vista de día con una columna por
  barbero, clic para crear cita, clic sobre una cita para cancelarla.
- **Gestión de empleados**: color por barbero en la agenda y horario de
  trabajo semanal (esto EposNow no lo expone, así que se guarda en una
  base de datos local).
- **Lista de espera + WhatsApp**: si no hay hueco, el cliente se apunta
  con su rango de fechas preferido. Al cancelarse una cita, se avisa
  automáticamente por WhatsApp al primer cliente compatible; si
  responde "SÍ", queda marcado para que el equipo confirme la cita.
- **Recordatorios automáticos**: un job programado envía por WhatsApp un
  recordatorio 24h y 2h antes de cada cita.

## Arquitectura

```
server/   API en Node.js + TypeScript + Express + Prisma (SQLite local)
client/   Frontend en React + Vite + TypeScript
```

El backend nunca duplica los datos de EposNow (citas, clientes,
empleados se leen siempre en vivo de su API). La base de datos local
solo guarda lo que EposNow no gestiona: lista de espera, horarios de
empleados y el registro de mensajes/recordatorios de WhatsApp enviados
(para no duplicarlos).

## Puesta en marcha en local

Requiere Node.js 20+.

```bash
# Backend
cd server
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:migrate   # crea dev.db con las tablas locales
npm run dev               # http://localhost:4000

# Frontend (en otra terminal)
cd client
npm install
npm run dev               # http://localhost:5173
```

Sin configurar nada más, la app arranca en **modo demo**: si no hay
`EPOSNOW_API_KEY` en `server/.env`, el backend sirve barberos, clientes
y citas de ejemplo (ver `server/src/eposnow/fixtures.ts`) para poder
probar toda la agenda, la lista de espera y los recordatorios sin
credenciales reales. Lo mismo pasa con WhatsApp: sin
`WHATSAPP_ACCESS_TOKEN`, los mensajes no se envían de verdad, solo se
registran en la tabla `WhatsappMessageLog` para verificar el flujo.

## Conectar con EposNow de verdad

1. Crea una cuenta de desarrollador en
   [developer.eposnowhq.com](https://developer.eposnowhq.com/Docs/SignUp).
2. Genera tus credenciales de API y ponlas en `server/.env`
   (`EPOSNOW_API_KEY`). La API usa autenticación Basic con esa clave
   (ver `server/src/eposnow/client.ts`).
3. **Importante**: no tuve acceso a la documentación exhaustiva de los
   endpoints `Booking`, `Staff` y `Customer` (el dominio
   `developer.eposnowhq.com` no era accesible desde este entorno de
   desarrollo). Los tipos en `server/src/eposnow/types.ts` son una
   hipótesis razonable basada en el nombrado habitual de la API de
   EposNow, pero **hay que contrastarlos contra la documentación real**
   en cuanto tengas la cuenta activa, y ajustar los nombres de campo si
   no coinciden exactamente. La API tiene versión V2 (algunos endpoints
   ya deprecados) y V4 (recomendada); el cliente apunta a V4 por
   defecto vía `EPOSNOW_BASE_URL`.

## Conectar con WhatsApp de verdad

Se usa la [API en la nube de WhatsApp (Meta)](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started):

1. Crea una app de Meta for Developers y activa el producto WhatsApp.
2. Verifica un número de WhatsApp Business.
3. Crea y da de alta (para aprobación de Meta) las plantillas de
   mensaje que usa el código:
   - `recordatorio_cita_24h` (parámetros: nombre, servicio, fecha/hora, barbero)
   - `recordatorio_cita_2h` (mismos parámetros)
   - `hueco_libre_lista_espera` (parámetros: nombre, servicio, fecha/hora)
4. Copia `WHATSAPP_PHONE_NUMBER_ID` y `WHATSAPP_ACCESS_TOKEN` (token
   permanente del sistema, no el temporal de pruebas) a `server/.env`.
5. Configura el webhook en el panel de Meta apuntando a
   `https://tu-dominio/webhooks/whatsapp`, con el mismo
   `WHATSAPP_VERIFY_TOKEN` que pongas en `.env`.

Fuera de la ventana de 24h de conversación, WhatsApp **solo** permite
enviar mensajes con plantillas aprobadas — por eso los recordatorios y
avisos de hueco libre están modelados como plantillas desde el
principio, no como texto libre.

## Publicarla en el Marketplace de EposNow

Según la documentación pública de EposNow:

1. Regístrate como desarrollador en
   [developer.eposnowhq.com](https://developer.eposnowhq.com/Home/DeveloperSignUp).
2. Hay dos caminos para construir: una **app independiente** (dashboard,
   widget, integración externa como esta) usando solo la API pública —
   que es el camino que sigue este proyecto — o hacerte **partner de
   EposNow** si quieres una integración más profunda incrustada en su
   propio backoffice.
3. Cuando la app esté lista, se envía desde el propio portal de
   desarrollador ("Submit") para que la revisen y la publiquen en su
   AppStore.

Como esos pasos de alta/envío requieren una cuenta real de EposNow y
decisiones de negocio (nombre de la app, descripción, capturas,
precio si lo vas a cobrar a otras barberías), no forman parte de este
repositorio — son el siguiente paso una vez lo pruebes en Chicomalo.

## Siguientes pasos sugeridos

- Sustituir los tipos "hipótesis" de `eposnow/types.ts` por los reales
  en cuanto tengas acceso de desarrollador, y probar `listBookings`,
  `createBooking` y `cancelBooking` contra la cuenta real de Chicomalo.
- Añadir autenticación a la propia app (hoy la API no tiene login;
  vale para un único local pero hay que protegerla antes de exponerla
  a internet).
- Si quieres vender la app a otras barberías en el Marketplace, cada
  instalación necesitará sus propias credenciales de EposNow y de
  WhatsApp — el modelo actual asume un solo local.

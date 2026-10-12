# Puente local ATCASH EVO

Programa pequeño que resuelve el bloqueo de CORS entre la app web
**Chico Malo Teams** (alojada en Lovable) y el cajón **AT·CASH EVO**:
el cajón no sabe responder correctamente a la comprobación de
seguridad que exige cualquier navegador antes de mandarle una orden
de cobro, así que el navegador bloquea la petición. Este programa no
es un navegador, así que no tiene esa restricción: hace de intermediario
entre la app y el cajón.

Corre **en la misma tablet** que usas para cobrar, dentro de una app
llamada Termux. No hace falta ningún ordenador aparte.

## 1. Instalar Termux

Instálalo desde **F-Droid**, no desde Google Play (la versión de Play
está anticuada y no funciona bien):

1. Abre este enlace en la tablet: https://f-droid.org/es/packages/com.termux/
2. Pulsa "Descargar APK" e instálalo (puede que tengas que permitir
   "instalar apps de fuentes desconocidas" la primera vez).

## 2. Preparar Termux

Abre la app Termux y escribe estos comandos uno a uno (pulsa Enter
después de cada uno):

```
pkg update -y
pkg install nodejs -y
```

Descarga este programa directamente desde tu repositorio:

```
curl -o server.js https://raw.githubusercontent.com/alexcanto1/chi/claude/eposnow-software-development-ia8gzh/atcash-bridge/server.js
```

Genera un certificado propio para el puente (hace falta: la app es
HTTPS, y el navegador bloquea como "contenido mixto" cualquier cosa
que no sea HTTPS, aunque sea `127.0.0.1`). Solo hay que hacer esto
una vez:

```
pkg install openssl-tool -y
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes -subj "/CN=127.0.0.1"
```

## 3. Arrancar el puente

Cada día, antes de abrir la barbería, abre Termux y escribe:

```
CAJON_HOST=192.168.1.10 CAJON_PORT=44333 node server.js
```

(Cambia la IP/puerto si en algún momento cambian los del cajón — son
los mismos que pusiste en Ajustes de la app).

Deberías ver:

```
Puente ATCASH escuchando en https://0.0.0.0:8787
Reenviando peticiones a https://192.168.1.10:44333
```

Si en vez de `https://` ves `http://` en esa primera línea, es que no
encontró `key.pem`/`cert.pem` en la carpeta — revisa el paso del
certificado más arriba antes de seguir.

**Deja Termux abierto** (puedes minimizarlo, no lo cierres ni lo
"deslices para cerrar") mientras uses la caja. Si Android lo mata en
segundo plano, basta con volver a abrir Termux: como usa un historial
(`history` o flecha arriba) puedes recuperar el mismo comando sin
escribirlo de nuevo.

**Recomendado:** en Ajustes del sistema Android → Batería → Termux,
desactiva la "optimización de batería" para esa app, así Android la
mata con menos frecuencia.

## 4. Configurar la app para usar el puente

En **Chico Malo Teams → Caja → Ajustes**:

- **IP**: `127.0.0.1`
- **Puerto**: `8787`
- **Usar HTTPS**: **marcado** (el puente ahora también usa su propio
  certificado, igual que el cajón)
- **Usuario** / **Contraseña**: los mismos del cajón que ya tenías
  (`dependiente` / `1234`, o los que te dieron)
- Desmarca "Modo simulación" si no lo estaba ya

**Antes de "Probar conexión"**, acepta el certificado del puente igual
que hiciste con el del cajón: pulsa el botón "Comprobar el cajón en
una pestaña nueva" (ahora apunta al puente), sal del aviso de
seguridad con "Avanzado → Acceder a 127.0.0.1 (no seguro)", y confirma
que aparece `{"status":"ok"}`. Solo hace falta la primera vez en cada
tablet.

Vuelve a la app, pulsa **Guardar** y luego **Probar conexión**. Si
todo va bien, verás "Conexión correcta. Efectivo total: X €" — y esta
vez sí estará hablando con el cajón de verdad.

## Notas

- El puente no guarda ni modifica nada: solo reenvía las peticiones
  tal cual, de la app al cajón y de vuelta.
- Si cambias la IP o el puerto del cajón, solo tienes que cambiar la
  línea del paso 3 (`CAJON_HOST=... CAJON_PORT=...`).
- Esta solución depende de que la tablet esté encendida y con Termux
  abierto. Si en el futuro consigues un ordenador o mini PC siempre
  encendido en la tienda, es mejor correr el puente ahí en vez de en
  la tablet — más fiable, sin depender de que Android no lo mate.

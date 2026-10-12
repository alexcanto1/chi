#!/usr/bin/env node
// Puente local para el cajón AT·CASH EVO.
//
// Problema que resuelve: la app web (Chico Malo Teams) no puede llamar
// directamente al cajón desde el navegador porque el cajón no responde
// correctamente al preflight CORS que exige cualquier navegador antes
// de una petición autenticada (cabecera Authorization). Ese bloqueo es
// del navegador, no se puede evitar con más código en la app web.
//
// Solución: este programa NO es un navegador, así que no tiene esa
// restricción. Corre en la misma tablet (vía Termux) y reenvía cada
// petición tal cual al cajón real por HTTPS, añadiendo las cabeceras
// CORS que el cajón no pone.
//
// Tiene que servir HTTPS (no HTTP normal): la app corre en HTTPS, y el
// navegador bloquea como "contenido mixto" cualquier llamada en texto
// plano desde una página HTTPS, aunque sea a 127.0.0.1. Por eso hace
// falta un certificado propio — igual que el del cajón, ver README.
// Si no encuentra key.pem/cert.pem en esta misma carpeta, arranca en
// HTTP solo para pruebas locales (curl), pero avisa de que así la app
// no podrá usarlo.
//
// Uso:
//   CAJON_HOST=192.168.1.10 CAJON_PORT=44333 node server.js

const fs = require("fs");
const path = require("path");
const http = require("http");
const https = require("https");

const BRIDGE_PORT = Number(process.env.BRIDGE_PORT || 8787);
const CAJON_HOST = process.env.CAJON_HOST || "192.168.1.10";
const CAJON_PORT = Number(process.env.CAJON_PORT || 44333);

const KEY_PATH = path.join(__dirname, "key.pem");
const CERT_PATH = path.join(__dirname, "cert.pem");
const hasCert = fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH);

function setCors(res, origin) {
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  res.setHeader("Access-Control-Max-Age", "86400");
}

function handler(req, res) {
  const origin = req.headers.origin;
  console.log(`${new Date().toLocaleTimeString("es-ES")}  ${req.method} ${req.url}`);

  if (req.method === "OPTIONS") {
    setCors(res, origin);
    res.writeHead(204);
    res.end();
    return;
  }

  const chunks = [];
  req.on("data", (c) => chunks.push(c));
  req.on("end", () => {
    const body = Buffer.concat(chunks);
    const { host: _ignoredHost, ...forwardHeaders } = req.headers;

    const upstreamReq = https.request(
      {
        host: CAJON_HOST,
        port: CAJON_PORT,
        path: req.url,
        method: req.method,
        headers: { ...forwardHeaders, host: `${CAJON_HOST}:${CAJON_PORT}` },
        rejectUnauthorized: false, // el cajón usa un certificado propio, no público
      },
      (upstreamRes) => {
        setCors(res, origin);
        res.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
        upstreamRes.pipe(res);
      },
    );

    upstreamReq.on("error", (err) => {
      setCors(res, origin);
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          error: `No se pudo conectar con el cajón (${CAJON_HOST}:${CAJON_PORT}): ${err.message}`,
        }),
      );
    });

    if (body.length) upstreamReq.write(body);
    upstreamReq.end();
  });
}

const server = hasCert
  ? https.createServer({ key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) }, handler)
  : http.createServer(handler);

server.listen(BRIDGE_PORT, "0.0.0.0", () => {
  const scheme = hasCert ? "https" : "http";
  console.log(`Puente ATCASH escuchando en ${scheme}://0.0.0.0:${BRIDGE_PORT}`);
  console.log(`Reenviando peticiones a https://${CAJON_HOST}:${CAJON_PORT}`);
  if (!hasCert) {
    console.log("");
    console.log("AVISO: no hay key.pem/cert.pem en esta carpeta, así que este puente");
    console.log("está en HTTP normal. La app Chico Malo Teams (que es HTTPS) NO podrá");
    console.log("usarlo así — el navegador lo bloqueará como 'contenido mixto'. Genera");
    console.log("el certificado como se explica en el README antes de usarlo con la app.");
  }
  console.log("");
  console.log("Deja esta ventana de Termux abierta mientras uses la caja.");
});

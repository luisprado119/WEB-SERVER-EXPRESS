// ================================================================================================
// GUÍA PRÁCTICA: CORS (Cross-Origin Resource Sharing)
// ================================================================================================
// CORS es el mecanismo de seguridad que controla qué orígenes (dominios) pueden hacer
// peticiones HTTP a tu servidor desde un navegador.
//
// PROBLEMA:
//   Un navegador bloquea por defecto cualquier petición fetch/XHR que vaya a un
//   origen distinto al de la página actual. Esto se llama "Same-Origin Policy".
//
//   Origen = protocolo + dominio + puerto
//     http://localhost:3333  ≠  http://localhost:3345   (distinto puerto → origen diferente)
//     http://misitio.com     ≠  https://misitio.com     (distinto protocolo)
//     http://api.misitio.com ≠  http://misitio.com      (distinto subdominio)
//
// SOLUCIÓN:
//   El servidor puede incluir cabeceras HTTP especiales que le dicen al navegador
//   "este origen tiene permiso para leer mi respuesta":
//     Access-Control-Allow-Origin:  http://localhost:3333
//     Access-Control-Allow-Methods: GET, POST, PUT, DELETE
//     Access-Control-Allow-Headers: Content-Type, Authorization
//
// El middleware 'cors' de Express añade estas cabeceras automáticamente.
//
// IMPORTANTE: CORS solo lo aplica el NAVEGADOR. Herramientas como curl, Postman
// o el REST Client NO están sujetas a CORS (no son navegadores).
//
// ESTE SERVIDOR corre en el puerto 3345.
// La página cors.html se sirve desde el puerto 3333 y hace fetch a este servidor.
// → Son orígenes diferentes → entra en juego CORS.
//
// PARA EJECUTAR:
//   npx nodemon .\app-core.js
//   Accede a la demo en: http://localhost:3333/cors.html
// ================================================================================================

const express = require('express')
const cors    = require('cors')
const app     = express()
const PORT    = 3345

app.use(express.json())


// ────────────────────────────────────────────────────────────────────────────────────────────────
// CASO 1: SIN CORS – el navegador bloqueará esta ruta
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Esta ruta NO tiene ninguna cabecera CORS.
// Cuando cors.html (puerto 3333) intente hacer fetch a esta URL, el navegador
// recibirá la respuesta del servidor PERO la bloqueará antes de dársela al JavaScript.
//
// Error en consola del navegador:
//   Access to fetch at 'http://localhost:3345/sin-cors' from origin 'http://localhost:3333'
//   has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present.
//
// NOTA: el servidor SÍ responde (código 200), pero el navegador descarta la respuesta.
// Esto lo puedes verificar en la pestaña Network de DevTools: verás el código 200
// pero en la consola aparece el error CORS.

app.get('/sin-cors', (req, res) => {
  res.json({
    mensaje:  'Respuesta SIN cabeceras CORS',
    origen:   req.headers.origin || 'desconocido',
    resultado: 'El navegador bloqueará esta respuesta'
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// CASO 2: CORS ABIERTO – permite CUALQUIER origen
// ────────────────────────────────────────────────────────────────────────────────────────────────
// app.use(cors()) o cors() como middleware de ruta añade:
//   Access-Control-Allow-Origin: *
//
// El asterisco (*) significa que CUALQUIER origen puede leer la respuesta.
// Útil para APIs públicas (datos abiertos, documentación, etc.)
// NO recomendado cuando la API maneja datos privados o requiere autenticación,
// porque cualquier web del mundo podría hacer peticiones en nombre del usuario.

app.get('/cors-abierto', cors(), (req, res) => {
  res.json({
    mensaje:   'Respuesta con CORS abierto (*)',
    cabecera:  'Access-Control-Allow-Origin: *',
    resultado: '✅ Cualquier origen puede leer esta respuesta'
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// CASO 3: CORS RESTRINGIDO – solo permite un origen concreto
// ────────────────────────────────────────────────────────────────────────────────────────────────
// origin: 'http://localhost:3333' → solo ese origen puede acceder.
// Cualquier otro origen (p.ej. http://localhost:4000) recibirá un error CORS.
//
// La cabecera que envía el servidor:
//   Access-Control-Allow-Origin: http://localhost:3333
//
// Uso típico en producción:
//   origin: 'https://mi-frontend.com'
//   Así el backend solo acepta peticiones del frontend oficial.

const corsRestringido = cors({ origin: 'http://localhost:3333' })

app.get('/cors-restringido', corsRestringido, (req, res) => {
  res.json({
    mensaje:   'Respuesta con CORS restringido',
    cabecera:  'Access-Control-Allow-Origin: http://localhost:3333',
    resultado: '✅ Solo http://localhost:3333 puede leer esta respuesta'
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// CASO 4: CORS CON LISTA BLANCA (whitelist)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Permite varios orígenes específicos usando una función de validación.
// Si el origen de la petición está en la lista → se permite.
// Si no está → se rechaza con error CORS.
//
// Cabecera enviada si el origen está permitido:
//   Access-Control-Allow-Origin: <origen-de-la-petición>   (no asterisco, sino el origen exacto)
//
// Uso típico: app web en producción + app móvil + entorno de desarrollo local.

const whitelist = ['http://localhost:3333', 'http://localhost:3334', 'https://mi-app.com']

const corsWhitelist = cors({
  origin: (origin, callback) => {
    // origin puede ser undefined si la petición viene de curl, Postman, etc.
    if (!origin || whitelist.includes(origin)) {
      callback(null, true)   // permitido
    } else {
      callback(new Error(`CORS bloqueado: el origen ${origin} no está en la lista blanca`))
    }
  }
})

app.get('/cors-whitelist', corsWhitelist, (req, res) => {
  res.json({
    mensaje:   'Respuesta con whitelist de orígenes',
    whitelist: whitelist,
    resultado: '✅ Solo los orígenes de la lista tienen acceso'
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// CASO 5: CORS CON MÉTODOS Y CABECERAS PERSONALIZADAS
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Además de controlar el origen, CORS permite especificar:
//   methods: qué métodos HTTP están permitidos
//   allowedHeaders: qué cabeceras puede enviar el cliente
//   exposedHeaders: qué cabeceras de la respuesta puede leer el JavaScript del cliente
//   credentials: si se permiten cookies y cabeceras de autenticación (Authorization)
//
// Cuando credentials: true, NO se puede usar Access-Control-Allow-Origin: *
// Hay que especificar el origen exacto.

const corsCompleto = cors({
  origin:         'http://localhost:3333',
  methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Custom-Header'],
  exposedHeaders: ['X-Total-Count', 'X-Page'],
  credentials:    true,
  maxAge:         86400   // tiempo en segundos que el navegador cachea el preflight (24h)
})

app.get('/cors-completo', corsCompleto, (req, res) => {
  // Cabeceras personalizadas en la respuesta (expuestas para que JS las pueda leer)
  res.setHeader('X-Total-Count', '42')
  res.setHeader('X-Page', '1')
  res.json({
    mensaje:   'Respuesta con CORS completo y configuración avanzada',
    resultado: '✅ Métodos, cabeceras, credenciales y caché configurados'
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// CASO 6: PREFLIGHT REQUEST (petición OPTIONS)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Para peticiones "complejas" (POST con JSON, peticiones con cabeceras personalizadas,
// DELETE, PUT…), el navegador envía PRIMERO una petición OPTIONS automática llamada
// "preflight" para preguntar al servidor: "¿me dejas hacer esta petición?"
//
// Si el servidor responde correctamente al preflight (con las cabeceras CORS adecuadas),
// el navegador procede con la petición real.
//
// app.options('*', cors()) → responde correctamente a TODOS los preflights.
// Si usas cors() como middleware global (app.use), ya incluye esto automáticamente.
//
// La cabecera Access-Control-Max-Age indica cuánto tiempo puede el navegador
// cachear la respuesta del preflight (evita repetir OPTIONS en cada petición).

app.options('/cors-post', corsCompleto)   // preflight manual para esta ruta

app.post('/cors-post', corsCompleto, (req, res) => {
  res.json({
    mensaje:   'POST recibido correctamente tras preflight',
    body:       req.body,
    resultado: '✅ El preflight OPTIONS fue respondido antes de este POST'
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// INICIO DEL SERVIDOR
// ────────────────────────────────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`Servidor CORS escuchando en http://localhost:${PORT}`)
  console.log(`Demo visual en       http://localhost:3333/cors.html`)
})

// ================================================================================================
// GUÍA PRÁCTICA: Servidor Web con Express.js y Node.js
// ================================================================================================
// Este archivo es una práctica completa y progresiva de los conceptos clave de Express.js.
//
// ÍNDICE DE CONTENIDOS:
//   1.  IMPORTACIONES Y CONFIGURACIÓN INICIAL
//   2.  CONEXIÓN A BASE DE DATOS (PostgreSQL con pg)
//   3.  CONEXIÓN A OBJECT STORAGE (MinIO)
//   4.  CONEXIÓN A BLOCKCHAIN (Ethereum con Web3.js v4)
//   5.  MIDDLEWARES (funciones que procesan cada petición antes de llegar a la ruta)
//       5.a express-fileupload  -> subida de ficheros
//       5.b morgan              -> logging de peticiones HTTP en consola y ficheros
//       5.c express.json/urlencoded -> parseo del body
//       5.d middleware personalizado -> log de debug en consola
//   6.  ARCHIVOS ESTÁTICOS (servir HTML, CSS, imágenes desde disco)
//   7.  RUTAS GET BÁSICAS
//   8.  SIMULACIÓN DE CÓDIGOS DE ERROR HTTP
//   9.  RUTAS POST – RECIBIR DATOS DEL CLIENTE
//       9.a Body JSON básico
//       9.b Echo del body
//       9.c Echo body + query string
//       9.d Combinación COMPLETA: params de ruta + query + body
//  10.  SUBIDA DE FICHEROS (multipart/form-data)
//       10.a Genérica (cualquier campo, múltiples ficheros)
//       10.b Un único fichero en campo 'fichero1'
//       10.c Múltiples ficheros en campo 'ficheros'
//  11.  BASE DE DATOS – Consultas a PostgreSQL
//       11.a Test de conexión (SELECT now())
//       11.b Listar todos los customers
//       11.c Pedidos de un cliente (/bdd/orders/:cliente)
//       11.d Pedido concreto     (/bdd/orders/:cliente/:id)
//  12.  BLOCKCHAIN – Consultas a Ethereum con Web3.js
//       12.a Balance de un wallet (/web3/balance/:address)
//       12.b Info completa de un wallet (/web3/wallet/:address)
//       12.c Datos de un bloque (/web3/eth/getblock/:numero)
//  13.  OBJECT STORAGE – MinIO (compatible con AWS S3)
//       13.a Listar todos los buckets (/minio/buckets)
//       13.b Crear un bucket         (/minio/buckets/:bucket)
//       13.c Listar ficheros de un bucket (/minio/buckets/:bucket/files)
//       13.d Subir un fichero a MinIO (/minio/buckets/:bucket/upload)
//       13.e URL de descarga firmada  (/minio/buckets/:bucket/files/:filename/url)
//       13.f Recuperar/descargar un fichero (/minio/buckets/:bucket/files/:filename)
//       13.g Eliminar un fichero – patrón Promise .then()/.catch()
//            (/minio/buckets/:bucket/files/:filename/v1)
//       13.h Eliminar un fichero – patrón async/await
//            (/minio/buckets/:bucket/files/:filename)
//  14.  SERVER SIDE PAGES – Motor de plantillas Pug
//       14.a Renderizar plantilla con variables dinámicas (/t1)
//       14.b Plantilla con datos de usuario (/usuario/:nombre)
//  15.  ORGANIZACIÓN CON EXPRESS ROUTER
//       15.a Router de clientes  (/api/clientes)
//       15.b Router de productos (/api/productos)
//       15.c Router de facturas  (/api/facturas)
//  16.  MANEJADORES GLOBALES DE ERROR
//       16.a 404 Not Found   -> redirige a /error_404.html
//       16.b 500 Error       -> middleware de error de Express (4 parámetros)
//  17.  INICIO DEL SERVIDOR
//
// PARA EJECUTAR:
//   npm install       -> instala dependencias (solo la primera vez)
//   npm start         -> arranca el servidor  (node app.js)
//   npm run dev       -> arranca con nodemon  (reinicio automático al guardar)
//
// PUERTO POR DEFECTO: http://localhost:3333
// ================================================================================================


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 1. IMPORTACIONES Y CONFIGURACIÓN INICIAL
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Cada dependencia cumple una función específica:
//   dotenv             -> Carga variables de entorno desde el fichero .env
//                         BUENA PRÁCTICA: las credenciales nunca deben estar en el código fuente.
//                         Se guardan en .env (ignorado por git) y se leen con process.env.NOMBRE
//   express            -> Framework web: rutas, middlewares y servidor HTTP
//   path               -> Utilidades para trabajar con rutas del sistema de archivos
//   express-fileupload -> Middleware para recibir ficheros subidos (multipart/form-data)
//   morgan             -> Middleware de logging HTTP (registra cada petición)
//   fs                 -> Módulo nativo de Node.js para leer/escribir archivos del disco
//   pg { Pool }        -> Cliente PostgreSQL para Node.js. Pool = grupo de conexiones reutilizables
//   web3 { Web3 }      -> Librería oficial para interactuar con la blockchain de Ethereum
//                         NOTA: En Web3 v4 se usa desestructuración { Web3 }, no el módulo completo
//   minio              -> Cliente oficial de MinIO para Node.js (compatible con AWS S3)

require('dotenv').config()   // Lee el fichero .env y carga las variables en process.env

const express    = require('express')
const path       = require('path')
const fileUpload = require('express-fileupload')
const morgan     = require('morgan')
const fs         = require('fs')
const { Pool }   = require('pg')
const { Web3 }   = require('web3')
const Minio      = require('minio')

// Routers – módulos que agrupan rutas relacionadas (sección 15)
const clientesRouter   = require('./routes/clientes')
const productosRouter  = require('./routes/productos')
const facturasRouter   = require('./routes/facturas')


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 2. CONEXIÓN A BASE DE DATOS (PostgreSQL con pg)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Pool = grupo de conexiones reutilizables a la base de datos.
// Ventaja frente a una sola conexión: soporta múltiples peticiones simultáneas
// sin abrir y cerrar una conexión por cada consulta.
//
// Opciones de configuración:
//   host:     dirección del servidor PostgreSQL (localhost en desarrollo)
//   port:     puerto de PostgreSQL (por defecto es 5432; aquí usamos 5499)
//   user:     nombre del usuario de la base de datos
//   password: contraseña del usuario
//   database: nombre de la base de datos (si no se especifica, usa el del usuario)
//
// BUENA PRÁCTICA: en producción las credenciales deben ir en variables de entorno (.env)
//   Ejemplo: host: process.env.DB_HOST, user: process.env.DB_USER, etc.

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     process.env.DB_PORT     || 5499,
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || ''
})

// ────────────────────────────────────────────────────────────────────────────────────────────────
// 3. CONEXIÓN A OBJECT STORAGE (MinIO)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// MinIO es un servidor de almacenamiento de objetos (Object Storage) compatible con la API de AWS S3.
// Permite guardar y servir ficheros (imágenes, PDFs, backups, logs, etc.) de forma escalable.
//
// CONCEPTOS CLAVE:
//   Bucket  -> carpeta de nivel superior (similar a un directorio raíz)
//              Los nombres deben ser únicos, en minúsculas y sin espacios.
//   Object  -> cualquier fichero guardado dentro de un bucket (con su nombre/clave)
//   Key     -> nombre del objeto dentro del bucket (puede incluir "/" para simular carpetas)
//
// DIFERENCIAS CON el sistema de ficheros tradicional (fs):
//   fs (local)    -> guarda ficheros en el disco del servidor
//   MinIO (S3)    -> guarda ficheros en un servicio de objetos, accesible por HTTP/HTTPS
//                    Escala mejor, tiene URLs firmadas, políticas de acceso, replicación, etc.
//
// OPCIONES DE CONFIGURACIÓN del cliente:
//   endPoint   -> dirección del servidor MinIO
//   port       -> puerto de la API S3 (9000 por defecto)
//   useSSL     -> false en desarrollo, true en producción
//   accessKey  -> usuario (equivalente a MINIO_ROOT_USER)
//   secretKey  -> contraseña (equivalente a MINIO_ROOT_PASSWORD)
//
// INICIAR EL SERVIDOR MINIO (en una terminal aparte):
//   $env:MINIO_ROOT_USER="minioadmin"
//   $env:MINIO_ROOT_PASSWORD="minioadmin"
//   .\minio.exe server C:\minio-data --console-address :9001
//
//   API S3:    http://localhost:9000
//   Consola:   http://localhost:9001  (interfaz web para gestionar buckets visualmente)

const minioClient = new Minio.Client({
  endPoint:  process.env.MINIO_ENDPOINT   || 'localhost',
  port:      parseInt(process.env.MINIO_PORT) || 9000,
  useSSL:    process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || '',
  secretKey: process.env.MINIO_SECRET_KEY || ''
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 4. CONEXIÓN A BLOCKCHAIN (Ethereum con Web3.js v4)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Web3.js es la librería estándar para conectar Node.js con la blockchain de Ethereum.
// Permite leer datos de la cadena (balances, transacciones, bloques) y enviar transacciones.
//
// PROVEEDOR (Provider):
//   El provider es el "puente" entre tu código y la blockchain.
//   Opciones comunes:
//     - Infura (https://infura.io)   -> nodo remoto en la nube, ideal para desarrollo
//     - Alchemy (https://alchemy.com) -> similar a Infura, con más herramientas
//     - Nodo local (Ganache, Hardhat) -> blockchain local para testing
//     - MetaMask                      -> cuando el usuario tiene wallet en el navegador
//
// REDES disponibles en Infura (cambia la URL según la red):
//   Mainnet  -> https://mainnet.infura.io/v3/TU_API_KEY    (red principal, ETH real)
//   Sepolia  -> https://sepolia.infura.io/v3/TU_API_KEY    (testnet, ETH de prueba)
//   Polygon  -> https://polygon-mainnet.infura.io/v3/...   (L2 de Ethereum)
//
// CAMBIO EN Web3 v4:
//   v1-v3:  const Web3 = require('web3')  ->  new Web3(url)
//   v4:     const { Web3 } = require('web3')  ->  new Web3(url)   ← usamos esta

const WEB3_PROVIDER_URL = process.env.WEB3_PROVIDER_URL || ''

const web3Provider = new Web3(WEB3_PROVIDER_URL)


// ────────────────────────────────────────────────────────────────────────────────────────────────
// Inicialización de la app y directorio de uploads
// ────────────────────────────────────────────────────────────────────────────────────────────────

const app        = express()
const UPLOAD_DIR = path.join(__dirname, 'uploads')

// Asegura que exista la carpeta uploads antes de crear los streams de log
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 5. MIDDLEWARES
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Un MIDDLEWARE es una función que se ejecuta ANTES de que la petición llegue a la ruta.
// Tiene acceso a (req, res, next) y puede:
//   - Modificar req o res
//   - Terminar la respuesta directamente
//   - Llamar a next() para pasar al siguiente middleware o ruta
//
// FLUJO: Petición → Middleware 1 → Middleware 2 → ... → Ruta → Respuesta
// ORDEN IMPORTA: se ejecutan en el orden en que se registran con app.use()


// 3.a express-fileupload
// Permite recibir ficheros enviados desde formularios HTML (multipart/form-data).
// Coloca los ficheros en req.files con la estructura: req.files.nombreCampo
//   createParentPath: crea directorios automáticamente si no existen
//   limits.fileSize:  rechaza ficheros mayores a 50MB (50 * 1024 * 1024 bytes)
//   abortOnLimit:     corta la conexión inmediatamente si se supera el límite

app.use(fileUpload({
  createParentPath: true,
  limits:           { fileSize: 50 * 1024 * 1024 },
  abortOnLimit:     true
}))


// 3.b Morgan (logging de peticiones HTTP)
// Registra información de cada petición: método, URL, status, tiempo de respuesta.
//
// Formatos de morgan:
//   'tiny'     -> Log corto:    "GET /ping 200 3ms"
//   'combined' -> Log completo: IP, fecha, método, URL, status, tamaño, referrer, user-agent
//
// Los WriteStreams con flags 'a' (append) escriben sin borrar el contenido previo.
// La opción 'skip' filtra qué peticiones se registran en cada fichero:
//   access.log      -> TODAS las peticiones (sin filtro)
//   logsErrores.txt -> Solo errores (status >= 400)
//   logsBuenos.txt  -> Solo éxitos  (status <  400)

app.use(morgan('tiny'))

const logsErroresPath = path.join(UPLOAD_DIR, 'logsErrores.txt')
const logsBuenosPath  = path.join(UPLOAD_DIR, 'logsBuenos.txt')
const accessLogPath   = path.join(UPLOAD_DIR, 'access.log')

const logOutputErrores = fs.createWriteStream(logsErroresPath, { flags: 'a' })
const logOutputBuenos  = fs.createWriteStream(logsBuenosPath,  { flags: 'a' })
const accessLogStream  = fs.createWriteStream(accessLogPath,   { flags: 'a' })

app.use(morgan('combined', { stream: accessLogStream }))
app.use(morgan('combined', { stream: logOutputErrores, skip: (req, res) => res.statusCode <  400 }))
app.use(morgan('combined', { stream: logOutputBuenos,  skip: (req, res) => res.statusCode >= 400 }))


// 3.c Parseo del body
// Habilita Express para leer y parsear el cuerpo (body) de las peticiones.
// Sin estos middlewares, req.body sería undefined.
//
//   express.json()                     -> parsea Content-Type: application/json
//   express.urlencoded({ extended })   -> parsea Content-Type: application/x-www-form-urlencoded
//     extended: true  -> usa la librería 'qs' (soporta objetos y arrays anidados)
//     extended: false -> usa 'querystring' (solo pares clave=valor simples)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


// 3.d Middleware personalizado de debug
// Este middleware propio se ejecuta en CADA petición y muestra método + URL en consola.
// next() es OBLIGATORIO al final para pasar la petición al siguiente paso.
// Sin next(), la petición quedaría "colgada" y el cliente no recibiría respuesta.

app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url}`)
  next()
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 6. ARCHIVOS ESTÁTICOS
// ────────────────────────────────────────────────────────────────────────────────────────────────
// express.static() sirve automáticamente HTML, CSS, JS e imágenes desde una carpeta del disco.
// No se necesita escribir rutas manuales: si el fichero existe, Express lo sirve directamente.
//
// Ejemplos de acceso:
//   /public/index.html       -> http://localhost:3333/index.html
//   /public/formulario.html  -> http://localhost:3333/formulario.html
//   /docs/index.html         -> http://localhost:3333/docs/index.html  (prefijo '/docs')
//
// El segundo app.use monta la carpeta 'docs' bajo la URL /docs.
// Así se pueden tener varias carpetas estáticas con distintos prefijos.

app.use(express.static(path.join(__dirname, 'public')))
app.use('/docs', express.static(path.join(__dirname, 'docs')))

// ────────────────────────────────────────────────────────────────────────────────────────────────
// 7. RUTAS GET BÁSICAS
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Las rutas GET se usan para LECTURA. No llevan cuerpo (body).
// Son SEGURAS e IDEMPOTENTES: llamarlas varias veces produce el mismo resultado.
//
// Métodos de respuesta más comunes:
//   res.send('texto')       -> envía texto plano o HTML
//   res.json({ key: val })  -> envía un objeto JavaScript serializado como JSON
//   res.sendFile(ruta)      -> envía un archivo del disco al cliente
//   res.status(N).send(...) -> establece el código HTTP y envía la respuesta

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

app.get('/docs', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs', 'index.html'))
})

// Health check: ruta estándar para verificar que el servidor está activo.
// Devuelve status 200 con un JSON que incluye el timestamp actual.
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', message: 'pong', timestamp: new Date().toISOString() })
})

app.get('/welcome', (req, res) => {
  res.send('hola')
})

app.get('/hola', (req, res) => {
  res.send('Hola a Todos')
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 8. SIMULACIÓN DE CÓDIGOS DE ERROR HTTP
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Rutas creadas para practicar y entender los códigos de estado HTTP.
// En una aplicación real, estos errores ocurren automáticamente según la lógica del negocio.
//
// Grupos de códigos de estado:
//   2xx -> ÉXITO        (200 OK, 201 Created, 204 No Content)
//   3xx -> REDIRECCIÓN  (301 Moved Permanently, 302 Found)
//   4xx -> ERROR CLIENTE (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found)
//   5xx -> ERROR SERVIDOR (500 Internal Server Error, 503 Service Unavailable)

app.get('/error400', (req, res) => {
  res.status(400).send('Error 400: Solicitud incorrecta (Bad Request)')
})

app.get('/error404', (req, res) => {
  res.status(404).send('Error 404: Recurso no encontrado (Not Found)')
})

app.get('/error500', (req, res) => {
  res.status(500).send('Error 500: Error interno del servidor (Internal Server Error)')
})

// Ruta que lanza una excepción real → activa el middleware de error 500 (sección 16.b)
// Esta es la diferencia entre res.status(500) y throw new Error():
//   res.status(500) → responde manualmente con 500 desde la ruta
//   throw new Error() → Express captura la excepción y pasa al middleware de error (4 params)
app.get('/error', (req, res) => {
  throw new Error('esto falla — prueba del middleware de error 500')
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 9. RUTAS POST – RECIBIR DATOS DEL CLIENTE
// ────────────────────────────────────────────────────────────────────────────────────────────────
// POST se usa para ENVIAR datos al servidor: crear recursos, autenticar, procesar info.
// Los datos llegan en req.body, parseados por los middlewares del punto 3.c.
//
// Las TRES fuentes de datos que puede tener una petición Express:
//   req.params -> variables dinámicas en la URL      /usuarios/:id  → { id: "123" }
//   req.query  -> parámetros de consulta en la URL   ?pagina=2&orden=asc
//   req.body   -> datos en el cuerpo de la petición  JSON, formularios, multipart


// 7.a POST básico: recibe datos JSON y responde con status 201 (Created)
app.post('/data', (req, res) => {
  const payload = req.body
  res.status(201).json({ message: 'Datos recibidos', data: payload })
})

// 7.b Echo del body: devuelve exactamente lo que recibe (útil para debugging)
app.post('/echoPost', (req, res) => {
  const payload = req.body
  res.json({ message: 'Petición recibida', data: payload })
})

// 7.c Echo con body + query string: combina req.body y req.query en la respuesta.
//     Prueba enviando: POST /echoPostJson?foo=bar con un body JSON
app.post('/echoPostJson', (req, res) => {
  const payload = req.body
  const qs      = req.query
  res.json({ message: 'Petición recibida', data: payload, query: qs })
})

// 7.d Combinación COMPLETA: parámetros de ruta + query string + body
//
//     Ruta dinámica: :cliente y :factura son variables que Express extrae de la URL
//     Ejemplo: POST /echoParamsPost/ACME/facturas/F2024001?formato=json
//       req.params = { cliente: "ACME", factura: "F2024001" }
//       req.query  = { formato: "json" }
//       req.body   = { monto: 1500, estado: "pendiente", ... }
//
//     La respuesta incluye los tres objetos para poder verificar cómo llegan.

app.post('/echoParamsPost/:cliente/facturas/:factura', (req, res) => {
  const params      = req.params
  const queryString = req.query
  const body        = req.body
  res.json({ message: 'Datos completos de la petición', body, query: queryString, params })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 10. SUBIDA DE FICHEROS (multipart/form-data)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// El middleware express-fileupload (configurado en 3.a) intercepta el body multipart
// y coloca los ficheros en req.files.
//
// Estructura de req.files:
//   req.files.nombreCampo          -> UploadedFile   (un solo fichero)
//   req.files.nombreCampo          -> UploadedFile[] (si se envían varios con el mismo campo)
//
// Métodos y propiedades de UploadedFile:
//   file.name     -> nombre original del fichero
//   file.size     -> tamaño en bytes
//   file.mimetype -> tipo MIME (image/png, application/pdf, etc.)
//   file.mv(ruta) -> mueve el fichero al destino indicado (devuelve Promise)
//
// Date.now() en el nombre del fichero guardado evita colisiones entre ficheros homónimos.


// 8.a Genérica: acepta cualquier campo y cualquier número de ficheros
app.post('/uploadFicheros', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ error: 'No se seleccionó ningún fichero' })
    }

    const guardados = []

    for (const fileKey of Object.keys(req.files)) {
      const fileOrArray = req.files[fileKey]
      const files       = Array.isArray(fileOrArray) ? fileOrArray : [fileOrArray]

      for (const file of files) {
        const savePath = path.join(UPLOAD_DIR, `${Date.now()}_${file.name}`)
        await file.mv(savePath)
        guardados.push({ field: fileKey, name: file.name, size: file.size, path: savePath })
      }
    }

    res.json({ message: 'Ficheros subidos correctamente', uploaded: guardados, body: req.body })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error subiendo ficheros', details: err.message })
  }
})

// 8.b Un único fichero en el campo 'fichero1'
app.post('/postMultipart', async (req, res) => {
  try {
    const file = req.files ? req.files.fichero1 : null
    if (!file) {
      return res.status(400).json({ error: 'No se subió ningún fichero en el campo fichero1' })
    }

    const savePath = path.join(UPLOAD_DIR, `${Date.now()}_${file.name}`)
    await file.mv(savePath)

    res.json({ message: 'Fichero subido correctamente', uploaded: { name: file.name, size: file.size, path: savePath } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error subiendo fichero', details: err.message })
  }
})

// 8.c Múltiples ficheros en el campo 'ficheros'
app.post('/postMultipartMultiple', async (req, res) => {
  try {
    const files = req.files ? req.files.ficheros : null
    if (!files) {
      return res.status(400).json({ error: 'No se subió ningún fichero en el campo ficheros' })
    }

    const arr      = Array.isArray(files) ? files : [files]
    const guardados = []

    for (const [index, file] of arr.entries()) {
      const savePath = path.join(UPLOAD_DIR, `${Date.now()}_${index}_${file.name}`)
      await file.mv(savePath)
      guardados.push({ index, name: file.name, size: file.size, path: savePath })
    }

    res.json({ message: 'Ficheros múltiples subidos correctamente', uploaded: guardados })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error subiendo múltiples ficheros', details: err.message })
  }
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 11. BASE DE DATOS – Consultas a PostgreSQL con pg
// ────────────────────────────────────────────────────────────────────────────────────────────────
// El módulo 'pg' (node-postgres) conecta Node.js con PostgreSQL.
// Usamos el Pool creado en el punto 2 del archivo.
//
// pool.query(sql [, params]) devuelve una Promise con un QueryResult:
//   result.rows      -> array de objetos, uno por cada fila devuelta
//   result.rowCount  -> número de filas afectadas (útil en INSERT/UPDATE/DELETE)
//   result.fields    -> metadatos de las columnas (nombre, tipo, etc.)
//
// Consultas con parámetros (evitan SQL Injection):
//   pool.query('SELECT * FROM users WHERE id = $1', [userId])
//   Los valores se pasan como segundo argumento en un array.
//   PostgreSQL reemplaza $1, $2... por los valores del array de forma segura.
//
// Patrón async/await + try/catch:
//   - await pool.query(...) espera el resultado sin bloquear el hilo principal
//   - El bloque catch captura cualquier error (conexión, SQL incorrecto, etc.)
//     y devuelve un status 500 con el mensaje de error para facilitar el debug


// 9.a Test de conexión
// Ejecuta SELECT now() para verificar que la base de datos responde correctamente.
// El alias 'AS fecha' nombra la columna en la respuesta JSON.
// Respuesta esperada: { "fecha": "2026-03-13T12:34:56.789Z" }

app.get('/bdd/test', async (req, res) => {
  try {
    const respuesta = await pool.query('SELECT now() AS fecha')
    res.json(respuesta.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error de conexión a la base de datos', details: error.message })
  }
})

// 9.b Listar todos los registros de la tabla 'customers'
// Devuelve un array JSON con todos los registros de la tabla.
// Respuesta esperada: [ { customer_id, company_name, contact_name, ... }, ... ]
// Si la tabla está vacía devuelve: []

app.get('/bdd/customers', async (req, res) => {
  try {
    const respuesta = await pool.query('SELECT * FROM customers')
    res.json(respuesta.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error consultando customers', details: error.message })
  }
})

// 9.c Pedidos de un cliente concreto (filtro por parámetro de ruta)
// Ruta dinámica: :cliente es el customer_id que llega en la URL.
// Ejemplo: GET /bdd/orders/ALFKI  ->  todos los pedidos del cliente "ALFKI"
//
// USO DE PARÁMETROS EN SQL ($1, $2...):
//   pool.query(sql, [valor1, valor2])
//   PostgreSQL sustituye $1 por valor1, $2 por valor2, etc.
//   Esto es OBLIGATORIO cuando el valor viene del usuario (req.params, req.query, req.body).
//   NUNCA concatenar directamente: `WHERE id = '${req.params.id}'`  <- SQL Injection
//
// Respuesta esperada: [ { order_id, customer_id, order_date, ... }, ... ]

app.get('/bdd/orders/:cliente', async (req, res) => {
  try {
    const respuesta = await pool.query(
      'SELECT * FROM orders WHERE customer_id = $1',
      [req.params.cliente]
    )
    res.json(respuesta.rows)
  } catch (error) {
    res.status(500).json({ error: 'Error consultando orders', details: error.message })
  }
})

// 9.d Pedido específico de un cliente (dos parámetros de ruta)
// Combina :cliente (customer_id) y :id (order_id) para identificar un único registro.
// Ejemplo: GET /bdd/orders/ALFKI/10643  ->  el pedido 10643 del cliente "ALFKI"
//
// Se usan dos parámetros en el SQL: $1 = customer_id, $2 = order_id
// respuesta.rows[0] devuelve solo el primer objeto del array (el pedido concreto)
// Si no existe, rows[0] es undefined -> se devuelve 404
//
// Respuesta esperada: { order_id, customer_id, order_date, shipped_date, ... }

app.get('/bdd/orders/:cliente/:id', async (req, res) => {
  try {
    const respuesta = await pool.query(
      'SELECT * FROM orders WHERE customer_id = $1 AND order_id = $2',
      [req.params.cliente, req.params.id]
    )
    if (!respuesta.rows[0]) {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    res.json(respuesta.rows[0])
  } catch (error) {
    res.status(500).json({ error: 'Error consultando el pedido', details: error.message })
  }
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 12. BLOCKCHAIN – Consultas a Ethereum con Web3.js
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Web3.js permite leer datos de la blockchain sin gastar gas (las lecturas son gratuitas).
// Solo las ESCRITURAS (enviar ETH, llamar funciones de contratos) cuestan gas.
//
// web3Provider.eth  ->  módulo con todas las funciones de Ethereum:
//   .getBalance(address)         -> saldo en Wei (unidad mínima de Ether)
//   .getTransactionCount(address) -> número de transacciones enviadas (nonce)
//   .getBlockNumber()            -> número del último bloque minado
//   .getTransaction(hash)        -> datos de una transacción concreta
//
// UNIDADES DE ETHER:
//   1 Ether = 1,000,000,000,000,000,000 Wei  (10^18)
//   Web3.utils.fromWei(wei, 'ether') convierte Wei a Ether (string legible)
//   Web3.utils.toWei(ether, 'ether') convierte Ether a Wei
//
// CHECKSUMMED ADDRESS:
//   Ethereum usa direcciones con mayúsculas/minúsculas específicas (EIP-55) para evitar errores.
//   Web3.utils.toChecksumAddress(addr) normaliza cualquier dirección al formato correcto.
//   Ejemplo: 0xcab113e... → 0xCaB113E18897a870E8489DA9b8EA37fce653dE2D


// 11.a Balance de un wallet
// Ruta: GET /web3/balance/:address
// Devuelve el saldo de cualquier dirección Ethereum en Wei y en Ether.
// Ejemplo: GET /web3/balance/0xCaB113E18897a870E8489DA9b8EA37fce653dE2D
//
// Respuesta esperada:
//   {
//     "address": "0xCaB113E18897a870E8489DA9b8EA37fce653dE2D",
//     "balanceWei": "0",
//     "balanceEth": "0"
//   }

app.get('/web3/balance/:address', async (req, res) => {
  try {
    const address    = req.params.address
    const balanceWei = await web3Provider.eth.getBalance(address)
    res.json({
      address:    address,
      balanceWei: balanceWei.toString(),
      balanceEth: Web3.utils.fromWei(balanceWei, 'ether')
    })
  } catch (error) {
    res.status(500).json({ error: 'Error consultando balance', details: error.message })
  }
})

// 11.b Info completa de un wallet
// Ruta: GET /web3/wallet/:address
// Combina varias llamadas a la blockchain para dar una visión completa del wallet:
//   - balance en Wei y en ETH
//   - nonce: número de transacciones que ha enviado (0 = wallet nuevo, sin actividad)
//   - checksumAddress: dirección normalizada al formato EIP-55
//   - red actual y número del último bloque (para saber que estamos en Mainnet)
//
// El nonce es especialmente útil para saber si un wallet ha enviado transacciones alguna vez.
// Un nonce = 0 con balance = 0 confirma que es un wallet recién creado.

app.get('/web3/wallet/:address', async (req, res) => {
  try {
    const address = req.params.address

    const [balanceWei, nonce, blockNumber] = await Promise.all([
      web3Provider.eth.getBalance(address),
      web3Provider.eth.getTransactionCount(address),
      web3Provider.eth.getBlockNumber()
    ])

    res.json({
      address:          address,
      checksumAddress:  Web3.utils.toChecksumAddress(address),
      balanceWei:       balanceWei.toString(),
      balanceEth:       Web3.utils.fromWei(balanceWei, 'ether'),
      transactionCount: nonce.toString(),
      latestBlock:      blockNumber.toString(),
      network:          'mainnet'
    })
  } catch (error) {
    res.status(500).json({ error: 'Error consultando wallet', details: error.message })
  }
})


// HELPER: Web3 v4 devuelve campos numéricos como BigInt nativo de JavaScript.
// JSON.stringify no sabe serializar BigInt por defecto y lanza TypeError.
// Esta función recorre el objeto recursivamente y convierte cada BigInt a string.
const serializeBigInt = (obj) =>
  JSON.parse(JSON.stringify(obj, (_, v) => (typeof v === 'bigint' ? v.toString() : v)))


// 11.c Datos de un bloque por número
// Ruta: GET /web3/eth/getblock/:numero
// Devuelve toda la información de un bloque concreto de la blockchain Ethereum.
// El :numero es el índice del bloque en la cadena (el bloque génesis es el 0).
//
// Un bloque contiene:
//   number        -> número del bloque en la cadena
//   hash          -> identificador único del bloque (huella digital SHA-3)
//   parentHash    -> hash del bloque anterior (así se forma la "cadena")
//   timestamp     -> fecha/hora de cuando fue minado (en segundos Unix)
//   miner         -> dirección del validador que creó el bloque
//   transactions  -> array de hashes de las transacciones incluidas en el bloque
//   gasUsed       -> gas total consumido por todas las transacciones del bloque
//   gasLimit      -> gas máximo permitido en el bloque
//   baseFeePerGas -> precio base del gas tras EIP-1559 (desde el bloque 12965000)
//
// Ejemplo: GET /web3/eth/getblock/1       -> el segundo bloque de la historia
//          GET /web3/eth/getblock/15537394 -> el bloque del Merge (PoW → PoS)
//          GET /web3/eth/getblock/24656825 -> un bloque reciente

app.get('/web3/eth/getblock/:numero', async (req, res) => {
  try {
    const bloque = await web3Provider.eth.getBlock(req.params.numero)
    if (!bloque) {
      return res.status(404).json({ error: 'Bloque no encontrado', numero: req.params.numero })
    }
    res.json(serializeBigInt(bloque))
  } catch (error) {
    res.status(500).json({ error: 'Error consultando el bloque', details: error.message })
  }
})

// ────────────────────────────────────────────────────────────────────────────────────────────────
// MINIO – Consultas a Minio
// ────────────────────────────────────────────────────────────────────────────────────────────────

app.get('/minio/buckets', async (req, res) => {
  try {
    const buckets = await minioClient.listBuckets()
    res.json(buckets)
  } catch (error) {
    res.status(500).json({ error: 'Error consultando buckets', details: error.message })
  }
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 13. OBJECT STORAGE – MinIO (compatible con AWS S3)
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Operaciones principales del cliente MinIO:
//   minioClient.listBuckets()                        -> lista todos los buckets
//   minioClient.makeBucket(bucket, region)           -> crea un nuevo bucket
//   minioClient.bucketExists(bucket)                 -> comprueba si un bucket existe
//   minioClient.listObjects(bucket, prefix, recursive) -> lista objetos de un bucket
//   minioClient.putObject(bucket, key, stream, size) -> sube un fichero
//   minioClient.presignedGetObject(bucket, key, secs) -> URL firmada para descargar
//   minioClient.removeObject(bucket, key)            -> elimina un objeto
//
// URL FIRMADA (presigned URL):
//   Permite que cualquier usuario descargue/suba un fichero directamente desde/a MinIO
//   sin pasar por tu servidor Express. La URL incluye una firma de seguridad con expiración.
//   Muy útil para compartir ficheros privados temporalmente.


// 13.a Listar todos los buckets
// Respuesta: [ { name: "mi-bucket", creationDate: "..." }, ... ]

app.get('/minio/buckets', async (req, res) => {
  try {
    const buckets = await minioClient.listBuckets()
    res.json(buckets)
  } catch (error) {
    res.status(500).json({ error: 'Error listando buckets', details: error.message })
  }
})

// 13.b Crear un bucket
// Ruta: POST /minio/buckets/:bucket
// El nombre del bucket llega en req.params.bucket.
// La región 'us-east-1' es el valor por defecto; MinIO la acepta aunque sea local.
// Si el bucket ya existe, bucketExists lo detecta y se devuelve un mensaje informativo.

app.post('/minio/buckets/:bucket', async (req, res) => {
  try {
    const bucket = req.params.bucket
    const exists = await minioClient.bucketExists(bucket)
    if (exists) {
      return res.status(409).json({ message: `El bucket '${bucket}' ya existe` })
    }
    await minioClient.makeBucket(bucket, 'us-east-1')
    res.status(201).json({ message: `Bucket '${bucket}' creado correctamente` })
  } catch (error) {
    res.status(500).json({ error: 'Error creando bucket', details: error.message })
  }
})

// 13.c Listar ficheros de un bucket
// Ruta: GET /minio/buckets/:bucket/files
// listObjects devuelve un stream (no una Promise), por lo que lo leemos con eventos:
//   'data'  -> se emite por cada objeto encontrado
//   'end'   -> el stream terminó, ya tenemos todos los objetos
//   'error' -> hubo un error leyendo el stream

app.get('/minio/buckets/:bucket/files', async (req, res) => {
  try {
    const bucket  = req.params.bucket
    const objects = []
    const stream  = minioClient.listObjects(bucket, '', true)

    stream.on('data', (obj) => objects.push({
      name:         obj.name,
      size:         obj.size,
      lastModified: obj.lastModified,
      etag:         obj.etag
    }))

    stream.on('end',   () => res.json(objects))
    stream.on('error', (err) => res.status(500).json({ error: 'Error listando ficheros', details: err.message }))
  } catch (error) {
    res.status(500).json({ error: 'Error accediendo al bucket', details: error.message })
  }
})

// 13.d Subir un fichero al bucket indicado
// Ruta: POST /minio/buckets/:bucket/upload
// Recibe el fichero del campo 'fichero' (multipart/form-data, gestionado por express-fileupload).
// file.data es el Buffer con el contenido del fichero, file.size es su tamaño en bytes.
// El nombre del objeto en MinIO será el nombre original del fichero.

app.post('/minio/buckets/:bucket/upload', async (req, res) => {
  try {
    const bucket = req.params.bucket
    const file   = req.files?.fichero
    if (!file) {
      return res.status(400).json({ error: 'Se requiere un fichero en el campo "fichero"' })
    }

    await minioClient.putObject(bucket, file.name, file.data, file.size)

    res.status(201).json({
      message:  `Fichero '${file.name}' subido al bucket '${bucket}'`,
      bucket:   bucket,
      filename: file.name,
      size:     file.size
    })
  } catch (error) {
    res.status(500).json({ error: 'Error subiendo fichero a MinIO', details: error.message })
  }
})

// 13.e Obtener URL firmada de descarga (presigned URL)
// Ruta: GET /minio/buckets/:bucket/files/:filename/url
// Genera una URL temporal para descargar directamente desde MinIO (sin pasar por Express).
// El tercer parámetro es la duración en segundos: 3600 = 1 hora.
// Ideal para compartir ficheros privados sin exponerlos públicamente de forma permanente.

app.get('/minio/buckets/:bucket/files/:filename/url', async (req, res) => {
  try {
    const { bucket, filename } = req.params
    const expiresIn = parseInt(req.query.expira) || 3600
    const url = await minioClient.presignedGetObject(bucket, filename, expiresIn)
    res.json({
      url:      url,
      bucket:   bucket,
      filename: filename,
      expiresIn: `${expiresIn} segundos`
    })
  } catch (error) {
    res.status(500).json({ error: 'Error generando URL firmada', details: error.message })
  }
})


// 13.f Recuperar / descargar un fichero del bucket
// Ruta: GET /minio/buckets/:bucket/files/:filename
// getObject() devuelve un ReadableStream con el contenido del fichero.
// Lo "pipamos" (stream.pipe) directamente a la respuesta HTTP para no cargar
// el fichero entero en memoria: los bytes van del disco de MinIO al cliente en flujo continuo.
//
// Content-Disposition: attachment  -> fuerza la descarga en lugar de mostrar en el navegador
// Content-Type: application/octet-stream -> tipo genérico para cualquier fichero binario
//
// DIFERENCIA CLAVE entre getObject y presignedGetObject:
//   getObject       -> el fichero pasa POR tu servidor Express (consume ancho de banda del servidor)
//   presignedGetUrl -> el cliente descarga DIRECTAMENTE de MinIO (el servidor solo genera la URL)

app.get('/minio/buckets/:bucket/files/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params
    const stream = await minioClient.getObject(bucket, filename)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Type', 'application/octet-stream')
    stream.pipe(res)
  } catch (error) {
    res.status(500).json({ error: 'Error descargando fichero', details: error.message })
  }
})

// 13.g Eliminar un fichero – patrón PROMISE CHAINING (.then / .catch)
// Ruta: DELETE /minio/buckets/:bucket/files/:filename/v1
//
// PATRÓN PROMISE CHAINING:
//   operacion()
//     .then(resultado => { /* éxito */ })
//     .catch(error    => { /* error */ })
//
// Este era el estilo habitual antes de que async/await se popularizase (ES2017).
// Todavía se usa mucho y es válido, pero encadena callbacks lo que puede
// volverse difícil de leer cuando hay muchas operaciones seguidas ("callback hell").
// Obsérvese cómo hay que gestionar res dentro de cada .then/.catch por separado.

app.delete('/minio/buckets/:bucket/files/:filename/v1', (req, res) => {
  const { bucket, filename } = req.params

  minioClient.removeObject(bucket, filename)
    .then(() => {
      res.json({ message: `Fichero '${filename}' eliminado del bucket '${bucket}'` })
    })
    .catch((error) => {
      res.status(500).json({ error: 'Error eliminando fichero', details: error.message })
    })
})

// 13.h Eliminar un fichero – patrón ASYNC / AWAIT
// Ruta: DELETE /minio/buckets/:bucket/files/:filename
//
// PATRÓN ASYNC/AWAIT:
//   async (req, res) => {
//     try {
//       const resultado = await operacion()   <- espera sin bloquear el hilo
//     } catch (error) { ... }
//   }
//
// VENTAJAS respecto al patrón .then/.catch:
//   1. El código se lee de arriba a abajo, como si fuera síncrono
//   2. Un solo bloque try/catch maneja todos los errores de todas las awaits
//   3. Es más fácil depurar porque el stack trace es más claro
//   4. Permite usar variables entre pasos sin anidar funciones
//
// AMBOS patrones hacen exactamente lo mismo internamente (son azúcar sintáctico
// sobre las Promises). La diferencia es solo de legibilidad del código.

app.delete('/minio/buckets/:bucket/files/:filename', async (req, res) => {
  try {
    const { bucket, filename } = req.params
    await minioClient.removeObject(bucket, filename)
    res.json({ message: `Fichero '${filename}' eliminado del bucket '${bucket}'` })
  } catch (error) {
    res.status(500).json({ error: 'Error eliminando fichero', details: error.message })
  }
})




// ────────────────────────────────────────────────────────────────────────────────────────────────
// 14. SERVER SIDE PAGES – Motor de plantillas Pug
// ────────────────────────────────────────────────────────────────────────────────────────────────
// Los motores de plantillas (template engines) permiten generar HTML dinámico en el servidor
// combinando una plantilla estática con datos variables en tiempo de petición.
//
// PUG (antes llamado JADE) es el motor más popular para Express.
//   - Sintaxis basada en indentación (sin corchetes ni etiquetas de cierre)
//   - Se compila en el servidor → el cliente recibe HTML puro
//   - Variables: #{variable}  o  interpolación directa en atributos
//
// DIFERENCIA con archivos estáticos:
//   Estático  → el archivo ya está en disco y se sirve tal cual (HTML fijo)
//   Plantilla → el servidor genera el HTML en tiempo real con datos variables
//
// CONFIGURACIÓN:
//   app.set('view engine', 'pug')  → indica a Express qué motor usar
//   app.set('views', './views')    → carpeta donde busca las plantillas (por defecto './views')
//
// RENDERIZADO:
//   res.render('nombre_plantilla', { clave: valor })
//   El objeto de variables es accesible en la plantilla como variables locales.

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

// 14.a Plantilla básica con un par de variables pasadas desde el servidor
//      Accede a: http://localhost:3333/t1
app.get('/t1', (req, res) => {
  res.render('t1', {
    titulo:  'Motor de plantillas Pug',
    mensaje: 'Pug genera HTML dinámico en el servidor con Node.js + Express',
    items:   ['Sintaxis limpia sin corchetes', 'Variables con #{var}', 'Bucles y condicionales', 'Herencia de plantillas (extends/block)']
  })
})

// 14.b Plantilla personalizada: el nombre del usuario viene de la URL (:nombre)
//      Accede a: http://localhost:3333/usuario/Ana
app.get('/usuario/:nombre', (req, res) => {
  const { nombre } = req.params
  res.render('usuario', {
    titulo:   `Perfil de ${nombre}`,
    nombre:   nombre,
    fecha:    new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    horaISO:  new Date().toISOString()
  })
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 15. ORGANIZACIÓN CON EXPRESS ROUTER
// ────────────────────────────────────────────────────────────────────────────────────────────────
// A medida que la aplicación crece, tener todas las rutas en app.js se vuelve inmanejable.
// Express Router permite dividir las rutas en módulos independientes:
//
//   routes/clientes.js   → gestiona /api/clientes/*
//   routes/productos.js  → gestiona /api/productos/*
//   routes/facturas.js   → gestiona /api/facturas/*
//
// DIAGRAMA:
//   app.js  ──► /api/clientes  ──► routes/clientes.js
//           ──► /api/productos ──► routes/productos.js
//           ──► /api/facturas  ──► routes/facturas.js
//
// VENTAJAS:
//   ✔ Código organizado y mantenible
//   ✔ Cada módulo puede tener sus propios middlewares
//   ✔ Facilita el trabajo en equipo (cada equipo trabaja en su router)
//   ✔ Facilita los tests unitarios de cada grupo de rutas
//
// PATRÓN en cada archivo router:
//   const router = express.Router()
//   router.get('/', handler)    // → monta en la URL base definida en app.use()
//   router.get('/:id', handler) // → monta en /api/clientes/:id
//   module.exports = { clientes: router }

app.use('/api/clientes',  clientesRouter.clientes)
app.use('/api/productos', productosRouter.productos)
app.use('/api/facturas',  facturasRouter.facturas)


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 16. MANEJADORES GLOBALES DE ERROR
// ────────────────────────────────────────────────────────────────────────────────────────────────

// ── 16.a 404 NOT FOUND ───────────────────────────────────────────────────────────────────────────
// Este manejador se coloca AL FINAL, después de todas las rutas.
// Express solo llega aquí si NINGUNA ruta anterior ha respondido a la petición.
//
// OPCIÓN 1 (texto plano):
//   app.get('*path', (req, res) => res.status(404).send('Lo sentimos, no tenemos esto'))
//
// OPCIÓN 2 (página HTML personalizada) ← la que usamos:
//   El cliente es redirigido a una página HTML de error con diseño propio.
//   Esto mejora la experiencia de usuario frente a un mensaje de texto genérico.
//
// NOTA Express 5: el wildcard cambió de '*' a '*path' (wildcard con nombre obligatorio).
//   Express 4: app.get('*',     handler)
//   Express 5: app.get('*path', handler)  ← usamos esta porque tenemos express ^5

app.get('*path', (req, res) => {
  res.status(404).redirect('/error_404.html')
})

// ── 16.b 500 INTERNAL SERVER ERROR ───────────────────────────────────────────────────────────────
// Middleware de error de Express: SIEMPRE tiene EXACTAMENTE 4 parámetros (err, req, res, next).
// Express lo reconoce como manejador de errores por la firma de 4 parámetros.
//
// Se activa cuando:
//   1. Una ruta lanza una excepción síncrona:  throw new Error('...')
//   2. Se llama a next(error) desde una ruta o middleware asíncrono
//
// RUTA DE PRUEBA: GET /error  → lanza un Error deliberado para probar este manejador
//
// EN PRODUCCIÓN se debería loggear el error y enviar una respuesta genérica
// (sin exponer el stack trace al cliente).

app.use((err, req, res, next) => {
  console.error('[ERROR 500]', err.stack || err.message)
  res.status(500).send(`${err} — 500: Internal Server Error`)
})


// ────────────────────────────────────────────────────────────────────────────────────────────────
// 17. INICIO DEL SERVIDOR
// ────────────────────────────────────────────────────────────────────────────────────────────────
// app.listen(puerto, callback) arranca el servidor HTTP en el puerto indicado.
// process.env.PORT permite configurar el puerto por variable de entorno
// (útil en plataformas cloud como Heroku, Railway, Render, etc.).
// Si la variable no está definida, se usa 3333 como valor por defecto.
//
// IMPORTANTE: app.listen() va siempre AL FINAL, después de:
//   - Todos los middlewares (app.use)
//   - Todas las rutas (app.get, app.post, etc.)
//   - El manejador 404 (app.get('*path'))
//   - El manejador 500 (app.use con 4 parámetros)

const PORT = parseInt(process.env.PORT) || 3333
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`)
})

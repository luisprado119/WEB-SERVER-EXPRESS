# Guía Práctica: Servidor Web con Node.js + Express

Proyecto de prácticas del Máster **Web2.5 / Blockchain Technology**.  
Cubre de forma progresiva **17 secciones** con todos los conceptos clave de un servidor web moderno con Node.js, desde las rutas más básicas hasta Blockchain, Object Storage, CORS, Server Side Pages y organización con Express Router.

> 📖 **Interfaz visual completa:** `http://localhost:3333/guia.html`

---

## Índice de contenidos

1. [Tecnologías y librerías](#1-tecnologías-y-librerías)
2. [Requisitos previos](#2-requisitos-previos)
3. [Instalación](#3-instalación)
4. [Servicios externos](#4-servicios-externos)
5. [Ejecución](#5-ejecución)
6. [Estructura del proyecto](#6-estructura-del-proyecto)
7. [Conceptos practicados](#7-conceptos-practicados)
8. [Referencia de rutas](#8-referencia-de-rutas)
9. [Páginas HTML incluidas](#9-páginas-html-incluidas)
10. [Preparar para GitHub](#10-preparar-para-github)

---

## 1. Tecnologías y librerías

| Librería | Versión | Para qué se usa |
|---|---|---|
| `express` | ^5.x | Framework web: rutas, middlewares, servidor HTTP |
| `morgan` | ^1.x | Logging de peticiones HTTP (consola y ficheros) |
| `express-fileupload` | ^1.x | Recibir ficheros subidos (multipart/form-data) |
| `pg` | ^8.x | Cliente PostgreSQL (consultas con Pool de conexiones) |
| `web3` | ^4.x | Interacción con la blockchain de Ethereum |
| `minio` | ^8.x | Object Storage compatible con AWS S3 |
| `pug` | ^3.x | Motor de plantillas para Server Side Pages (SSR) |
| `cors` | ^2.x | Middleware para gestionar CORS en Express |
| `dotenv` | ^17.x | Variables de entorno desde fichero `.env` |

```bash
npm install express morgan express-fileupload pg web3 minio pug cors dotenv
```

---

## 2. Requisitos previos

- **Node.js** v18 o superior → [nodejs.org](https://nodejs.org)
- **npm** (incluido con Node.js)
- **PostgreSQL** en el puerto `5499` (o Docker, ver sección 4)
- **MinIO** ejecutable o Docker (ver sección 4)
- Extensión **REST Client** en VS Code (para usar `requests.http`)

---

## 3. Instalación

```bash
# 1. Clona el repositorio
git clone https://github.com/TU_USUARIO/curso-express-primero.git
cd curso-express-primero

# 2. Instala las dependencias
npm install
```

---

## 4. Servicios externos

El proyecto se conecta a dos servicios que debes tener activos antes de arrancar el servidor.

### PostgreSQL (base de datos)

**Con Docker** (recomendado):
```bash
docker run -d \
  --name curso-pg1 \
  -p 5499:5432 \
  -e POSTGRES_PASSWORD=123456 \
  postgres
```

**Credenciales configuradas en `app.js`:**
```
host:     localhost
port:     5499
user:     postgres
password: 123456
```

> La base de datos usada en las prácticas es **Northwind** (customers, orders…).

---

### MinIO (Object Storage)

**Descarga el ejecutable** (community, gratuito):
```powershell
# Windows PowerShell
Invoke-WebRequest -Uri "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutFile "minio.exe"
```

**Arranca el servidor:**
```powershell
$env:MINIO_ROOT_USER="minioadmin"
$env:MINIO_ROOT_PASSWORD="minioadmin"
.\minio.exe server C:\minio-data --console-address :9001
```

| Interfaz | URL |
|---|---|
| API S3 (para el código) | http://localhost:9000 |
| Consola web (navegador) | http://localhost:9001 |

> **Credenciales por defecto:** `minioadmin` / `minioadmin`  
> En producción cámbialas por variables de entorno.

---

## 5. Ejecución

```bash
# Modo producción
npm start

# Modo desarrollo (reinicio automático al guardar con nodemon)
npm run dev
```

El servidor queda disponible en **http://localhost:3333**

---

## 6. Estructura del proyecto

```
curso-express-primero/
│
├── app.js                      # Servidor Express completo (17 secciones anotadas)
├── app-core.js                 # Servidor CORS de ejemplo (puerto 3345)
├── package.json                # Dependencias del proyecto
├── requests.http               # 120+ peticiones de ejemplo para REST Client
├── .env                        # Variables de entorno locales (NO subir a Git)
├── .env.example                # Plantilla de variables de entorno (SÍ subir)
│
├── public/                     # Ficheros estáticos servidos por Express
│   ├── index.html              # Página de inicio → enlaza a la guía
│   ├── guia.html               # 📖 Guía visual completa con demos interactivas
│   ├── formulario.html         # Práctica: POST, JSON, query params
│   ├── formulario2.html        # Práctica: subida de ficheros al servidor
│   ├── formularioMinio.html    # Práctica: Object Storage con MinIO (UI completa)
│   ├── cors.html               # Práctica: demo visual de 6 escenarios CORS
│   └── error_404.html          # Página de error 404 personalizada
│
├── views/                      # Plantillas Pug (Server Side Pages)
│   ├── t1.pug                  # Plantilla básica con variables y lista
│   └── usuario.pug             # Perfil de usuario dinámico por URL
│
├── routes/                     # Express Router – rutas organizadas por módulo
│   ├── clientes.js             # CRUD /api/clientes
│   ├── productos.js            # CRUD /api/productos (con filtro por categoría)
│   └── facturas.js             # CRUD /api/facturas (con PATCH de estado)
│
├── uploads/                    # Ficheros subidos + logs de Morgan (en .gitignore)
│   ├── access.log              # Todas las peticiones
│   ├── logsBuenos.txt          # Solo respuestas 2xx/3xx
│   └── logsErrores.txt         # Solo respuestas 4xx/5xx
│
└── minio.exe                   # Ejecutable MinIO (no subir a Git → .gitignore)
```

---

## 7. Conceptos practicados

### Express básico
- Crear un servidor HTTP con `express()`
- Rutas `GET` y `POST` con `app.get()` / `app.post()`
- Respuestas: `res.send()`, `res.json()`, `res.sendFile()`, `res.status()`
- **Tres fuentes de datos** en una petición:
  - `req.params` → variables en la URL (`/usuario/:id`)
  - `req.query`  → parámetros de consulta (`?pagina=2&orden=asc`)
  - `req.body`   → datos en el cuerpo (JSON, formulario)

### Middlewares
- Qué es un middleware y el flujo `req → MW1 → MW2 → ruta → res`
- `express.json()` y `express.urlencoded()` para parsear el body
- `express-fileupload` para recibir ficheros (`req.files`)
- `morgan` para logging en consola y en ficheros con streams y filtros (`skip`)
- Middleware personalizado con `(req, res, next)`
- Archivos estáticos con `express.static()`

### Códigos de estado HTTP
- `200` OK, `201` Created, `204` No Content
- `400` Bad Request, `401` Unauthorized, `404` Not Found, `409` Conflict
- `500` Internal Server Error

### Base de datos – PostgreSQL con `pg`
- Pool de conexiones reutilizables
- `pool.query(sql, [params])` con async/await
- **Consultas parametrizadas** (`$1`, `$2`…) para prevenir SQL Injection
- Patrón de ruta con base de datos: `async (req, res) => { try { await pool.query... } catch {} }`

### Blockchain – Ethereum con `web3` v4
- Conectar a la red Ethereum mediante un proveedor Infura
- Cambio de API en Web3 v4: `const { Web3 } = require('web3')`
- Consultas de solo lectura (gratuitas, sin gas):
  - `eth.getBalance(address)` → saldo en Wei
  - `eth.getTransactionCount(address)` → nonce (transacciones enviadas)
  - `eth.getBlockNumber()` → último bloque minado
  - `eth.getBlock(number)` → datos completos de un bloque
- Conversión de unidades: `Web3.utils.fromWei(wei, 'ether')`
- **BigInt en Web3 v4**: los campos numéricos son `BigInt`; hay que serializarlos con un replacer antes de `res.json()`
- `Promise.all()` para hacer varias consultas en paralelo

### Object Storage – MinIO
- Diferencia entre sistema de ficheros local (`fs`) y Object Storage (MinIO/S3)
- Conceptos: **bucket**, **object**, **key**, **presigned URL**
- Operaciones CRUD completas:
  - `listBuckets()` → listar buckets
  - `makeBucket()` / `bucketExists()` → crear y verificar
  - `listObjects()` → stream de objetos (`stream.on('data'/'end'/'error')`)
  - `putObject()` → subir un fichero desde un Buffer
  - `getObject()` → descargar (stream.pipe a la respuesta)
  - `removeObject()` → eliminar un objeto
  - `presignedGetObject()` → URL de descarga temporal y firmada
- **Stream vs Presigned URL**: cuándo usar cada uno

### CORS – Cross-Origin Resource Sharing
- Qué es la **Same-Origin Policy** del navegador y por qué existe
- Cómo el servidor añade cabeceras CORS para relajar la política
- Preflight `OPTIONS`: cuándo y por qué el navegador lo envía automáticamente
- Configuraciones: wildcard `*`, origen específico, whitelist dinámica, credenciales
- Demo visual en `cors.html` (cliente en `:3333`, servidor en `:3345`)

### Server Side Pages – Motor de plantillas Pug
- Diferencia entre archivos estáticos y plantillas (SSR)
- Configuración: `app.set('view engine', 'pug')`
- Sintaxis Pug: indentación, variables `#{var}`, bucles `each`, condicionales
- `res.render('plantilla', { datos })` para pasar variables al template
- Dos plantillas: `/t1` (lista dinámica) y `/usuario/:nombre` (perfil por URL)

### Organización con Express Router
- Por qué dividir las rutas en módulos cuando el proyecto crece
- Patrón: `express.Router()`, definir rutas, `module.exports`
- Montar routers con `app.use('/api/recurso', router)`
- CRUD completo para tres entidades: Clientes, Productos, Facturas
- PATCH vs PUT: actualización parcial vs reemplazo completo

### Manejadores globales de error (404 y 500)
- `app.get('*path', handler)` al final para capturar rutas no definidas (Express 5)
- Redirección a página de error personalizada con diseño
- Middleware de error con 4 parámetros `(err, req, res, next)`
- Diferencia entre `res.status(500)` y `throw new Error()` → `next(err)`

### Performance y Benchmarking
- `autocannon`: benchmark local con múltiples conexiones concurrentes
- Apache Benchmark (`ab`) vía Docker con `jordi/ab`
- Métricas: req/s, latencia p50/p99, tasa de errores
- Estrategias de optimización: `Promise.all()`, índices BD, compresión, caché

### Asincronía en Node.js
- **Promise chaining** (`.then()` / `.catch()`): patrón clásico
- **`async` / `await`**: patrón moderno, código lineal, un solo `try/catch`
- **`Promise.all()`**: ejecutar varias operaciones asíncronas en paralelo

---

## 8. Referencia de rutas

### Rutas básicas
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Sirve `public/index.html` |
| GET | `/docs` | Sirve `docs/index.html` |
| GET | `/ping` | Health check `{ status, message, timestamp }` |
| GET | `/welcome` | Texto plano "hola" |
| GET | `/error400` | Simula error 400 |
| GET | `/error500` | Simula error 500 |
| GET | `/error404` | Simula error 404 |

### Rutas POST
| Método | Ruta | Descripción |
|---|---|---|
| POST | `/data` | Recibe JSON, responde 201 |
| POST | `/echoPost` | Eco del body (JSON o form) |
| POST | `/echoPostJson` | Eco del body + query string |
| POST | `/echoParamsPost/:cliente/facturas/:factura` | params + query + body |
| POST | `/uploadFicheros` | Sube múltiples ficheros al servidor |
| POST | `/postMultipart` | Sube un fichero (`fichero1`) |
| POST | `/postMultipartMultiple` | Sube varios ficheros (`ficheros`) |

### Base de datos
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/bdd/test` | `SELECT now()` – test de conexión |
| GET | `/bdd/customers` | Todos los customers |
| GET | `/bdd/orders/:cliente` | Pedidos de un cliente |
| GET | `/bdd/orders/:cliente/:id` | Un pedido concreto |

### Blockchain
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/web3/balance/:address` | Balance en Wei y ETH |
| GET | `/web3/wallet/:address` | Info completa del wallet |
| GET | `/web3/eth/getblock/:numero` | Datos de un bloque |

### MinIO
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/minio/buckets` | Listar buckets |
| POST | `/minio/buckets/:bucket` | Crear bucket |
| GET | `/minio/buckets/:bucket/files` | Listar ficheros |
| POST | `/minio/buckets/:bucket/upload` | Subir fichero |
| GET | `/minio/buckets/:bucket/files/:filename` | Descargar fichero (stream) |
| GET | `/minio/buckets/:bucket/files/:filename/url` | Generar URL firmada |
| DELETE | `/minio/buckets/:bucket/files/:filename/v1` | Eliminar (`.then/.catch`) |
| DELETE | `/minio/buckets/:bucket/files/:filename` | Eliminar (async/await) |

### CORS (servidor app-core.js en puerto 3345)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `:3345/sin-cors` | Sin cabeceras CORS → bloqueado en navegador |
| GET | `:3345/cors-abierto` | `Access-Control-Allow-Origin: *` |
| GET | `:3345/cors-restringido` | Solo acepta `http://localhost:3333` |
| GET | `:3345/cors-whitelist` | Whitelist dinámica de orígenes |
| GET | `:3345/cors-completo` | Configuración avanzada con credentials y maxAge |
| POST | `:3345/cors-post` | Demuestra el preflight OPTIONS |

### Server Side Pages (Pug)
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/t1` | Plantilla básica con variables y lista |
| GET | `/usuario/:nombre` | Perfil dinámico por nombre en URL |

### Express Router – API REST
| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/clientes` | Lista todos los clientes |
| GET | `/api/clientes/:id` | Cliente por ID |
| POST | `/api/clientes` | Crear cliente `{"nombre","email","pais"}` |
| PUT | `/api/clientes/:id` | Actualizar cliente |
| DELETE | `/api/clientes/:id` | Eliminar cliente |
| GET | `/api/productos` | Lista productos (acepta `?categoria=X`) |
| GET | `/api/productos/:id` | Producto por ID |
| POST | `/api/productos` | Crear producto `{"nombre","precio","categoria"}` |
| PUT | `/api/productos/:id` | Actualizar producto |
| DELETE | `/api/productos/:id` | Eliminar producto |
| GET | `/api/facturas` | Lista facturas (acepta `?estado=X&clienteId=Y`) |
| GET | `/api/facturas/:id` | Factura por ID (ej: `F2024001`) |
| POST | `/api/facturas` | Crear factura `{"clienteId","monto"}` |
| PATCH | `/api/facturas/:id/estado` | Cambiar estado `{"estado":"pagada"}` |

### Páginas de error
| Ruta | Descripción |
|---|---|
| `/error` | Lanza `throw new Error()` → activa middleware 500 |
| `/error400` | Responde directamente con 400 |
| `/error500` | Responde directamente con 500 |
| `/ruta-que-no-existe` | Activa el handler 404 → redirige a `/error_404.html` |

---

## 9. Páginas HTML incluidas

| Fichero | URL | Contenido |
|---|---|---|
| `index.html` | `/` | Página de inicio → enlaza a la guía |
| `guia.html` | `/guia.html` | 📖 Guía visual completa con demos interactivas |
| `formulario.html` | `/formulario.html` | POST JSON, form-urlencoded, query params |
| `formulario2.html` | `/formulario2.html` | Subida de ficheros al servidor |
| `formularioMinio.html` | `/formularioMinio.html` | CRUD completo de buckets y objetos en MinIO |
| `cors.html` | `/cors.html` | Demo visual de 6 escenarios CORS |
| `error_404.html` | `/error_404.html` | Página de error 404 personalizada |

---

## 10. Preparar para GitHub

### `.gitignore` recomendado

Crea el fichero `.gitignore` en la raíz del proyecto:

```
# Dependencias
node_modules/

# Logs generados
uploads/access.log
uploads/logsBuenos.txt
uploads/logsErrores.txt

# Datos de MinIO (no subir al repositorio)
minio-data/
minio.exe

# Variables de entorno (contienen credenciales)
.env

# Sistemas operativos
.DS_Store
Thumbs.db
```

### Primer commit y subida a GitHub

```bash
# 1. Inicializa el repositorio Git
git init

# 2. Añade todos los ficheros (el .gitignore excluirá los innecesarios)
git add .

# 3. Primer commit
git commit -m "feat: práctica completa Express + PostgreSQL + Web3 + MinIO"

# 4. Crea el repositorio en GitHub (desde github.com o con GitHub CLI)
gh repo create curso-express-primero --public --source=. --remote=origin

# 5. Sube el código
git push -u origin main
```

### Variables de entorno para producción

Para no exponer credenciales en el código, crea un fichero `.env`:

```env
PORT=3333

# PostgreSQL
DB_HOST=localhost
DB_PORT=5499
DB_USER=postgres
DB_PASSWORD=123456

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Web3 / Infura
WEB3_PROVIDER_URL=https://mainnet.infura.io/v3/TU_API_KEY
```

Y en `app.js` leerlas con `process.env.NOMBRE_VARIABLE`.  
Instala `dotenv` para cargar el `.env` automáticamente:

```bash
npm install dotenv
```

```js
// Al inicio de app.js (primera línea)
require('dotenv').config()
```

---

## Notas finales

- El fichero `app.js` está completamente **anotado como guía de estudio**: cada sección explica el concepto, la sintaxis y las alternativas.
- El fichero `requests.http` contiene **más de 80 peticiones de ejemplo** organizadas por sección, con comentarios pedagógicos.
- `formularioMinio.html` incluye una interfaz completa con **drag & drop**, descarga directa y generación de URLs firmadas.

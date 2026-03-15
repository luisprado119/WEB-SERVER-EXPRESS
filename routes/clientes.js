// ================================================================================================
// ROUTER DE CLIENTES – routes/clientes.js
// ================================================================================================
// Este archivo agrupa todas las rutas relacionadas con "clientes".
// Se monta en app.js con: app.use('/api/clientes', clientesRouter.clientes)
//
// Resultado: todas las rutas definidas aquí son relativas al prefijo /api/clientes
//   router.get('/')       → GET  /api/clientes
//   router.get('/:id')    → GET  /api/clientes/:id
//   router.post('/')      → POST /api/clientes
//   router.put('/:id')    → PUT  /api/clientes/:id
//   router.delete('/:id') → DELETE /api/clientes/:id
//
// CÓMO CREAR UN ROUTER:
//   1. Importar express
//   2. Crear una instancia con express.Router()
//   3. Definir las rutas sobre 'router' (no sobre 'app')
//   4. Exportar el router en module.exports

const express = require('express')
const router  = express.Router()

// Datos de ejemplo en memoria (en una app real vendrían de una base de datos)
const clientes = [
  { id: 1, nombre: 'Empresa ACME',       email: 'acme@empresa.com',   pais: 'España'  },
  { id: 2, nombre: 'Tech Solutions SL',  email: 'info@techsol.es',    pais: 'España'  },
  { id: 3, nombre: 'Global Imports Inc', email: 'contact@global.com', pais: 'EE.UU.'  },
  { id: 4, nombre: 'StartUp Labs',       email: 'hola@startup.io',    pais: 'México'  }
]

// GET /api/clientes  → lista todos los clientes
router.get('/', (req, res) => {
  res.json({
    total:    clientes.length,
    clientes: clientes
  })
})

// GET /api/clientes/:id  → obtiene un cliente por ID
router.get('/:id', (req, res) => {
  const id      = parseInt(req.params.id)
  const cliente = clientes.find(c => c.id === id)

  if (!cliente) {
    return res.status(404).json({ error: `Cliente con id ${id} no encontrado` })
  }
  res.json(cliente)
})

// POST /api/clientes  → crea un nuevo cliente
router.post('/', (req, res) => {
  const { nombre, email, pais } = req.body

  if (!nombre || !email) {
    return res.status(400).json({ error: 'Los campos nombre y email son obligatorios' })
  }

  const nuevo = {
    id:     clientes.length + 1,
    nombre: nombre,
    email:  email,
    pais:   pais || 'Desconocido'
  }

  clientes.push(nuevo)
  res.status(201).json({ message: 'Cliente creado', cliente: nuevo })
})

// PUT /api/clientes/:id  → actualiza un cliente existente
router.put('/:id', (req, res) => {
  const id      = parseInt(req.params.id)
  const idx     = clientes.findIndex(c => c.id === id)

  if (idx === -1) {
    return res.status(404).json({ error: `Cliente con id ${id} no encontrado` })
  }

  clientes[idx] = { ...clientes[idx], ...req.body, id }
  res.json({ message: 'Cliente actualizado', cliente: clientes[idx] })
})

// DELETE /api/clientes/:id  → elimina un cliente
router.delete('/:id', (req, res) => {
  const id  = parseInt(req.params.id)
  const idx = clientes.findIndex(c => c.id === id)

  if (idx === -1) {
    return res.status(404).json({ error: `Cliente con id ${id} no encontrado` })
  }

  const eliminado = clientes.splice(idx, 1)[0]
  res.json({ message: 'Cliente eliminado', cliente: eliminado })
})

module.exports = { clientes: router }

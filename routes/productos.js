// ================================================================================================
// ROUTER DE PRODUCTOS – routes/productos.js
// ================================================================================================
// Montado en app.js con: app.use('/api/productos', productosRouter.productos)
// Todas las rutas son relativas a /api/productos

const express = require('express')
const router  = express.Router()

const productos = [
  { id: 1, nombre: 'Laptop Pro 15',     precio: 1299.99, categoria: 'Electrónica', stock: 15 },
  { id: 2, nombre: 'Teclado Mecánico',  precio:  89.99,  categoria: 'Periféricos', stock: 42 },
  { id: 3, nombre: 'Monitor 4K 27"',    precio: 549.00,  categoria: 'Electrónica', stock:  8 },
  { id: 4, nombre: 'SSD 1TB NVMe',      precio: 119.99,  categoria: 'Almacenamiento', stock: 30 },
  { id: 5, nombre: 'Auriculares BT',    precio:  79.90,  categoria: 'Audio',        stock: 20 }
]

// GET /api/productos  → lista todos; acepta ?categoria=X para filtrar
router.get('/', (req, res) => {
  const { categoria } = req.query

  const resultado = categoria
    ? productos.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase())
    : productos

  res.json({ total: resultado.length, productos: resultado })
})

// GET /api/productos/:id  → detalle de un producto
router.get('/:id', (req, res) => {
  const id       = parseInt(req.params.id)
  const producto = productos.find(p => p.id === id)

  if (!producto) {
    return res.status(404).json({ error: `Producto con id ${id} no encontrado` })
  }
  res.json(producto)
})

// POST /api/productos  → añade un producto
router.post('/', (req, res) => {
  const { nombre, precio, categoria, stock } = req.body

  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'Los campos nombre y precio son obligatorios' })
  }

  const nuevo = {
    id:        productos.length + 1,
    nombre:    nombre,
    precio:    parseFloat(precio),
    categoria: categoria || 'General',
    stock:     parseInt(stock) || 0
  }

  productos.push(nuevo)
  res.status(201).json({ message: 'Producto creado', producto: nuevo })
})

// PUT /api/productos/:id  → actualiza precio o stock
router.put('/:id', (req, res) => {
  const id  = parseInt(req.params.id)
  const idx = productos.findIndex(p => p.id === id)

  if (idx === -1) {
    return res.status(404).json({ error: `Producto con id ${id} no encontrado` })
  }

  productos[idx] = { ...productos[idx], ...req.body, id }
  res.json({ message: 'Producto actualizado', producto: productos[idx] })
})

// DELETE /api/productos/:id
router.delete('/:id', (req, res) => {
  const id  = parseInt(req.params.id)
  const idx = productos.findIndex(p => p.id === id)

  if (idx === -1) {
    return res.status(404).json({ error: `Producto con id ${id} no encontrado` })
  }

  const eliminado = productos.splice(idx, 1)[0]
  res.json({ message: 'Producto eliminado', producto: eliminado })
})

module.exports = { productos: router }

// ================================================================================================
// ROUTER DE FACTURAS – routes/facturas.js
// ================================================================================================
// Montado en app.js con: app.use('/api/facturas', facturasRouter.facturas)
// Todas las rutas son relativas a /api/facturas

const express = require('express')
const router  = express.Router()

const facturas = [
  { id: 'F2024001', clienteId: 1, fecha: '2024-01-15', monto: 2599.98, estado: 'pagada'    },
  { id: 'F2024002', clienteId: 2, fecha: '2024-02-03', monto:  899.00, estado: 'pendiente' },
  { id: 'F2024003', clienteId: 1, fecha: '2024-03-20', monto:  549.00, estado: 'pagada'    },
  { id: 'F2024004', clienteId: 3, fecha: '2024-04-10', monto: 1199.90, estado: 'vencida'   },
  { id: 'F2024005', clienteId: 4, fecha: '2024-05-01', monto:  199.99, estado: 'pendiente' }
]

// GET /api/facturas  → lista todas; acepta ?estado=X para filtrar
router.get('/', (req, res) => {
  const { estado, clienteId } = req.query

  let resultado = [...facturas]
  if (estado)    resultado = resultado.filter(f => f.estado === estado)
  if (clienteId) resultado = resultado.filter(f => f.clienteId === parseInt(clienteId))

  const total = resultado.reduce((sum, f) => sum + f.monto, 0)
  res.json({ total_facturas: resultado.length, importe_total: total.toFixed(2), facturas: resultado })
})

// GET /api/facturas/:id  → detalle de una factura
router.get('/:id', (req, res) => {
  const factura = facturas.find(f => f.id === req.params.id)

  if (!factura) {
    return res.status(404).json({ error: `Factura ${req.params.id} no encontrada` })
  }
  res.json(factura)
})

// POST /api/facturas  → registra una nueva factura
router.post('/', (req, res) => {
  const { clienteId, monto } = req.body

  if (!clienteId || monto === undefined) {
    return res.status(400).json({ error: 'Los campos clienteId y monto son obligatorios' })
  }

  const nueva = {
    id:        `F${new Date().getFullYear()}${String(facturas.length + 1).padStart(3, '0')}`,
    clienteId: parseInt(clienteId),
    fecha:     new Date().toISOString().split('T')[0],
    monto:     parseFloat(monto),
    estado:    'pendiente'
  }

  facturas.push(nueva)
  res.status(201).json({ message: 'Factura creada', factura: nueva })
})

// PATCH /api/facturas/:id/estado  → actualiza solo el estado de la factura
router.patch('/:id/estado', (req, res) => {
  const idx = facturas.findIndex(f => f.id === req.params.id)

  if (idx === -1) {
    return res.status(404).json({ error: `Factura ${req.params.id} no encontrada` })
  }

  const estadosValidos = ['pendiente', 'pagada', 'vencida', 'cancelada']
  const { estado } = req.body

  if (!estadosValidos.includes(estado)) {
    return res.status(400).json({ error: `Estado inválido. Valores posibles: ${estadosValidos.join(', ')}` })
  }

  facturas[idx].estado = estado
  res.json({ message: 'Estado actualizado', factura: facturas[idx] })
})

module.exports = { facturas: router }

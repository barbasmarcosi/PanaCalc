import { toGrams } from '../mass/units'
import type { ProductionRequest, ResolvedProductionTarget } from './types'

export function resolveProductionTarget(request: ProductionRequest): ResolvedProductionTarget {
  if (request.mode === 'pieces') {
    const pieceMassGrams = toGrams(request.pieceMass, request.unit)
    return {
      calculationMode: 'totalMass',
      targetGrams: request.count * pieceMassGrams,
      pieces: {
        count: request.count,
        pieceMassGrams,
      },
    }
  }

  return {
    calculationMode: request.mode,
    targetGrams: toGrams(request.value, request.unit) * request.scale,
  }
}

export function validateProductionRequest(request: ProductionRequest): string[] {
  const errors: string[] = []

  if (request.mode === 'pieces') {
    if (!Number.isFinite(request.count) || !Number.isInteger(request.count) || request.count <= 0) {
      errors.push('La cantidad de piezas debe ser un entero mayor que 0.')
    }

    if (!Number.isFinite(request.pieceMass) || request.pieceMass <= 0) {
      errors.push('El peso por pieza debe ser mayor que 0.')
    }

    return errors
  }

  if (!Number.isFinite(request.value) || request.value <= 0) {
    errors.push('La cantidad debe ser mayor que 0.')
  }

  if (!Number.isFinite(request.scale) || request.scale <= 0) {
    errors.push('El multiplicador debe ser mayor que 0.')
  }

  return errors
}

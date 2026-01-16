
import { t } from '@/lib/i18n';

export const validateInvestmentMovement = (form) => {
  const errors = {};
  let isValid = true;

  // Validate inversionista_id
  if (!form.inversionista_id) {
    errors.inversionista_id = 'El inversionista es obligatorio';
    isValid = false;
  }

  // Validate proyecto_id
  if (!form.proyecto_id) {
    errors.proyecto_id = 'El proyecto es obligatorio';
    isValid = false;
  }

  // Validate tipo_movimiento
  if (!form.tipo_movimiento || (form.tipo_movimiento !== 'INVERSION_RECIBIDA' && form.tipo_movimiento !== 'DEVOLUCION_INVERSION')) {
    errors.tipo_movimiento = 'Tipo de movimiento inválido';
    isValid = false;
  }

  // Validate fecha
  if (!form.fecha) {
    errors.fecha = 'La fecha es obligatoria';
    isValid = false;
  } else {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    const selectedDate = new Date(form.fecha);
    if (selectedDate > today) {
      errors.fecha = 'La fecha no puede ser futura';
      isValid = false;
    }
  }

  // Validate monto_ars
  if (!form.monto_ars || parseFloat(form.monto_ars) <= 0) {
    errors.monto_ars = 'El monto en ARS debe ser mayor a 0';
    isValid = false;
  }

  // Validate cotizacion_ars_usd
  if (!form.cotizacion_ars_usd || parseFloat(form.cotizacion_ars_usd) <= 0) {
    errors.cotizacion_ars_usd = 'La cotización debe ser mayor a 0';
    isValid = false;
  }

  // Validate monto_usd (calculated but good to check)
  if (!form.monto_usd || parseFloat(form.monto_usd) <= 0) {
    errors.monto_usd = 'El monto calculado en USD inválido';
    isValid = false;
  }

  return { isValid, errors };
};


import { movimientoService } from './movimientoService';

export const pendienteService = {
  async getPendingByHorizon(projectId, days) {
    try {
      const today = new Date();
      const horizonDate = new Date();
      horizonDate.setDate(today.getDate() + days);
      
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = horizonDate.toISOString().split('T')[0];

      // Fetch pending movements within the date range
      const movs = await movimientoService.getMovimientos({
        projectId,
        status: ['PENDIENTE'],
        dateFrom,
        dateTo
      });

      const result = movs.reduce((acc, m) => {
        const amount = Number(m.amount_ars || m.amount || 0);
        if (m.type === 'ingreso') {
          acc.ingresos += amount;
        } else {
          acc.gastos += amount;
        }
        return acc;
      }, { ingresos: 0, gastos: 0 });

      result.neto = result.ingresos - result.gastos;
      return result;
    } catch (error) {
      console.error(`Error calculating pending for ${days} days:`, error);
      return { ingresos: 0, gastos: 0, neto: 0 };
    }
  },

  async getPendingMatrix(projectId) {
    try {
      const horizons = [7, 30, 60, 90];
      const results = await Promise.all(
        horizons.map(days => this.getPendingByHorizon(projectId, days))
      );

      return {
        7: results[0],
        30: results[1],
        60: results[2],
        90: results[3]
      };
    } catch (error) {
      console.error("Error generating pending matrix:", error);
      return {
        7: { ingresos: 0, gastos: 0, neto: 0 },
        30: { ingresos: 0, gastos: 0, neto: 0 },
        60: { ingresos: 0, gastos: 0, neto: 0 },
        90: { ingresos: 0, gastos: 0, neto: 0 }
      };
    }
  },

  async getPendingMovementsByHorizon(projectId, days, tipo) {
    try {
      const today = new Date();
      const horizonDate = new Date();
      horizonDate.setDate(today.getDate() + days);
      
      const dateFrom = today.toISOString().split('T')[0];
      const dateTo = horizonDate.toISOString().split('T')[0];

      // Determine movement type for filter
      // tipo is expected to be 'ingreso' or 'gasto'
      // If tipo is null/undefined, it returns all types (useful for 'liquidez')
      
      const filters = {
        projectId,
        status: ['PENDIENTE'],
        dateFrom,
        dateTo
      };

      if (tipo) {
        filters.type = tipo;
      }

      const movs = await movimientoService.getMovimientos(filters);

      // Sort by date ascending (closest due date first)
      return movs.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error(`Error fetching pending movements for ${days} days:`, error);
      return [];
    }
  },

  async getPendingDetailByHorizon(projectId, days, tipoFila) {
    try {
      // tipoFila: 'income' (Cobros), 'expense' (Pagos), 'net' (Liquidez)
      
      if (tipoFila === 'income') {
        const ingresos = await this.getPendingMovementsByHorizon(projectId, days, 'ingreso');
        const total = ingresos.reduce((sum, m) => sum + Number(m.amount_ars || m.amount || 0), 0);
        return { ingresos, total };
      } 
      else if (tipoFila === 'expense') {
        const gastos = await this.getPendingMovementsByHorizon(projectId, days, 'gasto');
        const total = gastos.reduce((sum, m) => sum + Number(m.amount_ars || m.amount || 0), 0);
        return { gastos, total };
      } 
      else if (tipoFila === 'net') {
        const [ingresos, gastos] = await Promise.all([
          this.getPendingMovementsByHorizon(projectId, days, 'ingreso'),
          this.getPendingMovementsByHorizon(projectId, days, 'gasto')
        ]);
        
        const totalIngresos = ingresos.reduce((sum, m) => sum + Number(m.amount_ars || m.amount || 0), 0);
        const totalGastos = gastos.reduce((sum, m) => sum + Number(m.amount_ars || m.amount || 0), 0);
        const neto = totalIngresos - totalGastos;

        return { ingresos, gastos, totalIngresos, totalGastos, neto };
      }

      return null;
    } catch (error) {
      console.error("Error getting pending detail:", error);
      return null;
    }
  }
};

import React, { useState, useRef, useCallback } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useToast } from '@/components/ui/use-toast';
import { importMovimientosService } from '@/services/importMovimientosService';
import { cn } from '@/lib/utils';
import {
  Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2,
  Loader2, X, ChevronRight, ArrowRight, Edit2, Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = ['upload', 'preview', 'config'];

const ImportMovementsModal = ({
  isOpen,
  onClose,
  onSuccess,
  projects = [],
  accounts = [],
  providers = []
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  // State
  const [step, setStep] = useState('upload');
  const [rawRows, setRawRows] = useState([]);
  const [validatedRows, setValidatedRows] = useState([]);
  const [editingCell, setEditingCell] = useState(null);
  const [importing, setImporting] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedCuentaId, setSelectedCuentaId] = useState('');

  const catalogs = { accounts, projects, providers };

  const resetState = () => {
    setStep('upload');
    setRawRows([]);
    setValidatedRows([]);
    setEditingCell(null);
    setImporting(false);
    setSelectedProjectId('');
    setSelectedCuentaId('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // --- STEP 1: Download Template ---
  const handleDownloadTemplate = () => {
    const csv = importMovimientosService.getTemplateCSV();
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla_movimientos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- STEP 1: Parse File ---
  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      rows.push(row);
    }

    return rows;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let rows = [];

      if (file.name.endsWith('.csv') || file.name.endsWith('.txt')) {
        const text = await file.text();
        rows = parseCSV(text);
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        // Para xlsx usamos SheetJS (disponible via CDN en el proyecto)
        toast({
          variant: 'destructive',
          title: 'Formato no soportado aún',
          description: 'Por ahora usá CSV. Soporte XLSX próximamente.'
        });
        return;
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Formato no soportado. Usá CSV.' });
        return;
      }

      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'El archivo está vacío o tiene formato incorrecto.' });
        return;
      }

      setRawRows(rows);
      const validated = importMovimientosService.validateAll(rows, catalogs);
      setValidatedRows(validated);
      setStep('preview');

    } catch (error) {
      console.error('Error parsing file:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
    }
  };

  // --- STEP 2: Inline Editing ---
  const updateRow = (rowIndex, field, value) => {
    const updated = [...validatedRows];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    // Re-validate
    updated[rowIndex]._validation = importMovimientosService.validateRow(updated[rowIndex], rowIndex, catalogs);
    setValidatedRows(updated);
    setEditingCell(null);
  };

  const deleteRow = (rowIndex) => {
    setValidatedRows(prev => prev.filter((_, i) => i !== rowIndex));
  };

  const totalErrors = validatedRows.filter(r => !r._validation?.isValid).length;
  const totalValid = validatedRows.filter(r => r._validation?.isValid).length;

  // --- STEP 3: Import ---
  const handleImport = async () => {
    if (totalErrors > 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Corregí los errores antes de importar.' });
      return;
    }

    setImporting(true);
    try {
      // Resolver IDs
      const resolvedRows = validatedRows.map(row =>
        importMovimientosService.resolveIds(row, catalogs)
      );

      const result = await importMovimientosService.bulkCreate(
        resolvedRows,
        selectedProjectId || null,
        selectedCuentaId || null
      );

      toast({
        title: 'Importación exitosa',
        description: `Se importaron ${result.count} movimientos.`,
        className: 'border-green-500'
      });

      handleClose();
      onSuccess?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setImporting(false);
    }
  };

  // --- RENDER ---
  const fields = ['descripcion', 'monto_ars', 'tipo', 'fecha'];
  const fieldLabels = {
    descripcion: 'Descripción',
    monto_ars: 'Importe',
    tipo: 'Tipo',
    fecha: 'Fecha',
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Importar Movimientos
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Descargá la plantilla, completala y subila para importar movimientos.'}
            {step === 'preview' && 'Revisá y corregí los datos antes de importar.'}
            {step === 'config' && 'Configurá las opciones de importación.'}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2 py-2 px-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s}>
              <div className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-colors',
                step === s
                  ? 'bg-blue-600 text-white'
                  : STEPS.indexOf(step) > i
                    ? 'bg-green-100 text-green-700'
                    : 'bg-slate-100 text-slate-400'
              )}>
                <span>{i + 1}</span>
                <span className="hidden sm:inline">
                  {s === 'upload' ? 'Subir' : s === 'preview' ? 'Revisar' : 'Importar'}
                </span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6">
              <div className="text-center space-y-2">
                <Upload className="w-16 h-16 text-slate-300 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Subí tu archivo de movimientos
                </h3>
                <p className="text-sm text-slate-500 max-w-md">
                  Primero descargá la plantilla CSV, completala con tus datos,
                  y luego subila aquí. Los campos obligatorios son descripción e importe.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" /> Descargar Plantilla
                </Button>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" /> Subir Archivo
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                className="hidden"
                onChange={handleFileUpload}
              />

              <p className="text-[10px] text-slate-400">Formatos aceptados: CSV</p>
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="gap-1 border-green-200 text-green-700 bg-green-50">
                    <CheckCircle2 className="w-3 h-3" /> {totalValid} válidos
                  </Badge>
                  {totalErrors > 0 && (
                    <Badge variant="outline" className="gap-1 border-red-200 text-red-700 bg-red-50">
                      <AlertCircle className="w-3 h-3" /> {totalErrors} con errores
                    </Badge>
                  )}
                  <span className="text-xs text-slate-400">{validatedRows.length} filas total</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                  Cambiar archivo
                </Button>
              </div>

              {/* Data Table */}
              <div className="border rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10">
                      <tr>
                        <th className="px-2 py-2 text-left font-bold text-slate-500 w-8">#</th>
                        {fields.map(f => (
                          <th key={f} className="px-2 py-2 text-left font-bold text-slate-500 whitespace-nowrap">
                            {fieldLabels[f]}
                            {(f === 'descripcion' || f === 'monto_ars') && (
                              <span className="text-red-400 ml-0.5">*</span>
                            )}
                          </th>
                        ))}
                        <th className="px-2 py-2 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validatedRows.map((row, idx) => {
                        const errors = row._validation?.errors || {};
                        const hasErrors = !row._validation?.isValid;

                        return (
                          <tr
                            key={idx}
                            className={cn(
                              'hover:bg-slate-50/50',
                              hasErrors && 'bg-red-50/30 dark:bg-red-950/10'
                            )}
                          >
                            <td className="px-2 py-1.5 text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            {fields.map(field => {
                              const hasError = !!errors[field];
                              const isEditing = editingCell?.row === idx && editingCell?.field === field;

                              return (
                                <td
                                  key={field}
                                  className={cn(
                                    'px-2 py-1.5 relative cursor-pointer',
                                    hasError && 'bg-red-50 dark:bg-red-950/20'
                                  )}
                                  onClick={() => setEditingCell({ row: idx, field })}
                                  title={hasError ? errors[field] : undefined}
                                >
                                  {isEditing ? (
                                    <input
                                      autoFocus
                                      className="w-full px-1 py-0.5 text-xs border border-blue-400 rounded bg-white outline-none"
                                      defaultValue={row[field] || ''}
                                      onBlur={(e) => updateRow(idx, field, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateRow(idx, field, e.target.value);
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                    />
                                  ) : (
                                    <span className={cn(
                                      'block truncate max-w-[120px]',
                                      hasError && 'text-red-600 font-bold',
                                      field === 'monto_ars' && 'font-mono'
                                    )}>
                                      {row[field] || <span className="text-slate-300">—</span>}
                                    </span>
                                  )}
                                  {hasError && !isEditing && (
                                    <AlertCircle className="w-3 h-3 text-red-500 absolute top-1 right-1" />
                                  )}
                                </td>
                              );
                            })}
                            <td className="px-2 py-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-600"
                                onClick={() => deleteRow(idx)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalErrors > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  Hacé click en las celdas con error para editarlas directamente.
                </div>
              )}
            </div>
          )}

          {/* STEP: CONFIG */}
          {step === 'config' && (
            <div className="space-y-6 py-4 max-w-lg mx-auto">
              <div className="space-y-2">
                <Label className="font-bold">Proyecto destino (opcional)</Label>
                <p className="text-xs text-slate-400">
                  Si seleccionás un proyecto, todos los movimientos se asignarán a él
                  (a menos que el archivo especifique otro).
                </p>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger><SelectValue placeholder="Sin proyecto por defecto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Cuenta destino (opcional)</Label>
                <p className="text-xs text-slate-400">
                  Cuenta por defecto para movimientos que no la especifiquen.
                </p>
                <Select value={selectedCuentaId} onValueChange={setSelectedCuentaId}>
                  <SelectTrigger><SelectValue placeholder="Sin cuenta por defecto" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin cuenta</SelectItem>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.titulo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300">Resumen</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-slate-500">Total movimientos:</span>
                  <span className="font-bold">{validatedRows.length}</span>
                  <span className="text-slate-500">Estado inicial:</span>
                  <span className="font-bold">PENDIENTE</span>
                  <span className="text-slate-500">Proyecto:</span>
                  <span className="font-bold">
                    {selectedProjectId && selectedProjectId !== 'none'
                      ? projects.find(p => p.id === selectedProjectId)?.name || 'N/A'
                      : 'Sin asignar'
                    }
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Button variant="ghost" onClick={handleClose}>Cancelar</Button>

          <div className="flex gap-2">
            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={() => setStep('upload')}>Atrás</Button>
                <Button
                  onClick={() => setStep('config')}
                  disabled={totalErrors > 0}
                  className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                >
                  Siguiente <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
            {step === 'config' && (
              <>
                <Button variant="outline" onClick={() => setStep('preview')}>Atrás</Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full px-6"
                >
                  {importing
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <CheckCircle2 className="w-4 h-4" />
                  }
                  Importar {validatedRows.length} movimientos
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportMovementsModal;

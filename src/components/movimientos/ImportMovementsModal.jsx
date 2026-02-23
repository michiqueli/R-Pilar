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

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
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
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Formato no soportado. Usá CSV.' });
        return;
      }
      if (rows.length === 0) {
        toast({ variant: 'destructive', title: 'Error', description: 'El archivo está vacío.' });
        return;
      }
      setRawRows(rows);
      const validated = importMovimientosService.validateAll(rows, catalogs);
      setValidatedRows(validated);
      setStep('preview');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
    }
  };

  const updateRow = (rowIndex, field, value) => {
    const updated = [...validatedRows];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    updated[rowIndex]._validation = importMovimientosService.validateRow(updated[rowIndex], rowIndex, catalogs);
    setValidatedRows(updated);
    setEditingCell(null);
  };

  const deleteRow = (rowIndex) => {
    setValidatedRows(prev => prev.filter((_, i) => i !== rowIndex));
  };

  const totalErrors = validatedRows.filter(r => !r._validation?.isValid).length;
  const totalValid = validatedRows.filter(r => r._validation?.isValid).length;

  const handleImport = async () => {
    if (totalErrors > 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'Corregí los errores antes de importar.' });
      return;
    }
    setImporting(true);
    try {
      const resolvedRows = validatedRows.map(row => importMovimientosService.resolveIds(row, catalogs));
      const result = await importMovimientosService.bulkCreate(resolvedRows, selectedProjectId || null, selectedCuentaId || null);
      toast({ title: 'Importación exitosa', description: `Se importaron ${result.count} movimientos.`, className: 'bg-green-50 dark:bg-green-900/20 border-green-500' });
      handleClose();
      onSuccess?.();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setImporting(false);
    }
  };

  const fields = ['descripcion', 'monto_ars', 'tipo', 'fecha'];
  const fieldLabels = { descripcion: 'Descripción', monto_ars: 'Importe', tipo: 'Tipo', fecha: 'Fecha' };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            Importar Movimientos
          </DialogTitle>
          <DialogDescription className="dark:text-slate-400">
            {step === 'upload' && 'Descargá la plantilla, completala y subila.'}
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
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
              )}>
                <span>{i + 1}</span>
                <span className="hidden sm:inline">
                  {s === 'upload' ? 'Subir' : s === 'preview' ? 'Revisar' : 'Importar'}
                </span>
              </div>
              {i < STEPS.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 px-1">
          {/* STEP: UPLOAD */}
          {step === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12 gap-6 bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Upload className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Subí tu archivo de movimientos</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">Los campos obligatorios son descripción e importe.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 dark:border-slate-700 dark:text-slate-300">
                  <Download className="w-4 h-4" /> Plantilla CSV
                </Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-4 h-4" /> Subir Archivo
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {/* STEP: PREVIEW */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="gap-1 border-green-200 text-green-700 bg-green-50 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900">
                    <CheckCircle2 className="w-3 h-3" /> {totalValid} válidos
                  </Badge>
                  {totalErrors > 0 && (
                    <Badge variant="outline" className="gap-1 border-red-200 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900">
                      <AlertCircle className="w-3 h-3" /> {totalErrors} errores
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setStep('upload')} className="text-xs text-slate-500 hover:text-blue-600">Cambiar archivo</Button>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[400px]">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950 sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-3 text-left font-bold text-slate-500 uppercase tracking-tighter w-8">#</th>
                        {fields.map(f => (
                          <th key={f} className="px-3 py-3 text-left font-bold text-slate-500 uppercase tracking-tighter">
                            {fieldLabels[f]} {(f === 'descripcion' || f === 'monto_ars') && <span className="text-red-400">*</span>}
                          </th>
                        ))}
                        <th className="px-3 py-3 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {validatedRows.map((row, idx) => {
                        const errors = row._validation?.errors || {};
                        const hasErrors = !row._validation?.isValid;
                        return (
                          <tr key={idx} className={cn('transition-colors', hasErrors ? 'bg-red-50/30 dark:bg-red-950/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30')}>
                            <td className="px-3 py-2 text-slate-400 font-mono text-[10px]">{idx + 1}</td>
                            {fields.map(field => {
                              const hasError = !!errors[field];
                              const isEditing = editingCell?.row === idx && editingCell?.field === field;
                              return (
                                <td key={field} className={cn('px-3 py-2 relative cursor-pointer group', hasError && 'bg-red-50 dark:bg-red-900/20')} onClick={() => setEditingCell({ row: idx, field })}>
                                  {isEditing ? (
                                    <input
                                      autoFocus
                                      className="w-full px-2 py-1 text-xs border border-blue-500 rounded bg-white dark:bg-slate-800 dark:text-white outline-none ring-2 ring-blue-500/20"
                                      defaultValue={row[field] || ''}
                                      onBlur={(e) => updateRow(idx, field, e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') updateRow(idx, field, e.target.value);
                                        if (e.key === 'Escape') setEditingCell(null);
                                      }}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <span className={cn('block truncate max-w-[150px] dark:text-slate-300', hasError && 'text-red-600 dark:text-red-400 font-bold')}>
                                        {row[field] || <span className="text-slate-300 dark:text-slate-600">—</span>}
                                      </span>
                                      <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  )}
                                  {hasError && !isEditing && <AlertCircle className="w-3 h-3 text-red-500 absolute top-1 right-1" />}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => deleteRow(idx)}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              {totalErrors > 0 && (
                <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-100 dark:border-red-900/30">
                  <AlertCircle className="w-4 h-4" /> Hacé click en cualquier celda para corregir los datos.
                </div>
              )}
            </div>
          )}

          {/* STEP: CONFIG */}
          {step === 'config' && (
            <div className="space-y-6 py-4 max-w-lg mx-auto">
              <div className="space-y-3">
                <Label className="font-bold dark:text-slate-200 text-sm">Proyecto destino (opcional)</Label>
                <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><SelectValue placeholder="Sin proyecto por defecto" /></SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectItem value="none">Sin proyecto</SelectItem>
                    {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="font-bold dark:text-slate-200 text-sm">Cuenta destino (opcional)</Label>
                <Select value={selectedCuentaId} onValueChange={setSelectedCuentaId}>
                  <SelectTrigger className="dark:bg-slate-800 dark:border-slate-700 dark:text-white"><SelectValue placeholder="Sin cuenta por defecto" /></SelectTrigger>
                  <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                    <SelectItem value="none">Sin cuenta</SelectItem>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.titulo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-5 border border-blue-100 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-4">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider">Resumen de Importación</span>
                </div>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-slate-500 dark:text-slate-400">Total movimientos:</span>
                  <span className="font-bold text-slate-900 dark:text-white text-right">{validatedRows.length}</span>
                  <span className="text-slate-500 dark:text-slate-400">Estado inicial:</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400 text-right uppercase text-xs">PENDIENTE</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mt-2">
          <Button variant="ghost" onClick={handleClose} className="dark:text-slate-400">Cancelar</Button>
          <div className="flex gap-2">
            {step === 'preview' && (
              <>
                <Button variant="outline" onClick={() => setStep('upload')} className="dark:border-slate-700 dark:text-slate-300">Atrás</Button>
                <Button onClick={() => setStep('config')} disabled={totalErrors > 0} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 rounded-full px-6 shadow-md shadow-blue-500/20">
                  Siguiente <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}
            {step === 'config' && (
              <>
                <Button variant="outline" onClick={() => setStep('preview')} className="dark:border-slate-700 dark:text-slate-300">Atrás</Button>
                <Button onClick={handleImport} disabled={importing} className="bg-green-600 hover:bg-green-700 text-white gap-2 rounded-full px-8 shadow-md shadow-green-500/20">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar Importación
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

import React, { useState } from 'react';
import { Plus, FileText, ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import ProviderStatementModal from '@/components/providers/modals/ProviderStatementModal';

function ProviderStatementsTab({ providerId, statements, onRefresh }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper to format YYYY-MM-DD to Month Year
  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Statement
        </Button>
      </div>

      {statements.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="text-slate-600">No account statements available.</p>
          <p className="text-sm text-slate-400 mt-1">Upload monthly statements to keep track.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {statements.map((statement, index) => (
            <motion.div
              key={statement.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 capitalize">
                      {formatMonthYear(statement.statement_month)}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {statement.statement_month}
                    </p>
                  </div>
                </div>
              </div>
              
              {statement.notes && (
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {statement.notes}
                </p>
              )}

              {statement.file_url ? (
                <a 
                  href={statement.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-auto"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Document
                </a>
              ) : (
                <span className="text-sm text-slate-400 italic">No file attached</span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <ProviderStatementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
        providerId={providerId}
      />
    </div>
  );
}

export default ProviderStatementsTab;

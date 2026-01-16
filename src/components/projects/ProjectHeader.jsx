
import React from 'react';
import { Edit, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/dateUtils';

const STATUS_COLORS = {
  ACTIVO: 'bg-green-100 text-green-800 border-green-200',
  PAUSADO: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FINALIZADO: 'bg-slate-100 text-slate-800 border-slate-200'
};

function ProjectHeader({ project, onEdit }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${STATUS_COLORS[project.status]}`}>
              {project.status}
            </span>
          </div>
          {project.code && (
            <p className="text-slate-500 mb-2">Code: {project.code}</p>
          )}
        </div>
        <Button
          onClick={onEdit}
          variant="outline"
          className="text-blue-600 border-blue-600 hover:bg-blue-50"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {project.client_name && (
          <div className="flex items-center gap-2 text-slate-700">
            <User className="w-4 h-4 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Client</p>
              <p className="font-medium">{project.client_name}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Start Date</p>
            <p className="font-medium">
              {project.start_date ? formatDate(project.start_date) : 'Not set'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-700">
          <div className="w-4 h-4 flex items-center justify-center text-slate-400 font-bold">
            {project.base_currency[0]}
          </div>
          <div>
            <p className="text-xs text-slate-500">Base Currency</p>
            <p className="font-medium">{project.base_currency}</p>
          </div>
        </div>
      </div>

      {project.notes && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-500 mb-1">Notes</p>
          <p className="text-slate-700">{project.notes}</p>
        </div>
      )}
    </div>
  );
}

export default ProjectHeader;

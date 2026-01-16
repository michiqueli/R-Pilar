
import React from 'react';
import { motion } from 'framer-motion';
import { Home, FolderKanban, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100"
      >
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Página no encontrada</h1>
        <p className="text-slate-500 mb-8">
          Lo sentimos, la página o recurso que estás buscando no existe o ha sido movido.
        </p>

        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            onClick={() => navigate('/')}
            className="w-full justify-center rounded-xl h-12 text-base shadow-lg shadow-blue-200"
          >
            <Home className="w-5 h-5 mr-2" />
            Ir a Inicio
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => navigate('/projects')}
            className="w-full justify-center rounded-xl h-12 text-base hover:bg-slate-50"
          >
            <FolderKanban className="w-5 h-5 mr-2" />
            Volver a Proyectos
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;

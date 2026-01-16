
import React, { useState } from 'react';
import { FileText, Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/contexts/ThemeProvider';
import usePageTitle from '@/hooks/usePageTitle';

const InformesPage = () => {
  usePageTitle('Informes');
  const { t } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [informes, setInformes] = useState([]);

  const handleCreate = () => {
    // Placeholder for future functionality
    console.log("Create new report");
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <PageHeader 
        title={t('informes.titulo')} 
        description={t('informes.descripcion')}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            {t('informes.nuevo')}
          </Button>
        }
      />

      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">{t('common.loading')}</div>
          </div>
        ) : informes.length === 0 ? (
          <Card className="flex flex-col items-center justify-center h-[400px] border-dashed">
            <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              {t('informes.noHay')}
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm text-center">
              {t('informes.descripcion')}
            </p>
            <Button variant="outline" className="mt-6" onClick={handleCreate}>
              {t('informes.crear')}
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Report cards would go here */}
          </div>
        )}
      </div>
    </div>
  );
};

export default InformesPage;


import { useEffect } from 'react';

const usePageTitle = (title) => {
  useEffect(() => {
    document.title = `${title} - Kaisha SRL`;
  }, [title]);
};

export default usePageTitle;

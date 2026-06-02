import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AppDialog } from '../components/m3/AppDialog';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const hideDialog = useCallback(() => setDialog(null), []);

  const showDialog = useCallback((config) => {
    setDialog({
      variant: 'info',
      buttons: [{ text: 'Entendido', style: 'primary' }],
      ...config,
    });
  }, []);

  const value = useMemo(() => ({ showDialog, hideDialog }), [showDialog, hideDialog]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      {dialog ? (
        <AppDialog
          visible
          title={dialog.title}
          message={dialog.message}
          variant={dialog.variant}
          buttons={dialog.buttons}
          onDismiss={hideDialog}
        />
      ) : null}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const ctx = useContext(DialogContext);
  if (!ctx) {
    throw new Error('useDialog debe usarse dentro de DialogProvider');
  }
  return ctx;
}

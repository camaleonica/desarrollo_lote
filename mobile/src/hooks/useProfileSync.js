import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useDialog } from '../context/DialogContext';

/**
 * Refresca el perfil al entrar a una pantalla y avisa si el KYC pasó a aprobado.
 */
export function useProfileSync({ notifyOnKycApproval = false } = {}) {
  const { isGuest, refreshUser } = useAuth();
  const { showDialog } = useDialog();
  const prevKycRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      if (isGuest) return undefined;

      let active = true;
      (async () => {
        const profile = await refreshUser();
        if (!active || !profile) return;

        if (
          notifyOnKycApproval
          && prevKycRef.current === 'submitted'
          && profile.kyc_status === 'approved'
        ) {
          showDialog({
            title: '¡Cuenta verificada!',
            message:
              'Un empleado aprobó tu identidad. Ya podés participar en las subastas habilitadas para tu categoría.',
            variant: 'success',
          });
        }

        prevKycRef.current = profile.kyc_status;
      })();

      return () => {
        active = false;
      };
    }, [isGuest, refreshUser, notifyOnKycApproval, showDialog])
  );
}

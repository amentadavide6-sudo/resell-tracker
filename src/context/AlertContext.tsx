import React, { createContext, useContext, useState, useCallback } from 'react';
import { CustomAlertModal, AlertButton } from '../components/CustomAlertModal';
import { Ionicons } from '@expo/vector-icons';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

export interface ShowAlertOptions {
  title: string;
  message: string;
  type?: AlertType;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: ShowAlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
  hideAlert: () => {},
});

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ShowAlertOptions & { visible: boolean }>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = useCallback((options: ShowAlertOptions) => {
    let icon = options.icon;
    let iconColor = options.iconColor;
    let iconBgColor = options.iconBgColor;

    if (!icon) {
      switch (options.type) {
        case 'success':
          icon = 'checkmark-circle';
          iconColor = iconColor || '#10B981';
          iconBgColor = iconBgColor || '#D1FAE5';
          break;
        case 'warning':
          icon = 'warning';
          iconColor = iconColor || '#F59E0B';
          iconBgColor = iconBgColor || '#FEF3C7';
          break;
        case 'error':
          icon = 'alert-circle';
          iconColor = iconColor || '#EF4444';
          iconBgColor = iconBgColor || '#FEE2E2';
          break;
        case 'info':
        default:
          icon = 'information-circle';
          iconColor = iconColor || '#6366F1';
          iconBgColor = iconBgColor || '#EEF2FF';
          break;
      }
    }

    setConfig({
      ...options,
      icon,
      iconColor,
      iconBgColor,
      visible: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setConfig((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      <CustomAlertModal config={config} onClose={hideAlert} />
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);

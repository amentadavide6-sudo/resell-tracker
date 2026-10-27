import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
  onPress?: () => void;
}

export interface CustomAlertConfig {
  visible: boolean;
  title: string;
  message: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBgColor?: string;
  buttons?: AlertButton[];
}

interface CustomAlertModalProps {
  config: CustomAlertConfig;
  onClose: () => void;
}

export const CustomAlertModal: React.FC<CustomAlertModalProps> = ({ config, onClose }) => {
  const { colors, isDark } = useTheme();

  if (!config.visible) return null;

  const defaultIcon = config.icon || 'alert-circle';
  const defaultIconColor = config.iconColor || (isDark ? '#818CF8' : '#6366F1');
  const defaultIconBg = config.iconBgColor || (isDark ? '#1E1B4B' : '#EEF2FF');

  return (
    <Modal
      visible={config.visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.dialogContainer,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Top Icon Pill */}
          <View style={[styles.iconWrap, { backgroundColor: defaultIconBg }]}>
            <Ionicons name={defaultIcon} size={28} color={defaultIconColor} />
          </View>

          {/* Title & Message */}
          <Text style={[styles.title, { color: colors.textPrimary }]}>{config.title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{config.message}</Text>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {config.buttons && config.buttons.length > 0 ? (
              config.buttons.map((btn, index) => {
                const isPrimary = btn.style === 'primary' || (!btn.style && index === config.buttons!.length - 1);
                const isDestructive = btn.style === 'destructive';
                const isCancel = btn.style === 'cancel';

                let btnBg = isDark ? '#1E293B' : '#F1F5F9';
                let btnText = colors.textPrimary;

                if (isPrimary) {
                  btnBg = '#6366F1';
                  btnText = '#FFFFFF';
                } else if (isDestructive) {
                  btnBg = isDark ? '#450A0A' : '#FEE2E2';
                  btnText = isDark ? '#F87171' : '#DC2626';
                } else if (isCancel) {
                  btnBg = 'transparent';
                  btnText = colors.textMuted;
                }

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.btn,
                      { backgroundColor: btnBg },
                      isCancel && styles.cancelBtn,
                    ]}
                    onPress={() => {
                      onClose();
                      if (btn.onPress) btn.onPress();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        { color: btnText },
                        isPrimary && { fontWeight: '800' },
                        isDestructive && { fontWeight: '700' },
                      ]}
                    >
                      {btn.text}
                    </Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <TouchableOpacity
                style={[styles.btn, { backgroundColor: '#6366F1' }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '800' }]}>
                  Ho capito
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  actionsContainer: {
    width: '100%',
    gap: 8,
  },
  btn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

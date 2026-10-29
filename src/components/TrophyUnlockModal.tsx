import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TrophyStatus } from '../services/achievements';
import { useTheme } from '../context/ThemeContext';

interface TrophyUnlockModalProps {
  trophy: TrophyStatus | null;
  visible: boolean;
  onClose: () => void;
  onShare: (trophy: TrophyStatus) => void;
}

export const TrophyUnlockModal: React.FC<TrophyUnlockModalProps> = ({
  trophy,
  visible,
  onClose,
  onShare,
}) => {
  const { colors, isDark } = useTheme();

  if (!visible || !trophy) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.card, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: trophy.badgeColor }]}>
          {/* Confetti / celebration pill */}
          <View style={styles.celebrationPill}>
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.celebrationPillText}>NUOVO TROFEO SBLOCCATO!</Text>
          </View>

          {/* Glowing Trophy Icon */}
          <View style={[styles.iconWrap, { borderColor: trophy.badgeColor, backgroundColor: `${trophy.badgeColor}22` }]}>
            <Ionicons name={trophy.icon as any} size={44} color={trophy.badgeColor} />
          </View>

          <Text style={[styles.trophyTitle, { color: colors.textPrimary }]}>{trophy.title}</Text>
          <Text style={[styles.trophyDesc, { color: colors.textSecondary }]}>{trophy.description}</Text>

          <View style={styles.xpPill}>
            <Ionicons name="star" size={14} color="#000000" />
            <Text style={styles.xpPillText}>+{trophy.xpReward} XP Aggiunti al Profilo</Text>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() => {
              onClose();
              onShare(trophy);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-instagram" size={18} color="#FFFFFF" />
            <Text style={styles.shareBtnText}>Condividi Storia su Instagram 🚀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.continueBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={[styles.continueBtnText, { color: colors.textSecondary }]}>Continua</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 2,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  celebrationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    marginBottom: 16,
  },
  celebrationPillText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  iconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trophyTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
  },
  trophyDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 10,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 20,
  },
  xpPillText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '900',
  },
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E1306C',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 8,
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  continueBtn: {
    paddingVertical: 8,
  },
  continueBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

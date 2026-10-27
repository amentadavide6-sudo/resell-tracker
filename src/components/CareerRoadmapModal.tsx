import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LEVELS, LevelInfo } from '../services/gamification';
import { isProUser } from '../services/proManager';
import { useTheme } from '../context/ThemeContext';

interface CareerRoadmapModalProps {
  visible: boolean;
  currentLevelInfo: LevelInfo;
  onClose: () => void;
  onOpenProModal?: () => void;
}

export const CareerRoadmapModal: React.FC<CareerRoadmapModalProps> = ({
  visible,
  currentLevelInfo,
  onClose,
  onOpenProModal,
}) => {
  const { colors, isDark } = useTheme();
  const isPro = isProUser();

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { borderBottomColor: colors.cardBorder }]}>
          <View>
            <Text style={[styles.topSub, { color: colors.primary }]}>ROADMAP RESELLER CLUB</Text>
            <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Carriera & Livelli 🏆</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Rank Hero Card */}
          <View
            style={[
              styles.currentHeroCard,
              { backgroundColor: colors.card, borderColor: currentLevelInfo.badgeColor },
            ]}
          >
            <View style={styles.heroRow}>
              <Text style={styles.heroBadge}>{currentLevelInfo.badge}</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.heroLevelTitle, { color: colors.textPrimary }]}>
                    {currentLevelInfo.title}
                  </Text>
                  {isPro && (
                    <View style={styles.proBoostPill}>
                      <Text style={styles.proBoostText}>2x XP ⚡</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.heroLevelDesc, { color: colors.textSecondary }]}>
                  {currentLevelInfo.description}
                </Text>
              </View>
              <View style={styles.heroXpCol}>
                <Text style={[styles.heroXpVal, { color: colors.primary }]}>
                  {currentLevelInfo.currentXP}
                </Text>
                <Text style={[styles.heroXpLabel, { color: colors.textMuted }]}>XP TOTALI</Text>
              </View>
            </View>

            {/* Progress to next level */}
            <View style={styles.heroProgressWrap}>
              <View style={[styles.heroProgressTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <View
                  style={[
                    styles.heroProgressFill,
                    {
                      width: `${Math.round(currentLevelInfo.progress * 100)}%`,
                      backgroundColor: currentLevelInfo.badgeColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.heroNextText, { color: colors.textMuted }]}>
                {currentLevelInfo.nextLevelTitle
                  ? `Mancano ${currentLevelInfo.xpToNextLevel} XP a "${currentLevelInfo.nextLevelTitle}"`
                  : '👑 Hai raggiunto il vertice supremo del Reselling!'}
              </Text>
            </View>
          </View>

          {/* XP Rewards Guide */}
          <View style={[styles.xpGuideCard, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF', borderColor: '#818CF8' }]}>
            <Text style={[styles.xpGuideTitle, { color: colors.textPrimary }]}>Come guadagnare punti XP:</Text>
            <View style={styles.xpGuideGrid}>
              <View style={styles.xpGuideItem}>
                <Text style={styles.xpRewardBadge}>+{isPro ? '50' : '25'} XP</Text>
                <Text style={[styles.xpRewardLabel, { color: colors.textSecondary }]}>Capo inserito</Text>
              </View>
              <View style={styles.xpGuideItem}>
                <Text style={[styles.xpRewardBadge, { color: '#059669' }]}>+{isPro ? '200' : '100'} XP</Text>
                <Text style={[styles.xpRewardLabel, { color: colors.textSecondary }]}>Vendita conclusa</Text>
              </View>
              <View style={styles.xpGuideItem}>
                <Text style={[styles.xpRewardBadge, { color: '#D97706' }]}>+{isPro ? '100' : '50'} XP</Text>
                <Text style={[styles.xpRewardLabel, { color: colors.textSecondary }]}>Export Excel</Text>
              </View>
              <View style={styles.xpGuideItem}>
                <Text style={[styles.xpRewardBadge, { color: '#8B5CF6' }]}>+{isPro ? '100' : '50'} XP</Text>
                <Text style={[styles.xpRewardLabel, { color: colors.textSecondary }]}>Backup locale</Text>
              </View>
            </View>

            {!isPro && onOpenProModal && (
              <TouchableOpacity
                style={styles.proBoostBanner}
                onPress={() => {
                  onClose();
                  onOpenProModal();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={16} color="#D97706" />
                <Text style={styles.proBoostBannerText}>
                  Passa a Pro per raddoppiare ogni singolo XP (2x Booster permanente ⚡)
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 10 Levels Timeline */}
          <Text style={[styles.timelineHeader, { color: colors.textPrimary }]}>
            Tutti i 10 Livelli della Carriera:
          </Text>

          <View style={styles.levelsList}>
            {LEVELS.map((lvl) => {
              const isCurrent = lvl.levelNumber === currentLevelInfo.levelNumber;
              const isUnlocked = currentLevelInfo.currentXP >= lvl.minXP;

              return (
                <View
                  key={lvl.levelNumber}
                  style={[
                    styles.levelItemCard,
                    { backgroundColor: colors.card, borderColor: colors.cardBorder },
                    isCurrent && styles.levelItemCurrent,
                    isCurrent && { borderColor: lvl.badgeColor },
                  ]}
                >
                  <View style={styles.levelLeft}>
                    <Text style={styles.levelBadgeIcon}>{lvl.badge}</Text>
                    <View style={styles.levelNumberPill}>
                      <Text style={styles.levelNumberText}>Lvl {lvl.levelNumber}</Text>
                    </View>
                  </View>

                  <View style={styles.levelMid}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.lvlTitle, { color: colors.textPrimary }]}>
                        {lvl.title}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.currentTag, { backgroundColor: lvl.badgeColor }]}>
                          <Text style={styles.currentTagText}>TU SEI QUI</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.lvlDesc, { color: colors.textSecondary }]}>
                      {lvl.description}
                    </Text>
                  </View>

                  <View style={styles.levelRight}>
                    <Text style={[styles.lvlXpReq, { color: isUnlocked ? colors.primary : colors.textMuted }]}>
                      {lvl.minXP} XP
                    </Text>
                    {isUnlocked ? (
                      <View style={styles.unlockedIconWrap}>
                        <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      </View>
                    ) : (
                      <View style={styles.lockedIconWrap}>
                        <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  topSub: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  topTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  closeBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  currentHeroCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroBadge: {
    fontSize: 34,
  },
  heroLevelTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  heroLevelDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  heroXpCol: {
    alignItems: 'flex-end',
  },
  heroXpVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  heroXpLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  heroProgressWrap: {
    marginTop: 14,
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  heroProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  heroNextText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'center',
  },
  proBoostPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  proBoostText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  xpGuideCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 18,
  },
  xpGuideTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 10,
  },
  xpGuideGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  xpGuideItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    paddingVertical: 8,
    borderRadius: 8,
  },
  xpRewardBadge: {
    fontSize: 13,
    fontWeight: '900',
    color: '#4F46E5',
  },
  xpRewardLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  proBoostBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 10,
    gap: 6,
  },
  proBoostBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E',
    flex: 1,
  },
  timelineHeader: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 12,
  },
  levelsList: {
    gap: 8,
  },
  levelItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  levelItemCurrent: {
    borderWidth: 2,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  levelLeft: {
    alignItems: 'center',
    width: 44,
  },
  levelBadgeIcon: {
    fontSize: 26,
  },
  levelNumberPill: {
    backgroundColor: 'rgba(100, 116, 139, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 3,
  },
  levelNumberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
  },
  levelMid: {
    flex: 1,
  },
  lvlTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  lvlDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  currentTag: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentTagText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  levelRight: {
    alignItems: 'flex-end',
    width: 58,
  },
  lvlXpReq: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  unlockedIconWrap: {
    marginTop: 2,
  },
  lockedIconWrap: {
    marginTop: 2,
  },
});

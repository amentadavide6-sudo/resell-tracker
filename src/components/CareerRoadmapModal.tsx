import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLevels, LevelInfo } from '../services/gamification';
import { isProUser } from '../services/proManager';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';

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
  const { strings, language, t } = useTranslation();
  const isPro = isProUser();
  const levels = useMemo(() => getLevels(language), [language]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View style={[styles.topBar, { borderBottomColor: colors.cardBorder }]}>
          <View>
            <Text style={[styles.topSub, { color: colors.primary }]}>ROADMAP RESELLER CLUB</Text>
            <Text style={[styles.topTitle, { color: colors.textPrimary }]}>
              {strings.gamification.roadmapTitle}
            </Text>
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
                <Text style={[styles.heroXpLabel, { color: colors.textMuted }]}>{strings.gamification.xpTotal.toUpperCase()}</Text>
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
                  ? t('inventory.missingXpTo', { xp: currentLevelInfo.xpToNextLevel, next: currentLevelInfo.nextLevelTitle })
                  : strings.inventory.maxLevelReached}
              </Text>
            </View>
          </View>

          {/* XP Rewards Guide - High Contrast Modern Card */}
          <View
            style={[
              styles.xpGuideCard,
              {
                backgroundColor: isDark ? '#111827' : '#F8FAFC',
                borderColor: isDark ? '#374151' : '#E2E8F0',
              },
            ]}
          >
            <View style={styles.xpGuideHeaderRow}>
              <Ionicons name="sparkles" size={16} color={isDark ? '#F59E0B' : '#D97706'} />
              <Text style={[styles.xpGuideTitle, { color: colors.textPrimary }]}>
                {strings.gamification.xpGuideTitle}
              </Text>
            </View>

            <View style={styles.xpGuideGrid}>
              {/* Item Added */}
              <View
                style={[
                  styles.xpGuideItem,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F0F9FF',
                    borderColor: isDark ? '#374151' : '#BAE6FD',
                  },
                ]}
              >
                <Text style={[styles.xpRewardBadge, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                  +{isPro ? '50' : '25'} XP
                </Text>
                <Text
                  style={[styles.xpRewardLabel, { color: isDark ? '#E2E8F0' : '#0369A1' }]}
                  numberOfLines={1}
                >
                  {strings.gamification.itemAdded}
                </Text>
              </View>

              {/* Sale Completed */}
              <View
                style={[
                  styles.xpGuideItem,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#ECFDF5',
                    borderColor: isDark ? '#374151' : '#A7F3D0',
                  },
                ]}
              >
                <Text style={[styles.xpRewardBadge, { color: isDark ? '#34D399' : '#059669' }]}>
                  +{isPro ? '200' : '100'} XP
                </Text>
                <Text
                  style={[styles.xpRewardLabel, { color: isDark ? '#E2E8F0' : '#047857' }]}
                  numberOfLines={1}
                >
                  {strings.gamification.saleCompleted}
                </Text>
              </View>

              {/* Excel Export */}
              <View
                style={[
                  styles.xpGuideItem,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#FFFBEB',
                    borderColor: isDark ? '#374151' : '#FDE68A',
                  },
                ]}
              >
                <Text style={[styles.xpRewardBadge, { color: isDark ? '#FBBF24' : '#D97706' }]}>
                  +{isPro ? '100' : '50'} XP
                </Text>
                <Text
                  style={[styles.xpRewardLabel, { color: isDark ? '#E2E8F0' : '#B45309' }]}
                  numberOfLines={1}
                >
                  {strings.gamification.excelExport}
                </Text>
              </View>

              {/* Local Backup */}
              <View
                style={[
                  styles.xpGuideItem,
                  {
                    backgroundColor: isDark ? '#1F2937' : '#F5F3FF',
                    borderColor: isDark ? '#374151' : '#DDD6FE',
                  },
                ]}
              >
                <Text style={[styles.xpRewardBadge, { color: isDark ? '#C084FC' : '#7C3AED' }]}>
                  +{isPro ? '100' : '50'} XP
                </Text>
                <Text
                  style={[styles.xpRewardLabel, { color: isDark ? '#E2E8F0' : '#6D28D9' }]}
                  numberOfLines={1}
                >
                  {strings.gamification.localBackup}
                </Text>
              </View>
            </View>

            {!isPro && onOpenProModal && (
              <TouchableOpacity
                style={[
                  styles.proBoostBanner,
                  {
                    backgroundColor: isDark ? '#1E1B4B' : '#FEF3C7',
                    borderColor: isDark ? '#4338CA' : '#FDE68A',
                  },
                ]}
                onPress={() => {
                  onClose();
                  onOpenProModal();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={16} color={isDark ? '#F59E0B' : '#D97706'} />
                <Text
                  style={[
                    styles.proBoostBannerText,
                    { color: isDark ? '#FDE68A' : '#92400E' },
                  ]}
                >
                  {strings.gamification.proBooster}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 10 Levels Timeline */}
          <Text style={[styles.timelineHeader, { color: colors.textPrimary }]}>
            {strings.gamification.allLevels}:
          </Text>

          <View style={styles.levelsList}>
            {levels.map((lvl) => {
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
                  {/* Badge & Level Number */}
                  <View style={[styles.levelBadgeWrap, { backgroundColor: isUnlocked ? lvl.badgeColor + '20' : (isDark ? '#1E293B' : '#F1F5F9') }]}>
                    <Text style={styles.levelBadgeIcon}>{lvl.badge}</Text>
                  </View>

                  {/* Level Details */}
                  <View style={styles.levelItemInfo}>
                    <View style={styles.levelItemTitleRow}>
                      <Text
                        style={[
                          styles.levelNumberText,
                          { color: isUnlocked ? lvl.badgeColor : colors.textMuted },
                        ]}
                      >
                        {strings.gamification.levelPrefix} {lvl.levelNumber}
                      </Text>
                      {isCurrent && (
                        <View style={[styles.currentLevelPill, { backgroundColor: lvl.badgeColor }]}>
                          <Text style={styles.currentLevelPillText}>{strings.gamification.youAreHere}</Text>
                        </View>
                      )}
                      {!isUnlocked && (
                        <View style={styles.lockedPill}>
                          <Ionicons name="lock-closed" size={11} color={colors.textMuted} />
                          <Text style={[styles.lockedPillText, { color: colors.textMuted }]}>
                            {lvl.minXP} XP
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.levelNameText,
                        { color: isUnlocked ? colors.textPrimary : colors.textMuted },
                      ]}
                    >
                      {lvl.title}
                    </Text>

                    <Text style={[styles.levelDescriptionText, { color: colors.textSecondary }]}>
                      {lvl.description}
                    </Text>

                    {/* Pro Pass Reward info */}
                    <View style={styles.rewardRow}>
                      <Ionicons name="gift-outline" size={12} color="#10B981" />
                      <Text style={styles.rewardText}>
                        🎁 Sblocca +{lvl.levelNumber <= 3 ? 24 : 48} ore di Pro Pass gratis
                      </Text>
                    </View>
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
    paddingTop: 54,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  topSub: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  currentHeroCard: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
  xpGuideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  xpGuideTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  xpGuideGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  xpGuideItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  xpRewardBadge: {
    fontSize: 13,
    fontWeight: '900',
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 10,
    gap: 6,
  },
  proBoostBannerText: {
    fontSize: 11,
    fontWeight: '700',
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
  levelBadgeWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelBadgeIcon: {
    fontSize: 24,
  },
  levelItemInfo: {
    flex: 1,
  },
  levelItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  levelNumberText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  currentLevelPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentLevelPillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  lockedPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  levelNameText: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  levelDescriptionText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  rewardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
});

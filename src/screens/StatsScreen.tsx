import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { useAlert } from '../context/AlertContext';
import { computeAnalytics, AnalyticsSummary } from '../services/analytics';
import { exportInventoryToCSV } from '../services/csvExport';
import { formatEuro } from '../services/feeCalculator';
import { addXP, XP_REWARDS } from '../services/gamification';
import { isProUser, getCSVExportCount, incrementCSVExportCount } from '../services/proManager';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { getAllAvailablePlatforms } from '../services/customPlatformManager';
import {
  getAllTrophiesStatus,
  checkAndUnlockAchievements,
  computeProInsights,
  TrophyStatus,
  ProBusinessInsights,
} from '../services/achievements';
import { getUserXP, getLevelInfo, LevelInfo } from '../services/gamification';
import { TrophiesShowcase } from '../components/TrophiesShowcase';
import { StoryCardModal } from '../components/StoryCardModal';
import { TrophyUnlockModal } from '../components/TrophyUnlockModal';

export const StatsScreen: React.FC<{
  onNavigateToInventory?: () => void;
  onOpenProModal?: () => void;
}> = ({
  onNavigateToInventory,
  onOpenProModal,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { strings, t } = useTranslation();
  const { showAlert } = useAlert();
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isPro = isProUser();
  const exportCount = getCSVExportCount();
  const allPlatforms = useMemo(() => getAllAvailablePlatforms(), []);

  const [trophiesData, setTrophiesData] = useState<ReturnType<typeof getAllTrophiesStatus> | null>(null);
  const [proInsights, setProInsights] = useState<ProBusinessInsights | null>(null);
  const [userLevel, setUserLevel] = useState<LevelInfo | null>(null);
  const [unlockedTrophyPopup, setUnlockedTrophyPopup] = useState<TrophyStatus | null>(null);

  const [storyModal, setStoryModal] = useState<{
    visible: boolean;
    mode: 'trophy' | 'level' | 'deal';
    trophy?: TrophyStatus | null;
    levelInfo?: LevelInfo | null;
  }>({
    visible: false,
    mode: 'level',
  });

  const loadStats = useCallback(() => {
    try {
      const summary = computeAnalytics();
      setStats(summary);

      const newlyUnlocked = checkAndUnlockAchievements();
      if (newlyUnlocked.length > 0) {
        setUnlockedTrophyPopup(newlyUnlocked[0]);
      }
      const tData = getAllTrophiesStatus();
      setTrophiesData(tData);

      const insights = computeProInsights();
      setProInsights(insights);

      const xp = getUserXP();
      setUserLevel(getLevelInfo(xp));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleExportCSV = async () => {
    if (!isPro && exportCount >= 1) {
      showAlert({
        title: 'Esportazione Fiscale Excel & CSV',
        message:
          'Hai già usufruito del tuo 1° export dimostrativo gratuito.\n\nPassa a ResellTracker Pro per esportare registri contabili completi Excel e CSV illimitati in qualsiasi momento!',
        type: 'warning',
        buttons: [
          { text: 'Annulla', style: 'cancel' },
          {
            text: 'Passa a Pro ⚡',
            onPress: () => {
              if (onOpenProModal) onOpenProModal();
            },
          },
        ],
      });
      return;
    }

    setIsExporting(true);
    const result = await exportInventoryToCSV();
    setIsExporting(false);

    if (result.success) {
      addXP(XP_REWARDS.EXPORT_CSV, 'Esportazione CSV');
      if (!isPro && exportCount === 0) {
        incrementCSVExportCount();
        showAlert({
          title: '🎉 1° Export Gratuito Completato!',
          message:
            'Il registro Excel/CSV è stato generato e condiviso con successo.\n\nQuesto primo export completo era in omaggio: i successivi export sono illimitati con il piano ResellTracker Pro.',
          type: 'success',
        });
      }
    } else if (result.message !== 'Nessun file selezionato.') {
      showAlert({
        title: 'Esportazione Registro',
        message: result.message,
        type: 'info',
      });
    }
  };

  if (!stats) return null;

  const hasSales = stats.totalSoldItems > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{strings.stats.headerSubtitle}</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{strings.stats.headerTitle}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Profit Card */}
        <View style={[styles.heroCard, isDark && { backgroundColor: '#161F30' }]}>
          <Text style={styles.heroSubtitle}>{strings.stats.totalProfit.toUpperCase()}</Text>
          <Text style={styles.heroAmount}>{formatEuro(stats.totalNetProfit)}</Text>

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricVal}>{stats.totalSoldItems}</Text>
              <Text style={styles.heroMetricLab}>{strings.stats.itemsSold}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricVal}>{stats.averageMarginPercent}%</Text>
              <Text style={styles.heroMetricLab}>{strings.stats.avgMargin}</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricVal}>{formatEuro(stats.totalGrossRevenue)}</Text>
              <Text style={styles.heroMetricLab}>{strings.stats.totalRevenue}</Text>
            </View>
          </View>
        </View>

        {/* Capital & Potential In Unsold Goods */}
        <View style={[styles.capitalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.capitalRow}>
            <View style={styles.capitalCol}>
              <Text style={[styles.capitalLab, { color: colors.textSecondary }]}>{strings.stats.capitalInStock}</Text>
              <Text style={[styles.capitalVal, { color: colors.textPrimary }]}>{formatEuro(stats.unsoldCapital)}</Text>
              <Text style={[styles.capitalSub, { color: colors.textMuted }]}>{t('stats.itemsStillListed', { count: stats.totalActiveItems })}</Text>
            </View>
            <View style={[styles.capitalDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.capitalCol}>
              <Text style={[styles.capitalLab, { color: colors.textSecondary }]}>{strings.stats.potentialProfit}</Text>
              <Text style={[styles.capitalVal, { color: '#059669' }]}>
                {formatEuro(stats.potentialProfitUnsold)}
              </Text>
              <Text style={[styles.capitalSub, { color: colors.textMuted }]}>{strings.stats.ifSoldAtListingPrice}</Text>
            </View>
          </View>
        </View>

        {/* DAC7 European Fiscal Monitor Card */}
        <View
          style={[
            styles.dac7Card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
            stats.dac7.status === 'warning' && { borderColor: '#F59E0B' },
            stats.dac7.status === 'exceeded' && { borderColor: '#6366F1' },
          ]}
        >
          <View style={styles.dac7HeaderRow}>
            <View style={styles.dac7TitleGroup}>
              <View
                style={[
                  styles.dac7IconWrap,
                  {
                    backgroundColor:
                      stats.dac7.status === 'safe'
                        ? (isDark ? '#064E3B' : '#ECFDF5')
                        : stats.dac7.status === 'warning'
                        ? (isDark ? '#451A03' : '#FFFBEB')
                        : (isDark ? '#312E81' : '#EEF2FF'),
                  },
                ]}
              >
                <Ionicons
                  name={
                    stats.dac7.status === 'safe'
                      ? 'shield-checkmark'
                      : stats.dac7.status === 'warning'
                      ? 'alert-circle'
                      : 'document-text'
                  }
                  size={20}
                  color={
                    stats.dac7.status === 'safe'
                      ? '#10B981'
                      : stats.dac7.status === 'warning'
                      ? '#F59E0B'
                      : '#6366F1'
                  }
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dac7BadgeTitle, { color: colors.textSecondary }]}>
                  {t('stats.dac7DirectiveHeader', { year: stats.dac7.year })}
                </Text>
                <Text style={[styles.dac7MainTitle, { color: colors.textPrimary }]}>
                  {stats.dac7.status === 'safe'
                    ? strings.stats.dac7StatusBelow
                    : stats.dac7.status === 'warning'
                    ? strings.stats.dac7StatusNear
                    : strings.stats.dac7StatusOver}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.dac7StatusPill,
                {
                  backgroundColor:
                    stats.dac7.status === 'safe'
                      ? (isDark ? '#064E3B' : '#ECFDF5')
                      : stats.dac7.status === 'warning'
                      ? (isDark ? '#451A03' : '#FEF3C7')
                      : (isDark ? '#312E81' : '#EEF2FF'),
                },
              ]}
            >
              <Text
                style={[
                  styles.dac7StatusPillText,
                  {
                    color:
                      stats.dac7.status === 'safe'
                        ? '#059669'
                        : stats.dac7.status === 'warning'
                        ? '#D97706'
                        : '#6366F1',
                  },
                ]}
              >
                {stats.dac7.status === 'safe' ? strings.stats.dac7Safe : stats.dac7.status === 'warning' ? strings.stats.dac7Warning : strings.stats.dac7Report}
              </Text>
            </View>
          </View>

          <Text style={[styles.dac7Explanation, { color: colors.textSecondary }]}>
            {strings.stats.dac7ExplanationText}
          </Text>

          {/* Progress Indicators */}
          <View style={styles.dac7MetricsContainer}>
            {/* Sales Count */}
            <View style={styles.dac7MetricItem}>
              <View style={styles.dac7MetricHeader}>
                <Text style={[styles.dac7MetricLabel, { color: colors.textPrimary }]}>
                  {strings.stats.dac7SalesLabel} <Text style={{ fontWeight: '800' }}>{stats.dac7.soldCount} / {stats.dac7.maxSales}</Text>
                </Text>
                <Text style={[styles.dac7MetricRemaining, { color: colors.textMuted }]}>
                  {stats.dac7.remainingSales > 0 ? t('stats.dac7RemainingSales', { n: stats.dac7.remainingSales }) : strings.stats.dac7ThresholdReached}
                </Text>
              </View>
              <View style={[styles.dac7Track, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                <View
                  style={[
                    styles.dac7Fill,
                    {
                      width: `${Math.round(stats.dac7.salesProgress * 100)}%`,
                      backgroundColor:
                        stats.dac7.salesProgress >= 1
                          ? '#6366F1'
                          : stats.dac7.salesProgress >= 0.8
                          ? '#F59E0B'
                          : '#10B981',
                    },
                  ]}
                />
              </View>
            </View>

            {/* Gross Revenue */}
            <View style={styles.dac7MetricItem}>
              <View style={styles.dac7MetricHeader}>
                <Text style={[styles.dac7MetricLabel, { color: colors.textPrimary }]}>
                  {strings.stats.dac7RevenueLabel} <Text style={{ fontWeight: '800' }}>{formatEuro(stats.dac7.grossRevenue)} / {formatEuro(stats.dac7.maxRevenue)}</Text>
                </Text>
                <Text style={[styles.dac7MetricRemaining, { color: colors.textMuted }]}>
                  {stats.dac7.remainingRevenue > 0 ? t('stats.dac7RemainingRevenue', { amount: formatEuro(stats.dac7.remainingRevenue) }) : strings.stats.dac7ThresholdReached}
                </Text>
              </View>
              <View style={[styles.dac7Track, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                <View
                  style={[
                    styles.dac7Fill,
                    {
                      width: `${Math.round(stats.dac7.revenueProgress * 100)}%`,
                      backgroundColor:
                        stats.dac7.revenueProgress >= 1
                          ? '#6366F1'
                          : stats.dac7.revenueProgress >= 0.8
                          ? '#F59E0B'
                          : '#10B981',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Best Platform Highlight Banner */}
        {stats.bestPlatform && stats.bestPlatform.soldCount > 0 && (
          <View style={styles.bestPlatformCard}>
            <View style={styles.bestPlatformIconWrap}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
            </View>
            <View style={styles.bestPlatformTextWrap}>
              <Text style={styles.bestPlatformTitle}>
                {t('stats.bestPlatformBannerTitle', { name: stats.bestPlatform.name })}
              </Text>
              <Text style={styles.bestPlatformSub}>
                {t('stats.bestPlatformBannerDesc', {
                  percent: stats.bestPlatform.percentageOfProfit,
                  amount: formatEuro(stats.bestPlatform.totalProfit),
                  count: stats.bestPlatform.soldCount,
                })}
              </Text>
            </View>
          </View>
        )}

        {/* CSV Export Card */}
        <View style={styles.exportCard}>
          <View style={styles.exportTextWrap}>
            <View style={styles.exportTitleRow}>
              <Ionicons name="document-text-outline" size={20} color="#059669" />
              <Text style={styles.exportTitle}>{strings.stats.salesRegisterHeader}</Text>
              {!isPro ? (
                <View style={[styles.exportBadge, exportCount === 0 ? styles.exportBadgeFree : styles.exportBadgePro]}>
                  <Text style={[styles.exportBadgeText, exportCount === 0 ? styles.exportBadgeTextFree : styles.exportBadgeTextPro]}>
                    {exportCount === 0 ? '1 Free' : 'Pro ⚡'}
                  </Text>
                </View>
              ) : (
                <View style={[styles.exportBadge, styles.exportBadgeVip]}>
                  <Text style={[styles.exportBadgeText, styles.exportBadgeTextVip]}>VIP ✨</Text>
                </View>
              )}
            </View>
            <Text style={styles.exportSub}>
              {strings.stats.exportCsvDesc}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleExportCSV}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            <Ionicons name="download-outline" size={18} color="#FFFFFF" />
            <Text style={styles.exportBtnText}>
              {isExporting ? '...' : strings.stats.exportCsv}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Sales Trend Over Time Chart */}
        {hasSales && (
          <SalesTrendChart
            monthlyStats={stats.monthlyStats}
            platforms={allPlatforms}
          />
        )}

        {/* Trophies Showcase & Pro Business Insights */}
        {trophiesData && (
          <TrophiesShowcase
            trophies={trophiesData.trophies}
            unlockedCount={trophiesData.unlockedCount}
            totalCount={trophiesData.totalCount}
            proInsights={proInsights}
            userLevel={userLevel}
            isPro={isPro}
            onShareTrophy={(t) => {
              setStoryModal({
                visible: true,
                mode: 'trophy',
                trophy: t,
              });
            }}
            onShareRank={() => {
              setStoryModal({
                visible: true,
                mode: 'level',
                levelInfo: userLevel,
              });
            }}
            onOpenProModal={onOpenProModal}
          />
        )}

        {/* Platform Breakdown */}
        {stats.platformStats.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>DISTRIBUZIONE PROFITTO PER PIATTAFORMA</Text>
            <View style={[styles.breakdownCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
              {stats.platformStats.map((p) => (
                <View key={p.platformId} style={styles.platformRow}>
                  <View style={styles.platformLabelRow}>
                    <View style={styles.platformNameGroup}>
                      <View style={[styles.platformDot, { backgroundColor: p.color }]} />
                      <Text style={[styles.platformName, { color: colors.textPrimary }]}>{p.name}</Text>
                      <Text style={[styles.platformCount, { color: colors.textMuted }]}>({p.soldCount} venduti)</Text>
                    </View>
                    <Text style={[styles.platformProfit, { color: colors.textPrimary }]}>{formatEuro(p.totalProfit)}</Text>
                  </View>

                  <View style={[styles.progressBarTrack, isDark && { backgroundColor: '#111827' }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.max(5, p.percentageOfProfit)}%`,
                          backgroundColor: p.color,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Monthly Breakdown History */}
        {stats.monthlyStats.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>CRONOLOGIA MENSILE VENDITE</Text>
            <View style={styles.monthlyList}>
              {stats.monthlyStats.map((m) => (
                <View key={m.monthKey} style={[styles.monthlyCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View>
                    <Text style={[styles.monthlyLabel, { color: colors.textPrimary }]}>{m.monthLabel}</Text>
                    <Text style={[styles.monthlySub, { color: colors.textSecondary }]}>
                      {m.soldCount} capi venduti • Ricavo: {formatEuro(m.totalRevenue)}
                    </Text>
                  </View>
                  <Text style={styles.monthlyProfit}>{formatEuro(m.totalProfit)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State when no sales have been recorded yet */}
        {!hasSales && (
          <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <Ionicons name="analytics-outline" size={48} color={colors.textMuted} />
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>{strings.stats.noSalesYet}</Text>
            <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
              {strings.stats.noSalesSubtitle}
            </Text>
            {onNavigateToInventory && (
              <TouchableOpacity
                style={[styles.emptyStateBtn, isDark && { backgroundColor: '#1E293B' }]}
                onPress={onNavigateToInventory}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyStateBtnText, { color: colors.primary }]}>{strings.calculator.goToInventory}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Instagram Story Card Modal */}
      <StoryCardModal
        visible={storyModal.visible}
        onClose={() => setStoryModal((prev) => ({ ...prev, visible: false }))}
        mode={storyModal.mode}
        trophy={storyModal.trophy}
        levelInfo={storyModal.levelInfo}
        overallStats={
          stats
            ? {
                totalProfit: stats.totalNetProfit,
                totalSold: stats.totalSoldItems,
                avgMargin: stats.averageMarginPercent,
              }
            : null
        }
      />

      {/* Trophy Unlock Celebration Modal */}
      <TrophyUnlockModal
        visible={!!unlockedTrophyPopup}
        trophy={unlockedTrophyPopup}
        onClose={() => setUnlockedTrophyPopup(null)}
        onShare={(t) => {
          setStoryModal({
            visible: true,
            mode: 'trophy',
            trophy: t,
          });
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    borderRadius: 8,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 110,
    gap: 12,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    shadowColor: '#0F172A',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 3,
  },
  heroSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  heroAmount: {
    fontSize: 34,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  heroMetricBox: {
    flex: 1,
    alignItems: 'center',
  },
  heroDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  heroMetricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroMetricLab: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    marginTop: 2,
  },
  capitalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  capitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capitalCol: {
    flex: 1,
  },
  capitalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 12,
  },
  capitalLab: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  capitalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  capitalSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  bestPlatformCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  bestPlatformIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestPlatformTextWrap: {
    flex: 1,
  },
  bestPlatformTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  bestPlatformSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    lineHeight: 15,
  },
  exportCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  exportTextWrap: {
    marginBottom: 10,
  },
  exportTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  exportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#166534',
  },
  exportBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  exportBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  exportBadgeFree: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  exportBadgeTextFree: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  exportBadgePro: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  exportBadgeTextPro: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
  },
  exportBadgeVip: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  exportBadgeTextVip: {
    fontSize: 9,
    fontWeight: '900',
    color: '#92400E',
  },
  exportSub: {
    fontSize: 11,
    color: '#15803D',
    lineHeight: 16,
  },
  exportBtn: {
    backgroundColor: '#16A34A',
    borderRadius: 10,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  exportBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  breakdownCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  platformRow: {
    gap: 4,
  },
  platformLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  platformNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  platformDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  platformName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  platformCount: {
    fontSize: 11,
    color: '#94A3B8',
  },
  platformProfit: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  monthlyList: {
    gap: 8,
  },
  monthlyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthlyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  monthlySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  monthlyProfit: {
    fontSize: 15,
    fontWeight: '900',
    color: '#059669',
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  emptyStateBtn: {
    marginTop: 14,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyStateBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366F1',
  },
  dac7Card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
  },
  dac7HeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dac7TitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  dac7IconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dac7BadgeTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  dac7MainTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 1,
  },
  dac7StatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dac7StatusPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dac7Explanation: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  dac7MetricsContainer: {
    gap: 10,
  },
  dac7MetricItem: {},
  dac7MetricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dac7MetricLabel: {
    fontSize: 12,
  },
  dac7MetricRemaining: {
    fontSize: 11,
    fontWeight: '600',
  },
  dac7Track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  dac7Fill: {
    height: '100%',
    borderRadius: 3,
  },
});

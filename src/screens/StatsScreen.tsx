import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { computeAnalytics, AnalyticsSummary } from '../services/analytics';
import { exportInventoryToCSV } from '../services/csvExport';
import { formatEuro } from '../services/feeCalculator';

export const StatsScreen: React.FC<{ onNavigateToInventory?: () => void }> = ({
  onNavigateToInventory,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [stats, setStats] = useState<AnalyticsSummary | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadStats = useCallback(() => {
    try {
      const summary = computeAnalytics();
      setStats(summary);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    const result = await exportInventoryToCSV();
    setIsExporting(false);
    if (!result.success && result.message !== 'Nessun file selezionato.') {
      Alert.alert('Esportazione Registro', result.message);
    }
  };

  if (!stats) return null;

  const hasSales = stats.totalSoldItems > 0;

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Top Header */}
      <View style={[styles.header, { borderBottomColor: colors.cardBorder }]}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>ANALISI & PERFORMANCE</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Dashboard Guadagni</Text>
        </View>

        <TouchableOpacity
          style={[styles.refreshBtn, isDark && { backgroundColor: '#1E293B' }]}
          onPress={loadStats}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={14} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.refreshBtnText, { color: colors.primary }]}>Aggiorna</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Hero Profit Card */}
        <View style={[styles.heroCard, isDark && { backgroundColor: '#161F30' }]}>
          <Text style={styles.heroSubtitle}>PROFITTO NETTO INCASSATO</Text>
          <Text style={styles.heroAmount}>{formatEuro(stats.totalNetProfit)}</Text>

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricVal}>{stats.totalSoldItems}</Text>
              <Text style={styles.heroMetricLab}>Capi Venduti</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricVal}>{stats.averageMarginPercent}%</Text>
              <Text style={styles.heroMetricLab}>Margine Medio</Text>
            </View>
            <View style={styles.heroDivider} />
            <View style={styles.heroMetricBox}>
              <Text style={styles.heroMetricVal}>{stats.averageRoiPercent}%</Text>
              <Text style={styles.heroMetricLab}>ROI Medio</Text>
            </View>
          </View>
        </View>

        {/* Capital & Potential In Unsold Goods */}
        <View style={[styles.capitalCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.capitalRow}>
            <View style={styles.capitalCol}>
              <Text style={[styles.capitalLab, { color: colors.textSecondary }]}>Capitale in Giacenza</Text>
              <Text style={[styles.capitalVal, { color: colors.textPrimary }]}>{formatEuro(stats.unsoldCapital)}</Text>
              <Text style={[styles.capitalSub, { color: colors.textMuted }]}>{stats.totalActiveItems} capi ancora in vendita</Text>
            </View>
            <View style={[styles.capitalDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.capitalCol}>
              <Text style={[styles.capitalLab, { color: colors.textSecondary }]}>Profitto Potenziale</Text>
              <Text style={[styles.capitalVal, { color: '#059669' }]}>
                {formatEuro(stats.potentialProfitUnsold)}
              </Text>
              <Text style={[styles.capitalSub, { color: colors.textMuted }]}>Se venduti al prezzo fissato</Text>
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
                {stats.bestPlatform.name} è la tua piattaforma n° 1
              </Text>
              <Text style={styles.bestPlatformSub}>
                Ha generato il {stats.bestPlatform.percentageOfProfit}% dei tuoi profitti ({formatEuro(stats.bestPlatform.totalProfit)}) con {stats.bestPlatform.soldCount} vendite.
              </Text>
            </View>
          </View>
        )}

        {/* CSV Export Card */}
        <View style={styles.exportCard}>
          <View style={styles.exportTextWrap}>
            <View style={styles.exportTitleRow}>
              <Ionicons name="document-text-outline" size={20} color="#059669" />
              <Text style={styles.exportTitle}>Registro Vendite (Excel / CSV)</Text>
            </View>
            <Text style={styles.exportSub}>
              Scarica il foglio di calcolo completo con date, commissioni e guadagni netti, pronto per la contabilità o per Google Fogli.
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
              {isExporting ? 'Generazione...' : 'Esporta Registro Excel'}
            </Text>
          </TouchableOpacity>
        </View>

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
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>Nessuna vendita registrata finora</Text>
            <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
              Vai nell'Inventario e tocca il tasto verde "Venduto" su uno dei tuoi articoli: le tue statistiche, margini e cronologia mensile prenderanno vita all'istante!
            </Text>
            {onNavigateToInventory && (
              <TouchableOpacity
                style={[styles.emptyStateBtn, isDark && { backgroundColor: '#1E293B' }]}
                onPress={onNavigateToInventory}
                activeOpacity={0.8}
              >
                <Text style={[styles.emptyStateBtnText, { color: colors.primary }]}>Vai all'Inventario</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
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
});

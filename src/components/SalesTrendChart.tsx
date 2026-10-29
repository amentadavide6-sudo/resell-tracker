import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { MonthlyStat } from '../services/analytics';
import { formatEuro } from '../services/feeCalculator';
import { PlatformConfig } from '../types';

interface SalesTrendChartProps {
  monthlyStats: MonthlyStat[];
  platforms: PlatformConfig[];
}

type MetricType = 'profit' | 'revenue' | 'count';

export const SalesTrendChart: React.FC<SalesTrendChartProps> = ({
  monthlyStats,
  platforms,
}) => {
  const { colors, isDark } = useTheme();
  const { strings, t, language } = useTranslation();
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('profit');

  // Display from the first recorded sale onwards, keeping at most the last 6 months once history grows
  const displayMonths = useMemo(() => {
    if (!monthlyStats || monthlyStats.length === 0) return [];
    return monthlyStats.length > 6 ? monthlyStats.slice(-6) : monthlyStats;
  }, [monthlyStats]);

  const timeframeBadgeText = useMemo(() => {
    if (displayMonths.length <= 1) return 'Questo Mese';
    if (monthlyStats.length > 6) return strings.stats.last6Months;
    return `${displayMonths.length} Mesi`;
  }, [displayMonths.length, monthlyStats.length, strings]);

  // Selected month for detailed tooltip (defaults to the most recent month if it has data)
  const defaultSelectedKey = useMemo(() => {
    if (displayMonths.length === 0) return null;
    const lastWithData = [...displayMonths].reverse().find((m) => m.soldCount > 0);
    return lastWithData ? lastWithData.monthKey : displayMonths[displayMonths.length - 1].monthKey;
  }, [displayMonths]);

  const [activeMonthKey, setActiveMonthKey] = useState<string | null>(defaultSelectedKey);

  // Compute total and average for the analyzed period
  const periodTotals = useMemo(() => {
    let totalVal = 0;
    displayMonths.forEach((m) => {
      if (selectedMetric === 'profit') totalVal += m.totalProfit;
      else if (selectedMetric === 'revenue') totalVal += m.totalRevenue;
      else totalVal += m.soldCount;
    });
    const avg = displayMonths.length > 0 ? totalVal / displayMonths.length : 0;
    return {
      total: totalVal,
      avg,
    };
  }, [displayMonths, selectedMetric]);

  // Find max value across the months to set the scale height (160px max height)
  const maxMetricValue = useMemo(() => {
    let max = 0;
    displayMonths.forEach((m) => {
      let val = 0;
      if (selectedMetric === 'profit') val = m.totalProfit;
      else if (selectedMetric === 'revenue') val = m.totalRevenue;
      else val = m.soldCount;
      if (val > max) max = val;
    });
    return max > 0 ? max : selectedMetric === 'count' ? 10 : 200;
  }, [displayMonths, selectedMetric]);

  const CHART_HEIGHT = 150;

  // Active month object for tooltip
  const activeMonth = useMemo(() => {
    return displayMonths.find((m) => m.monthKey === activeMonthKey) || null;
  }, [displayMonths, activeMonthKey]);

  // Platform cumulative totals for bottom legend
  const platformLegendTotals = useMemo(() => {
    const map: Record<string, number> = {};
    let totalAll = 0;
    displayMonths.forEach((m) => {
      Object.entries(m.platformBreakdown || {}).forEach(([pId, data]) => {
        const val =
          selectedMetric === 'profit'
            ? data.totalProfit
            : selectedMetric === 'revenue'
            ? data.totalRevenue
            : data.soldCount;
        map[pId] = (map[pId] || 0) + val;
        totalAll += val;
      });
    });

    return Object.entries(map)
      .map(([pId, amount]) => {
        const pConfig = platforms.find((p) => p.id === pId) || {
          name: pId,
          color: '#6366F1',
        };
        const pct = totalAll > 0 ? Math.round((amount / totalAll) * 100) : 0;
        return {
          id: pId,
          name: pConfig.name,
          color: pConfig.color,
          amount,
          percentage: pct,
        };
      })
      .filter((p) => p.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [displayMonths, selectedMetric, platforms]);

  if (!displayMonths || displayMonths.length === 0) return null;

  const getLocale = () => {
    switch (language) {
      case 'en': return 'en-US';
      case 'es': return 'es-ES';
      case 'fr': return 'fr-FR';
      case 'de': return 'de-DE';
      default: return 'it-IT';
    }
  };

  const getShortMonth = (key: string) => {
    try {
      const [year, month] = key.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      const str = d.toLocaleDateString(getLocale(), { month: 'short' });
      return str.charAt(0).toUpperCase() + str.slice(1).replace('.', '');
    } catch {
      return key;
    }
  };

  const getFullMonthLabel = (m: MonthlyStat) => {
    try {
      const [year, month] = m.monthKey.split('-').map(Number);
      const d = new Date(year, month - 1, 1);
      const str = d.toLocaleDateString(getLocale(), { month: 'long', year: 'numeric' });
      return str.charAt(0).toUpperCase() + str.slice(1);
    } catch {
      return m.monthLabel;
    }
  };

  const formatMetricValue = (val: number) => {
    if (selectedMetric === 'count') return `${Math.round(val)}`;
    if (val >= 1000) return `€${(val / 1000).toFixed(1)}k`;
    return `€${Math.round(val)}`;
  };

  // Grid guides
  const gridSteps = [1, 0.75, 0.5, 0.25, 0];

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
        {strings.stats.salesTrendTitle}
      </Text>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {/* Card Header */}
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleWrap}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
              <Ionicons name="trending-up" size={16} color="#6366F1" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {strings.stats.monthlyTrendSubtitle}
            </Text>
          </View>

          <View style={[styles.timeframeBadge, { backgroundColor: isDark ? '#1E293B' : '#EEF2FF' }]}>
            <Text style={[styles.timeframeText, { color: '#6366F1' }]}>
              {timeframeBadgeText}
            </Text>
          </View>
        </View>

        {/* Metric Selector Pills */}
        <View style={styles.metricTabsRow}>
          <TouchableOpacity
            style={[
              styles.metricTab,
              selectedMetric === 'profit'
                ? { backgroundColor: '#6366F1' }
                : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.cardBorder },
            ]}
            onPress={() => setSelectedMetric('profit')}
            activeOpacity={0.7}
          >
            {selectedMetric === 'profit' && <View style={styles.activeDot} />}
            <Text
              style={[
                styles.metricTabText,
                { color: selectedMetric === 'profit' ? '#FFFFFF' : colors.textSecondary },
                selectedMetric === 'profit' && styles.metricTabActiveText,
              ]}
            >
              {strings.stats.metricNetProfit}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricTab,
              selectedMetric === 'revenue'
                ? { backgroundColor: isDark ? '#312E81' : '#0F172A' }
                : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.cardBorder },
            ]}
            onPress={() => setSelectedMetric('revenue')}
            activeOpacity={0.7}
          >
            {selectedMetric === 'revenue' && <View style={styles.activeDot} />}
            <Text
              style={[
                styles.metricTabText,
                { color: selectedMetric === 'revenue' ? '#FFFFFF' : colors.textSecondary },
                selectedMetric === 'revenue' && styles.metricTabActiveText,
              ]}
            >
              {strings.stats.metricGrossRevenue}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.metricTab,
              selectedMetric === 'count'
                ? { backgroundColor: isDark ? '#064E3B' : '#059669' }
                : { backgroundColor: isDark ? '#1E293B' : '#F1F5F9', borderColor: colors.cardBorder },
            ]}
            onPress={() => setSelectedMetric('count')}
            activeOpacity={0.7}
          >
            {selectedMetric === 'count' && <View style={styles.activeDot} />}
            <Text
              style={[
                styles.metricTabText,
                { color: selectedMetric === 'count' ? '#FFFFFF' : colors.textSecondary },
                selectedMetric === 'count' && styles.metricTabActiveText,
              ]}
            >
              {strings.stats.metricPiecesSold}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Period Highlights Subtitle */}
        <Text style={[styles.periodSubtitle, { color: colors.textSecondary }]}>
          {strings.stats.chartTotalPeriod
            .replace(
              '{amount}',
              selectedMetric === 'count'
                ? `${Math.round(periodTotals.total)} pz`
                : formatEuro(periodTotals.total)
            )
            .replace(
              '{avg}',
              selectedMetric === 'count'
                ? `${periodTotals.avg.toFixed(1)} pz`
                : formatEuro(periodTotals.avg)
            )}
        </Text>

        {/* Interactive Tooltip Card when a month is selected */}
        {activeMonth && (
          <View style={[styles.tooltipCard, { backgroundColor: isDark ? '#0B1329' : '#F8FAFC', borderColor: '#6366F1' }]}>
            <View style={styles.tooltipHeaderRow}>
              <View style={styles.tooltipTitleRow}>
                <Ionicons name="calendar-outline" size={14} color="#6366F1" />
                <Text style={[styles.tooltipTitle, { color: colors.textPrimary }]}>
                  {getFullMonthLabel(activeMonth)}
                </Text>
              </View>
              <Text style={[styles.tooltipTotalAmount, { color: colors.textPrimary }]}>
                {selectedMetric === 'count'
                  ? `${activeMonth.soldCount} capi`
                  : selectedMetric === 'revenue'
                  ? formatEuro(activeMonth.totalRevenue)
                  : formatEuro(activeMonth.totalProfit)}
              </Text>
            </View>

            {/* Platform breakdown list inside tooltip */}
            <View style={styles.tooltipBreakdownRow}>
              {Object.keys(activeMonth.platformBreakdown || {}).length === 0 ? (
                <Text style={[styles.tooltipEmptyText, { color: colors.textMuted }]}>
                  Nessuna vendita registrata in questo mese
                </Text>
              ) : (
                Object.entries(activeMonth.platformBreakdown).map(([pId, pData]) => {
                  const pConfig = platforms.find((p) => p.id === pId) || {
                    name: pId,
                    color: '#6366F1',
                  };
                  const amount =
                    selectedMetric === 'profit'
                      ? pData.totalProfit
                      : selectedMetric === 'revenue'
                      ? pData.totalRevenue
                      : pData.soldCount;
                  if (amount <= 0) return null;

                  return (
                    <View key={pId} style={styles.tooltipPlatformPill}>
                      <View style={[styles.tooltipDot, { backgroundColor: pConfig.color }]} />
                      <Text style={[styles.tooltipPlatformName, { color: colors.textSecondary }]}>
                        {pConfig.name}:
                      </Text>
                      <Text style={[styles.tooltipPlatformValue, { color: colors.textPrimary }]}>
                        {selectedMetric === 'count' ? `${amount} pz` : formatEuro(amount)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* Main Chart Area */}
        <View style={styles.chartWrapper}>
          {/* Background horizontal dashed grid guidelines */}
          <View style={styles.gridContainer} pointerEvents="none">
            {gridSteps.map((step) => {
              const val = maxMetricValue * step;
              return (
                <View key={step} style={styles.gridLineRow}>
                  <Text style={[styles.gridLabel, { color: colors.textMuted }]}>
                    {formatMetricValue(val)}
                  </Text>
                  <View
                    style={[
                      styles.gridLine,
                      {
                        borderColor: isDark ? '#1E293B' : '#E2E8F0',
                        borderStyle: step === 0 ? 'solid' : 'dashed',
                        opacity: step === 0 ? 0.9 : 0.6,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>

          {/* Month Columns */}
          <View
            style={[
              styles.columnsContainer,
              displayMonths.length <= 3 && { justifyContent: 'center', gap: 28 },
            ]}
          >
            {displayMonths.map((m) => {
              const isSelected = activeMonthKey === m.monthKey;
              const totalVal =
                selectedMetric === 'profit'
                  ? m.totalProfit
                  : selectedMetric === 'revenue'
                  ? m.totalRevenue
                  : m.soldCount;

              // Total height of the solid column proportional to maxMetricValue
              const colHeightRatio = maxMetricValue > 0 ? Math.min(1, Math.max(0, totalVal / maxMetricValue)) : 0;
              const colPixelHeight = Math.max(colHeightRatio * CHART_HEIGHT, totalVal > 0 ? 8 : 4);

              // Gather platforms that have values in this month
              const platformEntries = Object.entries(m.platformBreakdown || {}).filter(([, pData]) => {
                const v =
                  selectedMetric === 'profit'
                    ? pData.totalProfit
                    : selectedMetric === 'revenue'
                    ? pData.totalRevenue
                    : pData.soldCount;
                return v > 0;
              });

              return (
                <TouchableOpacity
                  key={m.monthKey}
                  style={[
                    styles.columnTouchable,
                    displayMonths.length <= 3 && { flex: 0, width: 56 },
                  ]}
                  onPress={() => setActiveMonthKey(isSelected ? null : m.monthKey)}
                  activeOpacity={0.7}
                >
                  {/* Selection Highlight background column */}
                  {isSelected && (
                    <View
                      style={[
                        styles.selectedColGlow,
                        {
                          backgroundColor: isDark ? '#312E81' : '#EEF2FF',
                          borderColor: '#6366F1',
                        },
                      ]}
                    />
                  )}

                  {/* Amount header text */}
                  <Text
                    style={[
                      styles.columnValText,
                      { color: isSelected ? '#6366F1' : colors.textMuted },
                      isSelected && { fontWeight: '800' },
                    ]}
                    numberOfLines={1}
                  >
                    {totalVal > 0 ? formatMetricValue(totalVal) : '0'}
                  </Text>

                  {/* Chart Column (100% unified, solid, clean single bar with overflow hidden) */}
                  <View
                    style={[
                      styles.columnOuter,
                      {
                        height: CHART_HEIGHT,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.solidBar,
                        {
                          height: colPixelHeight,
                          backgroundColor: totalVal === 0 ? (isDark ? '#1E293B' : '#E2E8F0') : '#6366F1',
                        },
                      ]}
                    >
                      {/* Stacked Platform Slices */}
                      {totalVal > 0 && platformEntries.length > 0 ? (
                        platformEntries.map(([pId, pData], idx) => {
                          const pVal =
                            selectedMetric === 'profit'
                              ? pData.totalProfit
                              : selectedMetric === 'revenue'
                              ? pData.totalRevenue
                              : pData.soldCount;

                          const pConfig = platforms.find((p) => p.id === pId) || {
                            name: pId,
                            color: '#6366F1',
                          };
                          const segmentHeight = totalVal > 0 ? (pVal / totalVal) * colPixelHeight : 0;

                          return (
                            <View
                              key={pId}
                              style={[
                                styles.platformSegment,
                                {
                                  height: segmentHeight,
                                  backgroundColor: pConfig.color,
                                  borderBottomWidth: idx < platformEntries.length - 1 ? 1 : 0,
                                  borderBottomColor: isDark ? '#161F30' : '#FFFFFF',
                                },
                              ]}
                            />
                          );
                        })
                      ) : null}
                    </View>
                  </View>

                  {/* Month Label */}
                  <Text
                    style={[
                      styles.monthLabelText,
                      { color: isSelected ? '#6366F1' : colors.textSecondary },
                      isSelected && styles.monthLabelSelected,
                    ]}
                  >
                    {getShortMonth(m.monthKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Platform Breakdown Legend */}
        {platformLegendTotals.length > 0 && (
          <View style={[styles.legendBox, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: colors.cardBorder }]}>
            {platformLegendTotals.map((p) => (
              <View key={p.id} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: p.color }]} />
                <Text style={[styles.legendName, { color: colors.textPrimary }]}>{p.name}</Text>
                <Text style={[styles.legendAmount, { color: colors.textSecondary }]}>
                  {selectedMetric === 'count' ? `${p.amount} pz` : formatEuro(p.amount)} ({p.percentage}%)
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Helpful tap hint */}
        <Text style={[styles.hintText, { color: colors.textMuted }]}>
          {strings.stats.chartTooltipHint}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 4,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  timeframeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timeframeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  metricTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    gap: 5,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  metricTabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metricTabActiveText: {
    fontWeight: '800',
  },
  periodSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 12,
  },
  tooltipCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    marginBottom: 14,
  },
  tooltipHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tooltipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  tooltipTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  tooltipTotalAmount: {
    fontSize: 13,
    fontWeight: '800',
  },
  tooltipBreakdownRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tooltipEmptyText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  tooltipPlatformPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tooltipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tooltipPlatformName: {
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipPlatformValue: {
    fontSize: 11,
    fontWeight: '800',
  },
  chartWrapper: {
    height: 200,
    position: 'relative',
    marginTop: 4,
    marginBottom: 10,
  },
  gridContainer: {
    position: 'absolute',
    top: 18,
    left: 0,
    right: 0,
    height: 150,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gridLabel: {
    width: 38,
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'right',
    paddingRight: 6,
  },
  gridLine: {
    flex: 1,
    borderBottomWidth: 1,
  },
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginLeft: 38,
    height: 195,
  },
  columnTouchable: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
    paddingVertical: 2,
  },
  selectedColGlow: {
    position: 'absolute',
    top: 0,
    bottom: 22,
    left: 2,
    right: 2,
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.8,
  },
  columnValText: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  columnOuter: {
    width: 38,
    justifyContent: 'flex-end',
  },
  solidBar: {
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    flexDirection: 'column-reverse', // Base starts from bottom
  },
  platformSegment: {
    width: '100%',
  },
  monthLabelText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  monthLabelSelected: {
    fontWeight: '800',
  },
  legendBox: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendName: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendAmount: {
    fontSize: 11,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
  },
});

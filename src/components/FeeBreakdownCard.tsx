import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CalculationResult, PlatformConfig } from '../types';
import { formatEuro } from '../services/feeCalculator';

interface FeeBreakdownCardProps {
  result: CalculationResult;
  platform: PlatformConfig;
}

export const FeeBreakdownCard: React.FC<FeeBreakdownCardProps> = ({
  result,
  platform,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isProfit = result.netProfit > 0;
  const isLoss = result.netProfit < 0;

  const profitColor = isProfit ? '#10B981' : isLoss ? '#EF4444' : '#64748B';
  const profitBg = isProfit ? '#ECFDF5' : isLoss ? '#FEF2F2' : '#F8FAFC';
  const profitBorder = isProfit ? '#A7F3D0' : isLoss ? '#FECACA' : '#E2E8F0';

  // Calculate percentages for visual split bar
  const totalBar = Math.max(result.sellingPrice, result.totalCosts, 1);
  const costPct = Math.min(100, (result.purchaseCost / totalBar) * 100);
  const feePct = Math.min(100, (result.totalSellerFees / totalBar) * 100);
  const otherCostPct = Math.min(
    100,
    ((result.sellerShippingCost + result.packagingCost) / totalBar) * 100
  );
  const profitPct = Math.max(0, 100 - costPct - feePct - otherCostPct);

  return (
    <View style={styles.container}>
      {/* Main Net Profit Card */}
      <View
        style={[
          styles.mainCard,
          { backgroundColor: profitBg, borderColor: profitBorder },
        ]}
      >
        <View style={styles.profitHeader}>
          <View style={styles.profitLeft}>
            <Text style={styles.profitLabel}>PROFITTO NETTO</Text>
            <Text
              style={[styles.profitAmount, { color: profitColor }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatEuro(result.netProfit)}
            </Text>
          </View>

          <View style={styles.metricsGroup}>
            <View
              style={[
                styles.metricPill,
                { backgroundColor: isProfit ? '#D1FAE5' : '#FEE2E2' },
              ]}
            >
              <Text style={[styles.metricLabel, { color: profitColor }]}>
                Margine: {result.marginPercent}%
              </Text>
            </View>

            <View
              style={[
                styles.metricPill,
                { backgroundColor: isProfit ? '#D1FAE5' : '#FEE2E2', marginTop: 4 },
              ]}
            >
              <Text style={[styles.metricLabel, { color: profitColor }]}>
                ROI: {result.roiPercent}%
              </Text>
            </View>
          </View>
        </View>

        {/* Visual Bar Breakdown */}
        {result.sellingPrice > 0 && (
          <View style={styles.barSection}>
            <View style={styles.barTrack}>
              {costPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${costPct}%`, backgroundColor: '#F59E0B' },
                  ]}
                />
              )}
              {otherCostPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${otherCostPct}%`, backgroundColor: '#FB923C' },
                  ]}
                />
              )}
              {feePct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${feePct}%`, backgroundColor: '#EF4444' },
                  ]}
                />
              )}
              {isProfit && profitPct > 0 && (
                <View
                  style={[
                    styles.barSegment,
                    { width: `${profitPct}%`, backgroundColor: '#10B981' },
                  ]}
                />
              )}
            </View>

            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                <Text style={styles.legendText}>Acquisto</Text>
              </View>
              {feePct > 0 && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
                  <Text style={styles.legendText}>Fee ({formatEuro(result.totalSellerFees)})</Text>
                </View>
              )}
              {isProfit && (
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.legendText}>Guadagno</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Accordion Toggle for Detailed Math */}
      <TouchableOpacity
        style={styles.detailsToggle}
        onPress={() => setShowDetails(!showDetails)}
        activeOpacity={0.7}
      >
        <Text style={styles.detailsToggleText}>
          {showDetails ? '▲ Nascondi dettaglio calcoli' : '▼ Mostra dettaglio calcoli & acquirente'}
        </Text>
      </TouchableOpacity>

      {showDetails && (
        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>DETTAGLIO TRASPARENTE</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailText}>Prezzo di vendita fissato</Text>
            <Text style={styles.detailValueBold}>{formatEuro(result.sellingPrice)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailText}>Commissione venditore {platform.name}</Text>
            <Text style={[styles.detailValue, { color: '#EF4444' }]}>
              -{formatEuro(result.sellerPlatformFee)}
            </Text>
          </View>

          {result.paymentFee > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Costi gestione pagamento / PayPal</Text>
              <Text style={[styles.detailValue, { color: '#EF4444' }]}>
                -{formatEuro(result.paymentFee)}
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailText}>Costo d'acquisto articolo</Text>
            <Text style={[styles.detailValue, { color: '#F59E0B' }]}>
              -{formatEuro(result.purchaseCost)}
            </Text>
          </View>

          {(result.sellerShippingCost > 0 || result.packagingCost > 0) && (
            <View style={styles.detailRow}>
              <Text style={styles.detailText}>Spedizione / Imballaggio a tuo carico</Text>
              <Text style={[styles.detailValue, { color: '#FB923C' }]}>
                -{formatEuro(result.sellerShippingCost + result.packagingCost)}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailTextSub}>Protezione pagata dall'acquirente</Text>
            <Text style={styles.detailValueSub}>
              {result.buyerProtectionFee > 0 ? `+${formatEuro(result.buyerProtectionFee)}` : '0,00 €'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailTextSub}>Totale speso dall'acquirente (stimato)</Text>
            <Text style={styles.detailValueSub}>{formatEuro(result.buyerTotalEstimated)}</Text>
          </View>

          <Text style={styles.platformNote}>{platform.description}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  mainCard: {
    borderWidth: 1.5,
    borderRadius: 18,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 2,
  },
  profitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitLeft: {
    flex: 1,
    marginRight: 10,
  },
  profitLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 2,
  },
  profitAmount: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricsGroup: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  metricPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  barSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  barTrack: {
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  detailsToggle: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  detailsToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6366F1',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
  },
  detailsTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailText: {
    fontSize: 13,
    color: '#334155',
  },
  detailTextSub: {
    fontSize: 12,
    color: '#64748B',
    fontStyle: 'italic',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailValueBold: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailValueSub: {
    fontSize: 12,
    color: '#64748B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  platformNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 8,
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    lineHeight: 16,
  },
});

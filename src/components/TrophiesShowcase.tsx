import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { TrophyStatus, ProBusinessInsights } from '../services/achievements';
import { formatEuro } from '../services/feeCalculator';
import { LevelInfo } from '../services/gamification';

interface TrophiesShowcaseProps {
  trophies: TrophyStatus[];
  unlockedCount: number;
  totalCount: number;
  proInsights: ProBusinessInsights | null;
  userLevel: LevelInfo | null;
  onShareTrophy: (trophy: TrophyStatus) => void;
  onShareRank: () => void;
  onOpenProModal?: () => void;
}

export const TrophiesShowcase: React.FC<TrophiesShowcaseProps> = ({
  trophies,
  unlockedCount,
  totalCount,
  proInsights,
  userLevel,
  onShareTrophy,
  onShareRank,
}) => {
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const [selectedTrophy, setSelectedTrophy] = useState<TrophyStatus | null>(null);

  const progressRatio = totalCount > 0 ? unlockedCount / totalCount : 0;
  const progressPercent = Math.round(progressRatio * 100);

  // Level unlock conditions for Pro business insights
  const currentLvl = userLevel ? userLevel.levelNumber : 1;
  const hasUnlockedDayInsight = currentLvl >= 3 || unlockedCount >= 3;
  const hasUnlockedVelocityInsight = currentLvl >= 5 || unlockedCount >= 5;
  const hasUnlockedTurnoverInsight = currentLvl >= 8 || unlockedCount >= 8;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionHeading, { color: colors.textSecondary }]}>
        BACHEECA TROFEI & PRESTIGIO RESELLER
      </Text>

      {/* Main Trophies Card */}
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View style={[styles.iconWrap, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
              <Ionicons name="trophy" size={18} color="#F59E0B" />
            </View>
            <View>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Trofei Reseller</Text>
              <Text style={[styles.cardSub, { color: colors.textSecondary }]}>
                {unlockedCount} di {totalCount} Conquistati ({progressPercent}%)
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.shareRankBtn}
            onPress={onShareRank}
            activeOpacity={0.7}
          >
            <Ionicons name="logo-instagram" size={13} color="#E1306C" />
            <Text style={styles.shareRankText}>Condividi Rango</Text>
          </TouchableOpacity>
        </View>

        {/* Progress Track */}
        <View style={[styles.trackBg, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${progressPercent}%`,
                backgroundColor: progressPercent >= 100 ? '#10B981' : '#F59E0B',
              },
            ]}
          />
        </View>

        {/* Trophies 2-Column Grid */}
        <View style={styles.trophiesGrid}>
          {trophies.map((t) => {
            return (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.trophyItem,
                  {
                    backgroundColor: isDark ? '#161F30' : '#F8FAFC',
                    borderColor: t.isUnlocked ? t.badgeColor : colors.cardBorder,
                  },
                  t.isUnlocked && styles.trophyItemUnlocked,
                ]}
                onPress={() => setSelectedTrophy(t)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.trophyIconBox,
                    {
                      backgroundColor: t.isUnlocked
                        ? `${t.badgeColor}22`
                        : isDark
                        ? '#1E293B'
                        : '#E2E8F0',
                    },
                  ]}
                >
                  <Ionicons
                    name={t.isUnlocked ? (t.icon as any) : 'lock-closed'}
                    size={20}
                    color={t.isUnlocked ? t.badgeColor : colors.textMuted}
                  />
                </View>

                <View style={styles.trophyInfoWrap}>
                  <Text
                    style={[
                      styles.trophyTitle,
                      { color: t.isUnlocked ? colors.textPrimary : colors.textMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {t.title}
                  </Text>
                  <Text
                    style={[
                      styles.trophyReward,
                      { color: t.isUnlocked ? t.badgeColor : colors.textMuted },
                    ]}
                  >
                    {t.isUnlocked ? `Sbloccato! (+${t.xpReward} XP)` : `+${t.xpReward} XP`}
                  </Text>
                </View>

                {t.isUnlocked && (
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ADVANCED PRO BUSINESS INSIGHTS */}
      <Text style={[styles.sectionHeading, { color: colors.textSecondary, marginTop: 18 }]}>
        INSIGHT STRATEGICI RESELLER PRO
      </Text>

      <View style={styles.insightsContainer}>
        {/* Insight 1: Giorno d'Oro (Sbloccato a Livello 3 o 3 Trofei) */}
        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.insightHeaderRow}>
            <View style={styles.insightTitleRow}>
              <View style={[styles.insightIconBox, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                <Ionicons name="calendar" size={16} color="#6366F1" />
              </View>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Il Tuo Giorno d'Oro</Text>
            </View>
            <View style={[styles.insightLevelPill, { backgroundColor: hasUnlockedDayInsight ? '#ECFDF5' : (isDark ? '#1E293B' : '#F1F5F9') }]}>
              <Text style={[styles.insightLevelPillText, { color: hasUnlockedDayInsight ? '#059669' : colors.textMuted }]}>
                {hasUnlockedDayInsight ? 'Sbloccato ✨' : '🔒 Livello 3'}
              </Text>
            </View>
          </View>

          {hasUnlockedDayInsight ? (
            proInsights && proInsights.bestDayOfWeek ? (
              <View style={styles.insightBody}>
                <Text style={[styles.insightHighlight, { color: '#6366F1' }]}>
                  {proInsights.bestDayOfWeek.dayName}
                </Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
                  È il giorno in cui concludi più vendite in assoluto ({proInsights.bestDayOfWeek.salesCount} vendite, con {formatEuro(proInsights.bestDayOfWeek.totalProfit)} di profitto generato). Concentra le tue nuove inserzioni e sconti verso questo giorno!
                </Text>
              </View>
            ) : (
              <Text style={[styles.insightEmptyText, { color: colors.textMuted }]}>
                Registra le tue prime vendite per calcolare il giorno statisticamente più profittevole.
              </Text>
            )
          ) : (
            <Text style={[styles.insightLockedText, { color: colors.textMuted }]}>
              Raggiungi il Livello 3 (o conquista 3 trofei) per sbloccare l'analisi del giorno della settimana più redditizio per le tue vendite.
            </Text>
          )}
        </View>

        {/* Insight 2: Velocità di Vendita / Velocity (Sbloccato a Livello 5 o 5 Trofei) */}
        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.insightHeaderRow}>
            <View style={styles.insightTitleRow}>
              <View style={[styles.insightIconBox, { backgroundColor: isDark ? '#431407' : '#FFEDD5' }]}>
                <Ionicons name="flash" size={16} color="#F97316" />
              </View>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Velocità Media di Vendita (Velocity)</Text>
            </View>
            <View style={[styles.insightLevelPill, { backgroundColor: hasUnlockedVelocityInsight ? '#ECFDF5' : (isDark ? '#1E293B' : '#F1F5F9') }]}>
              <Text style={[styles.insightLevelPillText, { color: hasUnlockedVelocityInsight ? '#059669' : colors.textMuted }]}>
                {hasUnlockedVelocityInsight ? 'Sbloccato ✨' : '🔒 Livello 5'}
              </Text>
            </View>
          </View>

          {hasUnlockedVelocityInsight ? (
            proInsights && proInsights.averageDaysToSell !== null ? (
              <View style={styles.insightBody}>
                <Text style={[styles.insightHighlight, { color: '#F97316' }]}>
                  {proInsights.averageDaysToSell} Giorni
                </Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
                  Tempo medio impiegato da un tuo articolo dal caricamento alla vendita. Hai concluso {proInsights.fastFlipsCount} vendite lampo in meno di 48 ore!
                </Text>
              </View>
            ) : (
              <Text style={[styles.insightEmptyText, { color: colors.textMuted }]}>
                Calcolo in corso man mano che accumuli date di acquisto e vendita.
              </Text>
            )
          ) : (
            <Text style={[styles.insightLockedText, { color: colors.textMuted }]}>
              Raggiungi il Livello 5 (o conquista 5 trofei) per sbloccare il monitoraggio della velocità media di rotazione dei tuoi capi.
            </Text>
          )}
        </View>

        {/* Insight 3: Tasso di Rotazione Stock (Sbloccato a Livello 8 o 8 Trofei) */}
        <View style={[styles.insightCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.insightHeaderRow}>
            <View style={styles.insightTitleRow}>
              <View style={[styles.insightIconBox, { backgroundColor: isDark ? '#064E3B' : '#D1FAE5' }]}>
                <Ionicons name="repeat" size={16} color="#10B981" />
              </View>
              <Text style={[styles.insightTitle, { color: colors.textPrimary }]}>Rotazione del Magazzino</Text>
            </View>
            <View style={[styles.insightLevelPill, { backgroundColor: hasUnlockedTurnoverInsight ? '#ECFDF5' : (isDark ? '#1E293B' : '#F1F5F9') }]}>
              <Text style={[styles.insightLevelPillText, { color: hasUnlockedTurnoverInsight ? '#059669' : colors.textMuted }]}>
                {hasUnlockedTurnoverInsight ? 'Sbloccato ✨' : '🔒 Livello 8'}
              </Text>
            </View>
          </View>

          {hasUnlockedTurnoverInsight ? (
            proInsights ? (
              <View style={styles.insightBody}>
                <Text style={[styles.insightHighlight, { color: '#10B981' }]}>
                  {proInsights.stockTurnoverRate}% del Catalogo Liquidato
                </Text>
                <Text style={[styles.insightDesc, { color: colors.textSecondary }]}>
                  Indica l'efficienza con cui trasformi i capi fermi in liquidità netta. Un tasso superiore al 50% identifica un reseller ad altissima efficienza.
                </Text>
              </View>
            ) : null
          ) : (
            <Text style={[styles.insightLockedText, { color: colors.textMuted }]}>
              Raggiungi il Livello 8 per monitorare la liquidità e il tasso di rotazione del magazzino.
            </Text>
          )}
        </View>
      </View>

      {/* Trophy Detail Popup Modal */}
      {selectedTrophy && (
        <Modal visible transparent animationType="fade" onRequestClose={() => setSelectedTrophy(null)}>
          <View style={styles.detailModalOverlay}>
            <View style={[styles.detailModalCard, { backgroundColor: isDark ? '#0F172A' : '#FFFFFF', borderColor: colors.cardBorder }]}>
              <View style={[styles.detailIconBox, { backgroundColor: selectedTrophy.isUnlocked ? `${selectedTrophy.badgeColor}22` : (isDark ? '#1E293B' : '#E2E8F0'), borderColor: selectedTrophy.badgeColor }]}>
                <Ionicons
                  name={selectedTrophy.isUnlocked ? (selectedTrophy.icon as any) : 'lock-closed'}
                  size={36}
                  color={selectedTrophy.isUnlocked ? selectedTrophy.badgeColor : colors.textMuted}
                />
              </View>

              <Text style={[styles.detailTitle, { color: colors.textPrimary }]}>{selectedTrophy.title}</Text>
              <Text style={[styles.detailDesc, { color: colors.textSecondary }]}>{selectedTrophy.description}</Text>

              {/* Progress info */}
              <View style={[styles.detailProgressBox, { backgroundColor: isDark ? '#161F30' : '#F1F5F9' }]}>
                <Text style={[styles.detailProgressLabel, { color: colors.textSecondary }]}>
                  Progresso: <Text style={{ fontWeight: '800', color: colors.textPrimary }}>{selectedTrophy.currentProgress} / {selectedTrophy.targetCount} {selectedTrophy.unit || ''}</Text>
                </Text>
                <View style={[styles.detailTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
                  <View
                    style={[
                      styles.detailFill,
                      {
                        width: `${Math.round(selectedTrophy.progressPercent * 100)}%`,
                        backgroundColor: selectedTrophy.badgeColor,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={styles.detailActionsRow}>
                {selectedTrophy.isUnlocked && (
                  <TouchableOpacity
                    style={styles.detailShareBtn}
                    onPress={() => {
                      const t = selectedTrophy;
                      setSelectedTrophy(null);
                      onShareTrophy(t);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="logo-instagram" size={16} color="#FFFFFF" />
                    <Text style={styles.detailShareBtnText}>Condividi Storia</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.detailCloseBtn, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}
                  onPress={() => setSelectedTrophy(null)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.detailCloseBtnText, { color: colors.textPrimary }]}>Chiudi</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 10,
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSub: {
    fontSize: 11,
    marginTop: 1,
  },
  shareRankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 48, 108, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  shareRankText: {
    color: '#E1306C',
    fontSize: 11,
    fontWeight: '700',
  },
  trackBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 14,
  },
  trackFill: {
    height: '100%',
    borderRadius: 3,
  },
  trophiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trophyItem: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    position: 'relative',
    gap: 8,
  },
  trophyItemUnlocked: {
    borderWidth: 1.5,
  },
  trophyIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophyInfoWrap: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  trophyReward: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  checkIcon: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  insightsContainer: {
    gap: 10,
  },
  insightCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
  },
  insightHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  insightIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  insightLevelPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  insightLevelPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  insightBody: {
    marginTop: 4,
  },
  insightHighlight: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  insightDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  insightEmptyText: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  insightLockedText: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  detailModalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
  },
  detailIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  detailDesc: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 14,
  },
  detailProgressBox: {
    width: '100%',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  detailProgressLabel: {
    fontSize: 11,
    marginBottom: 6,
  },
  detailTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  detailFill: {
    height: '100%',
    borderRadius: 3,
  },
  detailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  detailShareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E1306C',
    borderRadius: 12,
    paddingVertical: 12,
  },
  detailShareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detailCloseBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  detailCloseBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});

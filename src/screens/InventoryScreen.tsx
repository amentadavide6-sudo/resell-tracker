import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddItemModal } from '../components/AddItemModal';
import { MarkSoldModal } from '../components/MarkSoldModal';
import { CustomAlertModal, CustomAlertConfig } from '../components/CustomAlertModal';
import { CareerRoadmapModal } from '../components/CareerRoadmapModal';
import { SocialProofModal } from '../components/SocialProofModal';
import {
  getAllInventoryItems,
  deleteInventoryItem,
  markItemAsSold,
  updateItemStatus,
  getTotalInventoryCount,
} from '../services/db';
import { calculateResellProfit, formatEuro } from '../services/feeCalculator';
import { PLATFORMS } from '../constants/platforms';
import { canAddMoreItems, isProUser, getProPassInfo, FREE_TIER_ITEM_LIMIT } from '../services/proManager';
import { getUserXP, getLevelInfo, deductXP, XP_REWARDS } from '../services/gamification';
import { shareSoldProfit } from '../services/socialProof';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../i18n';
import { InventoryItem, ItemStatus, PlatformId } from '../types';

export const InventoryScreen: React.FC<{ onOpenProModal?: () => void }> = ({ onOpenProModal }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { strings } = useTranslation();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [totalDbCount, setTotalDbCount] = useState<number>(0);
  const [activeFilter, setActiveFilter] = useState<ItemStatus | 'all'>('listed');
  const [platformFilter, setPlatformFilter] = useState<PlatformId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemToSell, setItemToSell] = useState<InventoryItem | null>(null);
  const [userXP, setUserXP] = useState(0);
  const [roadmapVisible, setRoadmapVisible] = useState(false);
  const [socialProofItem, setSocialProofItem] = useState<InventoryItem | null>(null);
  const [alertConfig, setAlertConfig] = useState<CustomAlertConfig>({
    visible: false,
    title: '',
    message: '',
  });

  const [proPassInfo, setProPassInfo] = useState(() => getProPassInfo());
  const [allItemsList, setAllItemsList] = useState<InventoryItem[]>([]);

  const isPro = isProUser();
  const levelInfo = useMemo(() => getLevelInfo(userXP), [userXP]);

  const loadData = useCallback(() => {
    try {
      const data = getAllInventoryItems(activeFilter);
      const allData = getAllInventoryItems('all');
      setItems(data);
      setAllItemsList(allData);
      setTotalDbCount(getTotalInventoryCount());
      setUserXP(getUserXP());
      setProPassInfo(getProPassInfo());
    } catch (e) {
      console.error(e);
    }
  }, [activeFilter]);

  // Chronological index mapping: items sorted by id ASC (oldest first)
  const itemChronologicalMap = useMemo(() => {
    const map = new Map<number, number>();
    const sorted = [...allItemsList].sort((a, b) => (a.id || 0) - (b.id || 0));
    sorted.forEach((item, index) => {
      if (item.id) map.set(item.id, index);
    });
    return map;
  }, [allItemsList]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered by platform & search
  const displayedItems = useMemo(() => {
    let list = items;

    if (platformFilter !== 'all') {
      list = list.filter((item) => {
        if (item.platforms && item.platforms.length > 0) {
          return item.platforms.includes(platformFilter);
        }
        return item.platformId === platformFilter;
      });
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.platformId.toLowerCase().includes(q) ||
        (item.platforms && item.platforms.some((p) => p.toLowerCase().includes(q)))
    );
  }, [items, platformFilter, searchQuery]);

  // Overall statistics for listed inventory (taking multi-quantity into account)
  const inventoryStats = useMemo(() => {
    const active = items.filter((i) => i.status === 'listed');
    const totalInvested = active.reduce(
      (sum, i) => sum + i.purchaseCost * (i.quantity && i.quantity > 0 ? i.quantity : 1),
      0
    );
    const totalPieces = active.reduce(
      (sum, i) => sum + (i.quantity && i.quantity > 0 ? i.quantity : 1),
      0
    );

    let potentialProfit = 0;
    active.forEach((i) => {
      const qty = i.quantity && i.quantity > 0 ? i.quantity : 1;
      const calc = calculateResellProfit({
        sellingPrice: i.targetSellingPrice,
        purchaseCost: i.purchaseCost,
        sellerShippingCost: i.sellerShippingCost,
        packagingCost: i.packagingCost,
        platformId: i.platformId,
      });
      potentialProfit += calc.netProfit * qty;
    });

    return {
      activeCount: active.length,
      totalPieces,
      totalInvested,
      potentialProfit,
    };
  }, [items]);

  const handleDelete = (item: InventoryItem) => {
    if (!item.id) return;

    if (item.status === 'sold') {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const calc = calculateResellProfit({
        sellingPrice: item.actualSellingPrice || item.targetSellingPrice,
        purchaseCost: item.purchaseCost,
        sellerShippingCost: item.sellerShippingCost,
        packagingCost: item.packagingCost,
        platformId: item.platformId,
      });
      const xpDeduct = isPro ? 200 : 100;

      setAlertConfig({
        visible: true,
        title: 'Elimina Capo Venduto',
        message: `Attenzione: eliminando questo capo venduto rimuoverai anche il relativo profitto (+${formatEuro(calc.netProfit * qty)}) dalle statistiche, dal registro vendite e perderai ${xpDeduct} XP.\n\nPassa a Pro per archiviare capi illimitati senza perdere lo storico delle tue vendite!`,
        icon: 'warning',
        iconColor: '#F59E0B',
        iconBgColor: isDark ? '#451A03' : '#FEF3C7',
        buttons: [
          {
            text: 'Passa a Pro ⚡',
            style: 'primary',
            onPress: () => {
              if (onOpenProModal) onOpenProModal();
            },
          },
          {
            text: 'Elimina comunque (perdi dati)',
            style: 'destructive',
            onPress: () => {
              deleteInventoryItem(item.id!);
              deductXP(xpDeduct);
              loadData();
            },
          },
          { text: 'Annulla', style: 'cancel' },
        ],
      });
    } else {
      setAlertConfig({
        visible: true,
        title: 'Elimina Articolo',
        message: `Vuoi davvero eliminare "${item.title}" dall'inventario?\nPerderai ${XP_REWARDS.ITEM_ADDED} XP guadagnati per l'inserimento.`,
        icon: 'trash',
        iconColor: '#EF4444',
        iconBgColor: isDark ? '#450A0A' : '#FEE2E2',
        buttons: [
          {
            text: 'Elimina Articolo',
            style: 'destructive',
            onPress: () => {
              deleteInventoryItem(item.id!);
              deductXP(XP_REWARDS.ITEM_ADDED);
              loadData();
            },
          },
          { text: 'Annulla', style: 'cancel' },
        ],
      });
    }
  };

  const handleOpenAddModal = () => {
    if (!canAddMoreItems(totalDbCount)) {
      setAlertConfig({
        visible: true,
        title: 'Limite Piano Free Raggiunto',
        message: `Hai raggiunto il limite di ${FREE_TIER_ITEM_LIMIT} articoli della versione gratuita.\n\nPassa a ResellTracker Pro per sbloccare l'inventario capi illimitato!`,
        icon: 'lock-closed',
        iconColor: '#6366F1',
        iconBgColor: isDark ? '#1E1B4B' : '#EEF2FF',
        buttons: [
          {
            text: 'Passa a Pro ⚡',
            style: 'primary',
            onPress: () => {
              if (onOpenProModal) onOpenProModal();
            },
          },
          { text: 'Più tardi', style: 'cancel' },
        ],
      });
      return;
    }
    setModalVisible(true);
  };

  const handleMarkAsSold = (item: InventoryItem) => {
    const itemIndex = itemChronologicalMap.get(item.id || 0) ?? 0;
    const isFrozen = !isPro && itemIndex >= FREE_TIER_ITEM_LIMIT;

    if (isFrozen) {
      setAlertConfig({
        visible: true,
        title: '🔒 Articolo Congelato',
        message: `Questo capo fa parte del tuo stock oltre la soglia gratuita di ${FREE_TIER_ITEM_LIMIT} articoli.\n\nI tuoi dati sono al sicuro sul telefono! Sbloccalo subito passando a ResellTracker Pro per registrare la vendita e aggiornare i tuoi guadagni.`,
        icon: 'lock-closed',
        iconColor: '#F59E0B',
        iconBgColor: isDark ? '#451A03' : '#FEF3C7',
        buttons: [
          {
            text: 'Sblocca con Pro ⚡',
            style: 'primary',
            onPress: () => {
              if (onOpenProModal) onOpenProModal();
            },
          },
          { text: 'Più tardi', style: 'cancel' },
        ],
      });
      return;
    }
    setItemToSell(item);
  };

  const renderItemCard = ({ item }: { item: InventoryItem }) => {
    const itemPlatforms = item.platforms && item.platforms.length > 0 ? item.platforms : [item.platformId];
    const primaryPlatform = PLATFORMS.find((p) => p.id === item.platformId) || PLATFORMS[0];
    const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;

    const itemIndex = itemChronologicalMap.get(item.id || 0) ?? 0;
    const isFrozen = !isPro && itemIndex >= FREE_TIER_ITEM_LIMIT;

    const unitCalc = calculateResellProfit({
      sellingPrice: item.status === 'sold' && item.actualSellingPrice ? item.actualSellingPrice : item.targetSellingPrice,
      purchaseCost: item.purchaseCost,
      sellerShippingCost: item.sellerShippingCost,
      packagingCost: item.packagingCost,
      platformId: item.platformId,
    });

    const isSold = item.status === 'sold';
    const totalProfit = unitCalc.netProfit * qty;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
          isSold && (isDark ? { backgroundColor: '#111827' } : styles.cardSold),
          isFrozen && { borderColor: '#F59E0B', opacity: 0.9 },
        ]}
      >
        <View style={styles.cardHeader}>
          {item.photoUri ? (
            <Image source={{ uri: item.photoUri }} style={styles.cardThumb} />
          ) : (
            <View style={[styles.cardThumbPlaceholder, { backgroundColor: isDark ? '#1E293B' : primaryPlatform.badgeBg }]}>
              <Ionicons name="shirt-outline" size={26} color={primaryPlatform.color} />
            </View>
          )}

          <View style={styles.cardInfo}>
            <View style={styles.cardTitleRow}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={1} ellipsizeMode="tail">
                {item.title}
              </Text>
            </View>

            <View style={styles.tagRow}>
              {/* Multiple Platform Badges */}
              {itemPlatforms.map((pId) => {
                const pConfig = PLATFORMS.find((p) => p.id === pId) || PLATFORMS[0];
                return (
                  <View key={pId} style={[styles.platformBadge, { backgroundColor: isDark ? '#1E293B' : pConfig.badgeBg }]}>
                    <Text style={[styles.platformBadgeText, { color: pConfig.color }]}>
                      {pConfig.name}
                    </Text>
                  </View>
                );
              })}

              {/* Quantity Stock Badge */}
              {qty > 1 && (
                <View style={[styles.qtyBadge, { backgroundColor: isDark ? '#312E81' : '#EEF2FF' }]}>
                  <Text style={[styles.qtyBadgeText, { color: '#6366F1' }]}>
                    Qtà: {qty}
                  </Text>
                </View>
              )}

              {/* Frozen Stock Badge (Proposta B) */}
              {isFrozen && (
                <View style={[styles.frozenBadge, { backgroundColor: isDark ? '#451A03' : '#FEF3C7' }]}>
                  <Ionicons name="lock-closed" size={10} color="#D97706" />
                  <Text style={styles.frozenBadgeText}>Congelato (Pro)</Text>
                </View>
              )}

              {/* Status Badge */}
              <View
                style={[
                  styles.statusBadge,
                  isSold
                    ? (isDark ? { backgroundColor: '#064E3B' } : { backgroundColor: '#ECFDF5' })
                    : (isDark ? { backgroundColor: '#1E3A8A' } : { backgroundColor: '#EFF6FF' }),
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    isSold ? { color: isDark ? '#34D399' : '#059669' } : { color: isDark ? '#93C5FD' : '#2563EB' },
                  ]}
                >
                  {isSold ? 'Venduto' : item.status === 'draft' ? 'Bozza' : 'In Vendita'}
                </Text>
              </View>
            </View>

            {/* Financial comparison */}
            <View style={styles.pricesRow}>
              <Text style={[styles.priceAcquired, { color: colors.textSecondary }]}>
                Acquisto: {formatEuro(item.purchaseCost)} {qty > 1 ? '/pz' : ''}
              </Text>
              <Text style={styles.priceArrow}>➔</Text>
              <Text style={[styles.priceTarget, { color: colors.textPrimary }]}>
                {isSold
                  ? `Venduto: ${formatEuro(item.actualSellingPrice || item.targetSellingPrice)}`
                  : `Prezzo: ${formatEuro(item.targetSellingPrice)}`}
                {qty > 1 ? '/pz' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Card Footer: Net profit and quick actions */}
        <View style={[styles.cardFooter, { borderTopColor: colors.cardBorder }]}>
          <View style={styles.profitBadge}>
            <Text style={[styles.profitBadgeLabel, { color: colors.textSecondary }]}>
              {qty > 1 ? 'Guadagno Totale:' : 'Guadagno Netto:'}
            </Text>
            <Text
              style={[
                styles.profitBadgeValue,
                { color: totalProfit > 0 ? '#10B981' : '#EF4444' },
              ]}
            >
              {formatEuro(totalProfit)}
            </Text>
            {qty > 1 && (
              <Text style={[styles.profitUnitText, { color: colors.textMuted }]}>
                ({formatEuro(unitCalc.netProfit)}/pz)
              </Text>
            )}
          </View>

          <View style={styles.cardActions}>
            {/* Social Proof Share Button on Sold Item */}
            {isSold && item.id && (
              <TouchableOpacity
                style={styles.shareActionBtn}
                onPress={() => setSocialProofItem(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="share-social-outline" size={14} color="#6366F1" />
                <Text style={styles.shareActionBtnText}>{strings.inventory.share}</Text>
              </TouchableOpacity>
            )}

            {!isSold && item.id && (
              <TouchableOpacity
                style={[styles.soldActionBtn, isFrozen && { backgroundColor: isDark ? '#1F2937' : '#F1F5F9' }]}
                onPress={() => handleMarkAsSold(item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isFrozen ? 'lock-closed' : 'checkmark-circle-outline'}
                  size={15}
                  color={isFrozen ? '#D97706' : '#059669'}
                />
                <Text style={[styles.soldActionBtnText, isFrozen && { color: '#D97706' }]}>
                  {isFrozen ? strings.inventory.unlockPro : strings.inventory.markSold}
                </Text>
              </TouchableOpacity>
            )}

            {item.id && (
              <TouchableOpacity
                style={styles.deleteActionBtn}
                onPress={() => handleDelete(item)}
                activeOpacity={0.7}
              >
                <Ionicons name="trash-outline" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, 16) }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerSubtitle, { color: colors.primary }]}>{strings.inventory.headerSubtitle}</Text>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{strings.inventory.headerTitle}</Text>
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleOpenAddModal}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addBtnText}>{strings.inventory.addItem}</Text>
        </TouchableOpacity>
      </View>

      {/* Slot Counter & Pro Status Badge */}
      {!isPro ? (
        <TouchableOpacity
          style={[
            styles.slotCard,
            {
              backgroundColor:
                totalDbCount >= 15
                  ? (isDark ? '#450A0A' : '#FEF2F2')
                  : totalDbCount >= 13
                  ? (isDark ? '#451A03' : '#FFFBEB')
                  : (isDark ? '#06281E' : '#ECFDF5'),
              borderColor:
                totalDbCount >= 15
                  ? (isDark ? '#DC2626' : '#FECACA')
                  : totalDbCount >= 13
                  ? (isDark ? '#D97706' : '#FDE68A')
                  : (isDark ? '#059669' : '#A7F3D0'),
            },
          ]}
          onPress={() => {
            if (onOpenProModal) onOpenProModal();
          }}
          activeOpacity={0.8}
        >
          <View style={styles.slotRow}>
            <View style={styles.slotLeft}>
              <Ionicons
                name={totalDbCount >= 15 ? 'lock-closed' : totalDbCount >= 13 ? 'alert-circle' : 'cube-outline'}
                size={16}
                color={
                  totalDbCount >= 15
                    ? '#EF4444'
                    : totalDbCount >= 13
                    ? '#F59E0B'
                    : '#10B981'
                }
              />
              <Text
                style={[
                  styles.slotText,
                  {
                    color:
                      totalDbCount >= 15
                        ? (isDark ? '#F87171' : '#DC2626')
                        : totalDbCount >= 13
                        ? (isDark ? '#FBBF24' : '#D97706')
                        : (isDark ? '#34D399' : '#059669'),
                  },
                ]}
              >
                {totalDbCount >= 15
                  ? `${totalDbCount} / ${FREE_TIER_ITEM_LIMIT} Capi • Limite Raggiunto!`
                  : totalDbCount >= 13
                  ? `${totalDbCount} / ${FREE_TIER_ITEM_LIMIT} Capi • Spazio quasi esaurito`
                  : `${totalDbCount} / ${FREE_TIER_ITEM_LIMIT} Capi (Piano Free)`}
              </Text>
            </View>

            <View style={styles.slotUpgradeBtn}>
              <Text style={styles.slotUpgradeText}>
                {totalDbCount >= 13 ? 'Passa a Pro ⚡' : 'Sblocca Pro'}
              </Text>
              <Ionicons name="chevron-forward" size={12} color="#6366F1" />
            </View>
          </View>

          {/* Micro Progress Track */}
          <View style={[styles.slotProgressTrack, { backgroundColor: isDark ? '#1E293B' : '#E2E8F0' }]}>
            <View
              style={[
                styles.slotProgressFill,
                {
                  width: `${Math.min(100, Math.round((totalDbCount / FREE_TIER_ITEM_LIMIT) * 100))}%`,
                  backgroundColor:
                    totalDbCount >= 15
                      ? '#EF4444'
                      : totalDbCount >= 13
                      ? '#F59E0B'
                      : '#10B981',
                },
              ]}
            />
          </View>
        </TouchableOpacity>
      ) : proPassInfo.isActive && !proPassInfo.isPermanentPro ? (
        <TouchableOpacity
          style={[styles.slotCardProPass, { backgroundColor: isDark ? '#1E1B4B' : '#FEF3C7', borderColor: '#F59E0B' }]}
          onPress={() => {
            setAlertConfig({
              visible: true,
              title: '⚡ Pro Pass Attivo!',
              message: `Hai sbloccato ${proPassInfo.remainingFormatted} di accesso Pro completo per essere salito di livello!\n\nGoditi stock illimitato, export CSV senza limiti e tutte le funzioni esclusive.`,
              icon: 'flash',
              iconColor: '#F59E0B',
              iconBgColor: isDark ? '#451A03' : '#FEF3C7',
              buttons: [
                {
                  text: 'Passa a Pro per Sempre (5,99€)',
                  style: 'primary',
                  onPress: () => {
                    if (onOpenProModal) onOpenProModal();
                  },
                },
                { text: 'Continua a usare il Pass', style: 'cancel' },
              ],
            });
          }}
          activeOpacity={0.8}
        >
          <View style={styles.slotRow}>
            <View style={styles.slotLeft}>
              <Ionicons name="flash" size={16} color="#D97706" />
              <Text style={styles.slotProPassText}>
                Pro Pass Attivo • <Text style={{ fontWeight: '800' }}>{proPassInfo.remainingFormatted} rimasti</Text>
              </Text>
            </View>
            <View style={styles.slotProPassBadge}>
              <Text style={styles.slotProPassBadgeText}>VIP ⚡</Text>
            </View>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={[styles.slotCardPro, { backgroundColor: isDark ? '#1E1B4B' : '#FEF3C7', borderColor: '#F59E0B' }]}>
          <View style={styles.slotRow}>
            <View style={styles.slotLeft}>
              <Ionicons name="sparkles" size={16} color="#F59E0B" />
              <Text style={styles.slotProText}>
                ResellTracker VIP Pro • Capi Illimitati ✨
              </Text>
            </View>
            <View style={styles.slotProBadge}>
              <Text style={styles.slotProBadgeText}>ILLIMITATO</Text>
            </View>
          </View>
        </View>
      )}

      {/* Reseller XP & Level Pill - Tap to view 10 Career Levels */}
      <TouchableOpacity
        style={[styles.levelCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
        onPress={() => setRoadmapVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.levelRow}>
          <View style={styles.levelInfoGroup}>
            <Text style={styles.levelBadgeEmoji}>{levelInfo.badge}</Text>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.levelTitleText, { color: colors.textPrimary }]}>
                  {levelInfo.title}
                </Text>
                {isPro && (
                  <View style={styles.proBoostPill}>
                    <Text style={styles.proBoostText}>2x XP ⚡</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.levelSubText, { color: colors.textMuted }]}>
                {levelInfo.nextLevelTitle
                  ? `Mancano ${levelInfo.xpToNextLevel} XP a "${levelInfo.nextLevelTitle}"`
                  : 'Livello massimo raggiunto!'}
              </Text>
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.levelXPBadge, { color: colors.primary }]}>
              {levelInfo.currentXP} XP
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
              <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800' }}>Roadmap</Text>
              <Ionicons name="chevron-forward" size={12} color={colors.primary} />
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={[styles.levelTrack, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
          <View
            style={[
              styles.levelFill,
              { width: `${Math.round(levelInfo.progress * 100)}%`, backgroundColor: levelInfo.badgeColor },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* KPI Overview Card */}
      <View style={[styles.kpiContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>
            {inventoryStats.activeCount} <Text style={{ fontSize: 11, fontWeight: '600' }}>({inventoryStats.totalPieces} pz)</Text>
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Capi Attivi</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{formatEuro(inventoryStats.totalInvested)}</Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Capitale Fermo</Text>
        </View>
        <View style={[styles.kpiDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.kpiBox}>
          <Text style={[styles.kpiValue, { color: '#10B981' }]}>
            {formatEuro(inventoryStats.potentialProfit)}
          </Text>
          <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>Profitto Previsto</Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder={strings.inventory.searchPlaceholder}
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filtersRow}>
        {(['listed', 'sold', 'draft', 'all'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveFilter(tab)}
            style={[
              styles.filterChip,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              activeFilter === tab && { backgroundColor: isDark ? colors.primary : '#0F172A' },
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                { color: colors.textSecondary },
                activeFilter === tab && { color: '#FFFFFF', fontWeight: '700' },
              ]}
            >
              {tab === 'all'
                ? strings.inventory.filterAll
                : tab === 'listed'
                ? strings.inventory.filterListed
                : tab === 'sold'
                ? strings.inventory.filterSold
                : strings.inventory.filterDraft}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Platform Quick Filter Scroll (Killer Feature J) */}
      <View style={styles.platformFilterContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.platformFilterScroll}
        >
          <TouchableOpacity
            style={[
              styles.platformFilterChip,
              { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
              platformFilter === 'all' && { backgroundColor: isDark ? '#312E81' : '#EEF2FF', borderColor: '#6366F1' },
            ]}
            onPress={() => setPlatformFilter('all')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.platformFilterChipText,
                { color: isDark ? '#94A3B8' : '#64748B' },
                platformFilter === 'all' && { color: '#6366F1', fontWeight: '800' },
              ]}
            >
              {strings.inventory.allPlatforms}
            </Text>
          </TouchableOpacity>

          {PLATFORMS.map((p) => {
            const isSelected = platformFilter === p.id;
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.platformFilterChip,
                  { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
                  isSelected && {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: p.color,
                  },
                ]}
                onPress={() => setPlatformFilter(isSelected ? 'all' : p.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.dot, { backgroundColor: p.color }]} />
                <Text
                  style={[
                    styles.platformFilterChipText,
                    { color: isSelected ? p.color : colors.textSecondary },
                    isSelected && { fontWeight: '800' },
                  ]}
                >
                  {p.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Items List */}
      <FlatList
        data={displayedItems}
        keyExtractor={(item) => (item.id ? item.id.toString() : Math.random().toString())}
        renderItem={renderItemCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="shirt-outline" size={60} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Nessun articolo trovato</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || platformFilter !== 'all'
                ? 'Nessun risultato corrisponde ai filtri selezionati.'
                : 'Inizia a catalogare i tuoi capi per tenere traccia delle tue vendite.'}
            </Text>
            {!searchQuery && platformFilter === 'all' && (
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={handleOpenAddModal}
              >
                <Text style={styles.emptyAddBtnText}>+ Aggiungi il primo articolo</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Add Item Modal */}
      <AddItemModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onItemAdded={loadData}
      />

      {/* Custom Modern Alert / Confirmation Modal */}
      <CustomAlertModal
        config={alertConfig}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />

      {/* 10-Tier Reseller Club Career Roadmap Modal */}
      <CareerRoadmapModal
        visible={roadmapVisible}
        currentLevelInfo={levelInfo}
        onClose={() => setRoadmapVisible(false)}
        onOpenProModal={onOpenProModal}
      />

      {/* Mark As Sold Custom Modal */}
      <MarkSoldModal
        visible={itemToSell !== null}
        item={itemToSell}
        onClose={() => setItemToSell(null)}
        onSuccess={() => {
          setItemToSell(null);
          loadData();
        }}
      />

      {/* Social Proof Story Card Modal */}
      <SocialProofModal
        visible={socialProofItem !== null}
        item={socialProofItem}
        onClose={() => setSocialProofItem(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  slotCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotCardPro: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  slotProText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  slotProBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotProBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  slotUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  slotUpgradeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6366F1',
  },
  slotProgressTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  slotProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  levelCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  levelInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  levelBadgeEmoji: {
    fontSize: 26,
  },
  levelTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  levelSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  proBoostPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#F59E0B',
  },
  proBoostText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  levelXPBadge: {
    fontSize: 13,
    fontWeight: '800',
  },
  levelTrack: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelFill: {
    height: '100%',
    borderRadius: 3,
  },
  kpiContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  kpiBox: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  platformFilterContainer: {
    marginBottom: 10,
  },
  platformFilterScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  platformFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 6,
  },
  platformFilterChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 110,
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 1,
  },
  cardSold: {
    opacity: 0.85,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  cardThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
  },
  cardThumbPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: 4,
  },
  platformBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  platformBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  qtyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  qtyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pricesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priceAcquired: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceArrow: {
    fontSize: 10,
    color: '#94A3B8',
  },
  priceTarget: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profitBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  profitBadgeLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  profitBadgeValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  profitUnitText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  soldActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  soldActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  deleteActionBtn: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  emptyAddBtn: {
    marginTop: 18,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  frozenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  frozenBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  shareActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  shareActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6366F1',
  },
  slotCardProPass: {
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  slotProPassText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  slotProPassBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  slotProPassBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = [
  '#FFD700', // Gold
  '#10B981', // Emerald Profit Green
  '#6366F1', // Royal Violet/Indigo
  '#F43F5E', // Rose Ruby
  '#06B6D4', // Vibrant Cyan
  '#F59E0B', // Amber
  '#EC4899', // Hot Pink
  '#3B82F6', // Electric Blue
];

interface ParticleConfig {
  id: number;
  color: string;
  width: number;
  height: number;
  isCircle: boolean;
  startX: number;
  startY: number;
  targetX: number;
  peakY: number;
  fallY: number;
  rotationEnd: number;
  rotationYEnd: number;
}

interface ConfettiCannonProps {
  active: boolean;
  onFinish?: () => void;
  count?: number;
}

export const ConfettiCannon: React.FC<ConfettiCannonProps> = ({
  active,
  onFinish,
  count = 46,
}) => {
  const animProgress = useRef(new Animated.Value(0)).current;
  const isAnimatingRef = useRef(false);
  const particlesRef = useRef<ParticleConfig[]>([]);

  // Initialize particles once with realistic physics parameters
  if (particlesRef.current.length === 0) {
    const list: ParticleConfig[] = [];
    for (let i = 0; i < count; i++) {
      const isLeftCannon = i % 2 === 0;
      const startX = isLeftCannon ? SCREEN_WIDTH * 0.18 : SCREEN_WIDTH * 0.82;
      const startY = SCREEN_HEIGHT * 0.92;

      // Soft parabolic trajectory: 42° to 78° from left, 102° to 138° from right
      const angle = isLeftCannon
        ? (Math.random() * 36 + 42) * (Math.PI / 180)
        : (Math.random() * 36 + 102) * (Math.PI / 180);

      const velocity = Math.random() * 320 + 420;
      const targetX = startX + Math.cos(angle) * (velocity * 0.85) + (Math.random() * 50 - 25);
      const peakY = Math.max(50, startY - Math.sin(angle) * velocity);
      const fallY = SCREEN_HEIGHT + 40;

      list.push({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: Math.random() > 0.4 ? Math.random() * 5 + 7 : Math.random() * 8 + 8,
        height: Math.random() > 0.4 ? Math.random() * 7 + 12 : Math.random() * 8 + 8,
        isCircle: Math.random() < 0.28,
        startX,
        startY,
        targetX,
        peakY,
        fallY,
        rotationEnd: (Math.random() - 0.5) * 1080,
        rotationYEnd: (Math.random() - 0.5) * 900,
      });
    }
    particlesRef.current = list;
  }

  useEffect(() => {
    if (active) {
      // Prevent jarring restart: if already animating, let current celebration continue smoothly!
      if (isAnimatingRef.current) {
        return;
      }
      isAnimatingRef.current = true;
      animProgress.setValue(0);

      // Relaxed, floaty duration (3.4s) with smooth natural deceleration
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 3400,
        easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
        useNativeDriver: true,
      }).start(({ finished }) => {
        isAnimatingRef.current = false;
        if (finished && onFinish) {
          onFinish();
        }
      });
    } else {
      isAnimatingRef.current = false;
    }
  }, [active, animProgress, onFinish]);

  if (!active) return null;

  // Gentle fade-in at launch (0 -> 0.08) and smooth fade-out at end (0.78 -> 1)
  const containerOpacity = animProgress.interpolate({
    inputRange: [0, 0.08, 0.78, 1],
    outputRange: [0, 1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: containerOpacity }]}>
        {particlesRef.current.map((p) => {
          // X: Initial burst, then gentle alternating horizontal sway
          const translateX = animProgress.interpolate({
            inputRange: [0, 0.35, 0.65, 1],
            outputRange: [
              p.startX,
              p.targetX,
              p.targetX + (p.id % 2 === 0 ? 18 : -18),
              p.targetX + (p.id % 2 === 0 ? -12 : 12),
            ],
          });

          // Y: Launch smoothly up to peak, then float down with gravity
          const translateY = animProgress.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [p.startY, p.peakY, p.fallY],
          });

          // Scale: Smoothly blooms into view during emergence
          const scale = animProgress.interpolate({
            inputRange: [0, 0.1, 1],
            outputRange: [0.35, 1, 0.92],
            extrapolate: 'clamp',
          });

          const rotate = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.rotationEnd}deg`],
          });

          const rotateY = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.rotationYEnd}deg`],
          });

          return (
            <Animated.View
              key={p.id}
              style={[
                styles.particle,
                {
                  width: p.width,
                  height: p.height,
                  backgroundColor: p.color,
                  borderRadius: p.isCircle ? p.width / 2 : 2,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                    { rotate },
                    { rotateY },
                  ],
                },
              ]}
            />
          );
        })}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
    elevation: 25,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

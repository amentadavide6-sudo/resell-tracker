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
  const particlesRef = useRef<ParticleConfig[]>([]);

  // Initialize particles once
  if (particlesRef.current.length === 0) {
    const list: ParticleConfig[] = [];
    for (let i = 0; i < count; i++) {
      const isLeftCannon = i % 2 === 0;
      const startX = isLeftCannon ? SCREEN_WIDTH * 0.15 : SCREEN_WIDTH * 0.85;
      const startY = SCREEN_HEIGHT * 0.82;

      // Angles: left fires up-right (40° to 80°), right fires up-left (100° to 140°)
      const angle = isLeftCannon
        ? (Math.random() * 40 + 40) * (Math.PI / 180)
        : (Math.random() * 40 + 100) * (Math.PI / 180);

      const velocity = Math.random() * 380 + 460;
      const targetX = startX + Math.cos(angle) * (velocity * 0.85) + (Math.random() * 60 - 30);
      const peakY = Math.max(40, startY - Math.sin(angle) * velocity);
      const fallY = SCREEN_HEIGHT + 30;

      list.push({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        width: Math.random() > 0.4 ? Math.random() * 5 + 7 : Math.random() * 8 + 8,
        height: Math.random() > 0.4 ? Math.random() * 7 + 11 : Math.random() * 8 + 8,
        isCircle: Math.random() < 0.28,
        startX,
        startY,
        targetX,
        peakY,
        fallY,
        rotationEnd: (Math.random() - 0.5) * 1440,
        rotationYEnd: (Math.random() - 0.5) * 1080,
      });
    }
    particlesRef.current = list;
  }

  useEffect(() => {
    if (active) {
      animProgress.setValue(0);
      Animated.timing(animProgress, {
        toValue: 1,
        duration: 2400, // Exactly 2.4 seconds (under 3s limit)
        easing: Easing.bezier(0.12, 0.8, 0.32, 1),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && onFinish) {
          onFinish();
        }
      });
    }
  }, [active, animProgress, onFinish]);

  if (!active) return null;

  // Smooth fade out in the last phase of the animation
  const containerOpacity = animProgress.interpolate({
    inputRange: [0, 0.72, 1],
    outputRange: [1, 1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: containerOpacity }]}>
        {particlesRef.current.map((p) => {
          // X: shoot to targetX then drift gently
          const translateX = animProgress.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [p.startX, p.targetX, p.targetX + (p.id % 2 === 0 ? 32 : -32)],
          });

          // Y: launch to peakY, then gravity fall
          const translateY = animProgress.interpolate({
            inputRange: [0, 0.35, 1],
            outputRange: [p.startY, p.peakY, p.fallY],
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

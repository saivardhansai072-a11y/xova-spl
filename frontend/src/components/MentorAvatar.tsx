import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
  withDelay, Easing, interpolate
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width: screenW } = Dimensions.get('window');

type Props = {
  style?: 'cyberpunk' | 'anime' | 'jarvis';
  size?: 'small' | 'medium' | 'large';
  speaking?: boolean;
  thinking?: boolean;
  listening?: boolean;
};

export default function MentorAvatar({ style = 'cyberpunk', size = 'medium', speaking = false, thinking = false, listening = false }: Props) {
  // Animation values
  const breathe = useSharedValue(0);
  const blink = useSharedValue(1);
  const mouth = useSharedValue(0);
  const glow = useSharedValue(0);
  const pulse = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);

  useEffect(() => {
    // Breathing
    breathe.value = withRepeat(withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }), -1, true);
    // Eye blink
    blink.value = withRepeat(withSequence(
      withDelay(3000, withTiming(0, { duration: 100 })),
      withTiming(1, { duration: 100 }),
    ), -1, false);
    // Glow pulse
    glow.value = withRepeat(withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }), -1, true);
    // Rings
    ring1.value = withRepeat(withTiming(1, { duration: 4000, easing: Easing.linear }), -1, false);
    ring2.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
  }, []);

  useEffect(() => {
    if (speaking) {
      mouth.value = withRepeat(withTiming(1, { duration: 200 }), -1, true);
    } else {
      mouth.value = withTiming(0, { duration: 200 });
    }
  }, [speaking]);

  useEffect(() => {
    if (thinking) {
      pulse.value = withRepeat(withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 300 });
    }
  }, [thinking]);

  const sizeMap = { small: 100, medium: 160, large: 240 };
  const avatarSize = sizeMap[size];

  const bodyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.02]) }],
  }));

  const eyeStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: blink.value }],
  }));

  const mouthStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: interpolate(mouth.value, [0, 1], [0.3, 1]) }],
    opacity: interpolate(mouth.value, [0, 1], [0.5, 1]),
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [0.3, 0.8]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.1]) }],
  }));

  const thinkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.4, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]) }],
  }));

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(ring1.value, [0, 1], [0, 360])}deg` }],
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(ring2.value, [0, 1], [360, 0])}deg` }],
  }));

  const mainColor = style === 'anime' ? '#FF6B9D' : style === 'jarvis' ? '#3A86FF' : COLORS.primary.main;
  const secColor = style === 'anime' ? '#FFD93D' : style === 'jarvis' ? '#FFFFFF' : COLORS.secondary.main;

  return (
    <View style={[styles.container, { width: avatarSize, height: avatarSize }]}>
      {/* Outer glow */}
      <Animated.View style={[styles.outerGlow, glowStyle, { width: avatarSize + 40, height: avatarSize + 40, borderRadius: (avatarSize + 40) / 2, borderColor: mainColor + '30' }]} />

      {/* Rotating rings */}
      <Animated.View style={[styles.ring, ringStyle1, { width: avatarSize + 20, height: avatarSize + 20, borderRadius: (avatarSize + 20) / 2, borderColor: mainColor + '20' }]}>
        <View style={[styles.ringDot, { backgroundColor: mainColor, top: 0, left: '50%' }]} />
      </Animated.View>
      <Animated.View style={[styles.ring, ringStyle2, { width: avatarSize + 10, height: avatarSize + 10, borderRadius: (avatarSize + 10) / 2, borderColor: secColor + '15' }]}>
        <View style={[styles.ringDot, { backgroundColor: secColor, bottom: 0, right: '50%' }]} />
      </Animated.View>

      {/* Main body */}
      <Animated.View style={[bodyStyle, thinking ? thinkStyle : {}, styles.body, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2, borderColor: mainColor + '60' }]}>
        {/* Face background */}
        <View style={[styles.faceInner, { backgroundColor: mainColor + '08', borderRadius: avatarSize / 2 }]}>
          {/* Icon */}
          <MaterialCommunityIcons
            name={style === 'anime' ? 'emoticon-cool-outline' : style === 'jarvis' ? 'atom' : 'robot-happy-outline'}
            size={avatarSize * 0.35}
            color={mainColor}
          />

          {/* Eyes */}
          <View style={styles.eyeRow}>
            <Animated.View style={[styles.eye, eyeStyle, { backgroundColor: mainColor, width: avatarSize * 0.08, height: avatarSize * 0.06 }]} />
            <Animated.View style={[styles.eye, eyeStyle, { backgroundColor: mainColor, width: avatarSize * 0.08, height: avatarSize * 0.06 }]} />
          </View>

          {/* Mouth */}
          <Animated.View style={[styles.mouth, mouthStyle, { backgroundColor: mainColor + '80', width: avatarSize * 0.15, height: avatarSize * 0.04 }]} />
        </View>

        {/* Status indicator */}
        <View style={[styles.statusDot, { backgroundColor: thinking ? COLORS.accent.warning : speaking ? COLORS.accent.success : listening ? COLORS.accent.info : COLORS.accent.success }]} />
      </Animated.View>

      {/* Status text */}
      {(thinking || speaking || listening) && (
        <Text style={[styles.statusText, { color: mainColor }]}>
          {thinking ? 'Thinking...' : speaking ? 'Speaking' : 'Listening...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center' },
  outerGlow: { position: 'absolute', borderWidth: 1 },
  ring: { position: 'absolute', borderWidth: 1, borderStyle: 'dashed' },
  ringDot: { position: 'absolute', width: 4, height: 4, borderRadius: 2 },
  body: { borderWidth: 2, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  faceInner: { flex: 1, alignItems: 'center', justifyContent: 'center', width: '100%' },
  eyeRow: { flexDirection: 'row', gap: 16, marginTop: 4 },
  eye: { borderRadius: 4 },
  mouth: { borderRadius: 4, marginTop: 4 },
  statusDot: { position: 'absolute', bottom: 8, right: 8, width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: COLORS.background.default },
  statusText: { fontSize: 11, fontWeight: '600', marginTop: 8, letterSpacing: 1 },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence,
  withDelay, Easing, interpolate, cancelAnimation
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { CharacterType, getCharacterById, DEFAULT_CHARACTER } from '../constants/characters';

const { width: screenW } = Dimensions.get('window');

type Props = {
  characterId?: string;
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';
  speaking?: boolean;
  thinking?: boolean;
  listening?: boolean;
  showStatus?: boolean;
  showName?: boolean;
  glowIntensity?: 'low' | 'medium' | 'high';
};

export default function MentorAvatar({
  characterId,
  size = 'medium',
  speaking = false,
  thinking = false,
  listening = false,
  showStatus = true,
  showName = false,
  glowIntensity = 'medium',
}: Props) {
  const character = characterId ? getCharacterById(characterId) : DEFAULT_CHARACTER;
  const char = character || DEFAULT_CHARACTER;

  // Animation values
  const breathe = useSharedValue(0);
  const glow = useSharedValue(0);
  const pulse = useSharedValue(0);
  const ring1 = useSharedValue(0);
  const ring2 = useSharedValue(0);
  const speakWave = useSharedValue(0);
  const thinkPulse = useSharedValue(0);
  const floatY = useSharedValue(0);

  useEffect(() => {
    // Breathing animation
    breathe.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    // Glow pulse
    glow.value = withRepeat(
      withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    // Rings rotation
    ring1.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
    ring2.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.linear }),
      -1,
      false
    );
    // Floating effect
    floatY.value = withRepeat(
      withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    return () => {
      cancelAnimation(breathe);
      cancelAnimation(glow);
      cancelAnimation(ring1);
      cancelAnimation(ring2);
      cancelAnimation(floatY);
    };
  }, []);

  // Speaking animation
  useEffect(() => {
    if (speaking) {
      speakWave.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 150 }),
          withTiming(0.3, { duration: 150 }),
          withTiming(0.8, { duration: 100 }),
          withTiming(0.2, { duration: 100 })
        ),
        -1,
        false
      );
    } else {
      speakWave.value = withTiming(0, { duration: 200 });
    }
  }, [speaking]);

  // Thinking animation
  useEffect(() => {
    if (thinking) {
      thinkPulse.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      thinkPulse.value = withTiming(0, { duration: 300 });
    }
  }, [thinking]);

  const sizeMap = { tiny: 48, small: 72, medium: 120, large: 180, xlarge: 240 };
  const avatarSize = sizeMap[size];
  const borderWidth = size === 'tiny' ? 1.5 : size === 'small' ? 2 : 3;
  const glowOpacityBase = glowIntensity === 'low' ? 0.2 : glowIntensity === 'high' ? 0.6 : 0.4;

  // Animated styles
  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(floatY.value, [0, 1], [0, -4]) },
      { scale: interpolate(breathe.value, [0, 1], [1, 1.02]) },
    ],
  }));

  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(glow.value, [0, 1], [glowOpacityBase, glowOpacityBase + 0.3]),
    transform: [{ scale: interpolate(glow.value, [0, 1], [1, 1.08]) }],
  }));

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(ring1.value, [0, 1], [0, 360])}deg` }],
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(ring2.value, [0, 1], [360, 0])}deg` }],
  }));

  const thinkingStyle = useAnimatedStyle(() => ({
    opacity: thinking ? interpolate(thinkPulse.value, [0, 1], [0.6, 1]) : 1,
    transform: thinking ? [{ scale: interpolate(thinkPulse.value, [0, 1], [0.98, 1.02]) }] : [{ scale: 1 }],
  }));

  const speakingBorderStyle = useAnimatedStyle(() => ({
    borderWidth: speaking ? interpolate(speakWave.value, [0, 1], [borderWidth, borderWidth + 2]) : borderWidth,
    shadowOpacity: speaking ? interpolate(speakWave.value, [0, 1], [0.3, 0.8]) : 0.3,
  }));

  const statusColor = thinking
    ? COLORS.accent.warning
    : speaking
    ? COLORS.accent.success
    : listening
    ? COLORS.accent.info
    : COLORS.accent.success;

  return (
    <View style={[styles.wrapper, { width: avatarSize + 40, height: avatarSize + 60 }]}>
      <Animated.View style={[styles.container, containerStyle, { width: avatarSize + 24, height: avatarSize + 24 }]}>
        {/* Outer glow */}
        <Animated.View
          style={[
            styles.outerGlow,
            outerGlowStyle,
            {
              width: avatarSize + 32,
              height: avatarSize + 32,
              borderRadius: (avatarSize + 32) / 2,
              backgroundColor: char.color + '20',
              shadowColor: char.color,
            },
          ]}
        />

        {/* Rotating rings */}
        {size !== 'tiny' && (
          <>
            <Animated.View
              style={[
                styles.ring,
                ringStyle1,
                {
                  width: avatarSize + 20,
                  height: avatarSize + 20,
                  borderRadius: (avatarSize + 20) / 2,
                  borderColor: char.color + '25',
                },
              ]}
            >
              <View style={[styles.ringDot, { backgroundColor: char.color }]} />
            </Animated.View>
            <Animated.View
              style={[
                styles.ring,
                ringStyle2,
                {
                  width: avatarSize + 12,
                  height: avatarSize + 12,
                  borderRadius: (avatarSize + 12) / 2,
                  borderColor: char.color + '15',
                },
              ]}
            >
              <View style={[styles.ringDot, styles.ringDotBottom, { backgroundColor: char.color }]} />
            </Animated.View>
          </>
        )}

        {/* Main avatar */}
        <Animated.View
          style={[
            styles.avatarContainer,
            thinkingStyle,
            speakingBorderStyle,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
              borderColor: char.color,
              shadowColor: char.color,
            },
          ]}
        >
          {/* Background gradient */}
          <LinearGradient
            colors={[char.color + '30', 'transparent', char.color + '10']}
            style={[styles.avatarGradient, { borderRadius: avatarSize / 2 }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Character image */}
          {char.image ? (
            <Image
              source={{ uri: char.image }}
              style={[styles.avatarImage, { width: avatarSize - 4, height: avatarSize - 4, borderRadius: (avatarSize - 4) / 2 }]}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.placeholderAvatar, { backgroundColor: char.color + '15' }]}>
              <MaterialCommunityIcons
                name="account-plus"
                size={avatarSize * 0.4}
                color={char.color}
              />
            </View>
          )}

          {/* Status indicator */}
          {showStatus && (
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: statusColor,
                  width: size === 'tiny' ? 8 : size === 'small' ? 10 : 14,
                  height: size === 'tiny' ? 8 : size === 'small' ? 10 : 14,
                  borderRadius: size === 'tiny' ? 4 : size === 'small' ? 5 : 7,
                  bottom: size === 'tiny' ? 2 : size === 'small' ? 4 : 8,
                  right: size === 'tiny' ? 2 : size === 'small' ? 4 : 8,
                },
              ]}
            />
          )}
        </Animated.View>
      </Animated.View>

      {/* Name label */}
      {showName && size !== 'tiny' && (
        <Text style={[styles.nameLabel, { color: char.color }]}>{char.name}</Text>
      )}

      {/* Status text */}
      {showStatus && (thinking || speaking || listening) && size !== 'tiny' && size !== 'small' && (
        <Text style={[styles.statusText, { color: char.color }]}>
          {thinking ? '🤔 Thinking...' : speaking ? '🗣️ Speaking' : '👂 Listening...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerGlow: {
    position: 'absolute',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 8,
  },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  ringDot: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    top: 0,
    left: '50%',
    marginLeft: -3,
  },
  ringDotBottom: {
    top: undefined,
    bottom: 0,
    left: undefined,
    right: '50%',
    marginRight: -3,
  },
  avatarContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 10,
  },
  avatarGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  avatarImage: {
    position: 'absolute',
  },
  placeholderAvatar: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
  },
  statusDot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.background.default,
  },
  nameLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});

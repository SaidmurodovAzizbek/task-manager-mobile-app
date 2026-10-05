/**
 * RewardToast.js - Task bajarilganda chiqadigan "+31 ball" xabari
 *
 * Pastdan "sakrab" chiqadi, bir-ikki soniya turadi va o'zi yo'qoladi.
 * Ichida (bo'lsa):
 * - muddatida bajarilgani uchun bonus;
 * - yangi daraja;
 * - seriya (🔥) davom etgani.
 *
 * Task qayta "bajarilmagan" qilinsa - xira "−31 ball" ko'rinadi.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, StyleSheet, Platform } from 'react-native';

import { colors } from '../theme/colors';
import { formatPoints } from '../utils/pointsUtils';

// Maqtov so'zlari - har safar bir xil bo'lmasin
const PRAISES = ['Barakalla!', "Zo'r ish!", 'Ajoyib!', 'Davom eting!', 'Qoyil!', 'Super!'];

/**
 * RewardToast komponenti
 *
 * @param {Object} props
 * @param {Object|null} props.toast - describeToggle natijasi + { id } (yangi xabar = yangi id)
 * @param {number} props.bottom - Ekran pastidan masofa
 * @param {Function} props.onHide - Xabar yo'qolgach (barqaror funksiya bo'lishi kerak)
 */
const RewardToast = ({ toast, bottom, onHide }) => {
  const anim = useRef(new Animated.Value(0)).current;

  // Maqtov xabar paydo bo'lganda bir marta tanlanadi
  const praise = useRef(PRAISES[0]);

  useEffect(() => {
    if (!toast) return undefined;

    praise.current = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    anim.setValue(0);

    // Yangi daraja - bayram, uzoqroq turadi
    const hold = toast.levelUp ? 2800 : toast.completed ? 1800 : 1300;

    const animation = Animated.sequence([
      Animated.spring(anim, {
        toValue: 1,
        friction: 6,
        tension: 140,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.delay(hold),
      Animated.timing(anim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) onHide();
    });

    return () => animation.stop();
  }, [toast, anim, onHide]);

  if (!toast) return null;

  const gained = toast.completed;

  return (
    <View style={[styles.wrapper, { bottom }]} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          !gained && styles.toastLoss,
          toast.levelUp && styles.toastLevel,
          {
            opacity: anim,
            transform: [
              { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) },
              { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) },
            ],
          },
        ]}
        accessibilityLiveRegion="polite"
      >
        <View style={styles.mainRow}>
          <Text style={[styles.points, !gained && styles.pointsLoss]}>
            {gained ? '+' : '−'}
            {formatPoints(Math.abs(toast.points))}
          </Text>

          <View>
            <Text style={styles.unit}>ball</Text>
            <Text style={styles.caption}>
              {gained ? praise.current : 'Task qayta ochildi'}
            </Text>
          </View>
        </View>

        {toast.bonus > 0 ? (
          <Text style={styles.extra}>⚡ Muddatida bajarildi: +{toast.bonus} bonus</Text>
        ) : null}

        {toast.streak ? (
          <Text style={styles.extra}>🔥 {toast.streak} kunlik seriya!</Text>
        ) : null}

        {toast.levelUp ? (
          <Text style={styles.levelUp}>
            {toast.levelUp.icon} Yangi daraja: {toast.levelUp.level} · {toast.levelUp.title}!
          </Text>
        ) : null}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
  },

  toast: {
    minWidth: 190,
    maxWidth: '100%',
    backgroundColor: colors.text,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.gold,
    shadowColor: '#091E42',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  toastLoss: {
    borderColor: 'transparent',
    backgroundColor: '#42526E',
  },

  toastLevel: {
    backgroundColor: colors.primaryDark,
  },

  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  points: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.gold,
  },

  pointsLoss: {
    color: colors.textInverse,
    fontSize: 24,
  },

  unit: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textInverse,
  },

  caption: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
  },

  extra: {
    fontSize: 12.5,
    color: colors.textInverse,
    textAlign: 'center',
    marginTop: 6,
  },

  levelUp: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.gold,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default RewardToast;

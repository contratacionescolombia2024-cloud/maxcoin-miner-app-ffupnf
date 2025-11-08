
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { IconSymbol } from '@/components/IconSymbol';
import { BlurView } from 'expo-blur';
import { useRouter, usePathname } from 'expo-router';
import { colors } from '@/styles/commonStyles';

export interface TabBarItem {
  name: string;
  route: string;
  icon: string;
  label: string;
}

interface FloatingTabBarProps {
  tabs: TabBarItem[];
  containerWidth?: number;
  borderRadius?: number;
  bottomMargin?: number;
}

export default function FloatingTabBar({
  tabs,
  containerWidth = Dimensions.get('window').width - 40,
  borderRadius = 25,
  bottomMargin = 20,
}: FloatingTabBarProps) {
  const router = useRouter();
  const theme = useTheme();
  const pathname = usePathname();

  const activeIndex = tabs.findIndex((tab) => {
    if (tab.route === '/(tabs)/(home)/') {
      return pathname === '/' || pathname.startsWith('/(tabs)/(home)');
    }
    return pathname.includes(tab.name);
  });

  const translateX = useSharedValue(0);

  React.useEffect(() => {
    const tabWidth = containerWidth / tabs.length;
    translateX.value = withSpring(activeIndex * tabWidth, {
      damping: 15,
      stiffness: 100,
    });
  }, [activeIndex, containerWidth, tabs.length]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  const tabWidth = containerWidth / tabs.length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { bottom: bottomMargin }]}
      edges={['bottom']}
    >
      <BlurView
        intensity={80}
        tint={theme.dark ? 'dark' : 'light'}
        style={[
          styles.container,
          {
            width: containerWidth,
            borderRadius,
            backgroundColor: Platform.OS === 'android' 
              ? colors.card 
              : 'transparent',
          },
        ]}
      >
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              width: tabWidth - 20,
              borderRadius: borderRadius - 5,
              backgroundColor: colors.primary,
            },
            animatedStyle,
          ]}
        />

        {tabs.map((tab, index) => {
          const isActive = index === activeIndex;
          const scale = useSharedValue(1);

          const animatedIconStyle = useAnimatedStyle(() => {
            return {
              transform: [
                {
                  scale: interpolate(
                    scale.value,
                    [1, 1.2],
                    [1, 1.2]
                  ),
                },
              ],
            };
          });

          return (
            <TouchableOpacity
              key={tab.name}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabPress(tab.route)}
              activeOpacity={0.7}
            >
              <Animated.View style={[styles.iconContainer, animatedIconStyle]}>
                <IconSymbol
                  name={tab.icon as any}
                  size={24}
                  color={isActive ? '#ffffff' : colors.text}
                />
              </Animated.View>
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? '#ffffff' : colors.text,
                    fontWeight: isActive ? '600' : '400',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    elevation: 8,
    overflow: 'hidden',
  },
  activeIndicator: {
    position: 'absolute',
    height: '80%',
    marginLeft: 10,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
  },
});

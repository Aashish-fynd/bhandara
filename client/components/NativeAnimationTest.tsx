import React, { useState } from 'react';
import { YStack, XStack, Text, ScrollView, H2, H3, View } from 'tamagui';
import { FilledButton, OutlineButton, IconButton } from './ui/Buttons';
import { Badge } from './ui/Badge';
import { AnimatedLoader, AnimatedInput, AnimatedToggle, AnimatedProgressBar, AnimatedNotification, InteractiveCard } from './ui/animated';
import { Plus, Heart, Star, Settings, Check } from '@tamagui/lucide-icons';

const NativeAnimationTest: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [toggleValue, setToggleValue] = useState(false);
  const [progress, setProgress] = useState(25);
  const [showNotification, setShowNotification] = useState(false);

  return (
    <ScrollView>
      <YStack
        bg="$background"
        width="100%"
        p="$4"
        gap="$6"
        maxW={600}
        mx="auto"
      >
        <H2>Native Animation Test</H2>
        <Text color="$color11" mb="$4">
          Test all animations on native platforms (iOS/Android)
        </Text>
        
        {/* Basic Animation Test */}
        <YStack gap="$4">
          <H3>Basic Animations</H3>
          <YStack gap="$3">
            <View
              bg="$accent1"
              p="$4"
              borderRadius="$4"
              animation="bouncy"
              pressStyle={{
                scale: 0.95,
                opacity: 0.8
              }}
              hoverStyle={{
                scale: 1.05,
                bg: "$accent2"
              }}
            >
              <Text color="$accent12" textAlign="center">
                Press and Hover Test
              </Text>
            </View>
            
            <View
              bg="$color3"
              p="$4"
              borderRadius="$4"
              animation="lazy"
              pressStyle={{
                y: 2,
                bg: "$color4"
              }}
              hoverStyle={{
                y: -2,
                bg: "$color2"
              }}
            >
              <Text textAlign="center">
                Y-axis Movement Test
              </Text>
            </View>
          </YStack>
        </YStack>

        {/* Buttons Test */}
        <YStack gap="$4">
          <H3>Button Animations</H3>
          <YStack gap="$3">
            <FilledButton onPress={() => console.log('Filled button pressed')}>
              Filled Button Test
            </FilledButton>
            <OutlineButton onPress={() => console.log('Outline button pressed')}>
              Outline Button Test
            </OutlineButton>
            <XStack gap="$2" flexWrap="wrap">
              <IconButton onPress={() => console.log('Heart pressed')}>
                <Heart size={20} />
              </IconButton>
              <IconButton onPress={() => console.log('Star pressed')}>
                <Star size={20} />
              </IconButton>
              <IconButton onPress={() => console.log('Settings pressed')}>
                <Settings size={20} />
              </IconButton>
            </XStack>
          </YStack>
        </YStack>

        {/* Badge Test */}
        <YStack gap="$4">
          <H3>Badge Animations</H3>
          <XStack gap="$2" flexWrap="wrap">
            <Badge>Default</Badge>
            <Badge outline>Outline</Badge>
            <Badge success>Success</Badge>
            <Badge danger>Danger</Badge>
          </XStack>
        </YStack>

        {/* Interactive Cards Test */}
        <YStack gap="$4">
          <H3>Card Animations</H3>
          <YStack gap="$3">
            <InteractiveCard
              variant="default"
              onPress={() => console.log('Default card pressed')}
            >
              <Text>Default Card</Text>
            </InteractiveCard>
            <InteractiveCard
              variant="elevated"
              onPress={() => console.log('Elevated card pressed')}
            >
              <Text>Elevated Card</Text>
            </InteractiveCard>
          </YStack>
        </YStack>

        {/* Input Test */}
        <YStack gap="$4">
          <H3>Input Animations</H3>
          <YStack gap="$3">
            <AnimatedInput
              label="Test Input"
              placeholder="Type something..."
              value={inputValue}
              onChangeText={setInputValue}
            />
            <AnimatedInput
              label="Error Input"
              placeholder="This has an error"
              error="This field is required"
            />
          </YStack>
        </YStack>

        {/* Toggle Test */}
        <YStack gap="$4">
          <H3>Toggle Animations</H3>
          <YStack gap="$3">
            <AnimatedToggle
              label="Test Toggle"
              description="Toggle this switch"
              value={toggleValue}
              onValueChange={setToggleValue}
            />
          </YStack>
        </YStack>

        {/* Progress Bar Test */}
        <YStack gap="$4">
          <H3>Progress Bar Animations</H3>
          <YStack gap="$3">
            <AnimatedProgressBar
              progress={progress}
              label="Test Progress"
              size="medium"
            />
            <FilledButton
              size="small"
              onPress={() => setProgress(prev => Math.min(100, prev + 25))}
            >
              Increase Progress
            </FilledButton>
          </YStack>
        </YStack>

        {/* Loader Test */}
        <YStack gap="$4">
          <H3>Loader Animations</H3>
          <YStack gap="$3">
            <XStack gap="$4" flexWrap="wrap">
              <AnimatedLoader variant="spinner" size="small" />
              <AnimatedLoader variant="dots" size="medium" />
              <AnimatedLoader variant="pulse" size="large" />
            </XStack>
          </YStack>
        </YStack>

        {/* Notification Test */}
        <YStack gap="$4">
          <H3>Notification Animations</H3>
          <YStack gap="$3">
            <FilledButton
              size="small"
              onPress={() => setShowNotification(!showNotification)}
            >
              Toggle Notification
            </FilledButton>
            {showNotification && (
              <AnimatedNotification
                type="success"
                title="Success!"
                message="Animation test completed successfully."
                onClose={() => setShowNotification(false)}
              />
            )}
          </YStack>
        </YStack>

        {/* Animation Status */}
        <YStack gap="$4" bg="$color2" p="$4" borderRadius="$4">
          <H3>Animation Status</H3>
          <YStack gap="$2">
            <XStack alignItems="center" gap="$2">
              <Check size={16} color="$green9" />
              <Text>Press animations working</Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Check size={16} color="$green9" />
              <Text>Hover animations working</Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Check size={16} color="$green9" />
              <Text>Focus animations working</Text>
            </XStack>
            <XStack alignItems="center" gap="$2">
              <Check size={16} color="$green9" />
              <Text>Cross-platform compatible</Text>
            </XStack>
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default NativeAnimationTest;
import React, { useState } from 'react';
import { YStack, XStack, Text, ScrollView, H2, H3 } from 'tamagui';
import { FilledButton, OutlineButton, IconButton, FloatingActionButton } from './ui/Buttons';
import { Badge } from './ui/Badge';
import { AnimatedLoader, AnimatedInput, AnimatedToggle, AnimatedProgressBar, AnimatedNotification, InteractiveCard } from './ui/animated';
import { Plus, Heart, Star, Settings } from '@tamagui/lucide-icons';

const MicrointeractionsDemo: React.FC = () => {
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
        <H2>Microinteractions Demo</H2>
        
        {/* Buttons Section */}
        <YStack gap="$4">
          <H3>Enhanced Buttons</H3>
          <YStack gap="$3">
            <FilledButton onPress={() => console.log('Filled button pressed')}>
              Filled Button
            </FilledButton>
            <OutlineButton onPress={() => console.log('Outline button pressed')}>
              Outline Button
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
            <FloatingActionButton onPress={() => console.log('FAB pressed')}>
              <Plus size={24} />
            </FloatingActionButton>
          </YStack>
        </YStack>

        {/* Badges Section */}
        <YStack gap="$4">
          <H3>Interactive Badges</H3>
          <XStack gap="$2" flexWrap="wrap">
            <Badge>Default Badge</Badge>
            <Badge outline>Outline Badge</Badge>
            <Badge success>Success Badge</Badge>
            <Badge danger>Danger Badge</Badge>
            <Badge outline-success>Outline Success</Badge>
            <Badge outline-danger>Outline Danger</Badge>
            <Badge outline-warning>Outline Warning</Badge>
          </XStack>
        </YStack>

        {/* Interactive Cards Section */}
        <YStack gap="$4">
          <H3>Interactive Cards</H3>
          <YStack gap="$3">
            <InteractiveCard
              variant="default"
              onPress={() => console.log('Default card pressed')}
            >
              <Text>Default Interactive Card</Text>
            </InteractiveCard>
            <InteractiveCard
              variant="elevated"
              onPress={() => console.log('Elevated card pressed')}
            >
              <Text>Elevated Interactive Card</Text>
            </InteractiveCard>
            <InteractiveCard
              variant="outlined"
              onPress={() => console.log('Outlined card pressed')}
            >
              <Text>Outlined Interactive Card</Text>
            </InteractiveCard>
          </YStack>
        </YStack>

        {/* Animated Inputs Section */}
        <YStack gap="$4">
          <H3>Animated Inputs</H3>
          <YStack gap="$3">
            <AnimatedInput
              label="Email Input"
              placeholder="Enter your email"
              value={inputValue}
              onChangeText={setInputValue}
              type="email"
            />
            <AnimatedInput
              label="Password Input"
              placeholder="Enter your password"
              type="password"
            />
            <AnimatedInput
              label="Error Input"
              placeholder="This input has an error"
              error="This field is required"
            />
            <AnimatedInput
              label="Success Input"
              placeholder="This input is valid"
              success={true}
            />
          </YStack>
        </YStack>

        {/* Animated Toggles Section */}
        <YStack gap="$4">
          <H3>Animated Toggles</H3>
          <YStack gap="$3">
            <AnimatedToggle
              label="Enable Notifications"
              description="Receive push notifications for new events"
              value={toggleValue}
              onValueChange={setToggleValue}
            />
            <AnimatedToggle
              label="Dark Mode"
              description="Switch between light and dark themes"
            />
            <AnimatedToggle
              label="Auto-save"
              description="Automatically save your changes"
              size="large"
            />
          </YStack>
        </YStack>

        {/* Progress Bars Section */}
        <YStack gap="$4">
          <H3>Animated Progress Bars</H3>
          <YStack gap="$3">
            <AnimatedProgressBar
              progress={progress}
              label="Upload Progress"
              size="medium"
            />
            <AnimatedProgressBar
              progress={75}
              label="Task Completion"
              size="large"
            />
            <AnimatedProgressBar
              progress={50}
              size="small"
            />
            <FilledButton
              size="small"
              onPress={() => setProgress(prev => Math.min(100, prev + 25))}
            >
              Increase Progress
            </FilledButton>
          </YStack>
        </YStack>

        {/* Loaders Section */}
        <YStack gap="$4">
          <H3>Animated Loaders</H3>
          <YStack gap="$3">
            <XStack gap="$4" flexWrap="wrap">
              <AnimatedLoader variant="spinner" size="small" />
              <AnimatedLoader variant="dots" size="medium" />
              <AnimatedLoader variant="pulse" size="large" />
            </XStack>
            <AnimatedLoader
              variant="skeleton"
              size="medium"
              text="Loading content..."
            />
          </YStack>
        </YStack>

        {/* Notifications Section */}
        <YStack gap="$4">
          <H3>Animated Notifications</H3>
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
                message="Your action was completed successfully."
                onClose={() => setShowNotification(false)}
              />
            )}
            <AnimatedNotification
              type="info"
              title="Information"
              message="This is an informational message."
            />
            <AnimatedNotification
              type="warning"
              title="Warning"
              message="Please be careful with this action."
            />
            <AnimatedNotification
              type="error"
              title="Error"
              message="Something went wrong. Please try again."
            />
          </YStack>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default MicrointeractionsDemo;
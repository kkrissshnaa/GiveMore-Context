import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#b2ff59',
        tabBarInactiveTintColor: '#8a8385',
        tabBarStyle: {
          backgroundColor: '#090e0b',
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Explore',
          tabBarIcon: ({ color, size }) => <Feather name="compass" size={size || 20} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="folder" 
        options={{ 
          title: 'Folder',
          tabBarIcon: ({ color, size }) => <Feather name="folder" size={size || 20} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="generation" 
        options={{ 
          title: 'Generate', 
          href: "/",
          tabBarIcon: ({ color, size }) => <Feather name="zap" size={size || 20} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="subscription" 
        options={{ 
          title: 'Pro',
          tabBarIcon: ({ color, size }) => <Feather name="star" size={size || 20} color={color} />
        }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ 
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Feather name="settings" size={size || 20} color={color} />
        }} 
      />
    </Tabs>
  );
}

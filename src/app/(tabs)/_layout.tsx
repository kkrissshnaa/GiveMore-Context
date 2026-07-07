import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
            <Tabs.Screen name="folder" options={{ title: 'Folder' }} />
            <Tabs.Screen name="generation" options={{ title: 'Generation', href: "/" }} />
            <Tabs.Screen name="subscription" options={{ title: 'Subscription' }} />
            <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
        </Tabs>
    );
}

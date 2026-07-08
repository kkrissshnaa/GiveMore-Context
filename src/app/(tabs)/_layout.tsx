import { Tabs } from 'expo-router';

export default function TabLayout() {
    return (
        <Tabs>
            <Tabs.Screen name="explore" options={{ headerShown: false, title: 'Explore' }} />
            <Tabs.Screen name="folder" options={{ headerShown: false, title: 'Folder' }} />
            <Tabs.Screen name="generation" options={{ headerShown: false, title: 'Generation', href: "/" }} />
            <Tabs.Screen name="subscription" options={{ headerShown: false, title: 'Subscription' }} />
            <Tabs.Screen name="settings" options={{ headerShown: false, title: 'Settings' }} />
        </Tabs>
    );
}

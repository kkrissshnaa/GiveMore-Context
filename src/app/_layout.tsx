import { Drawer, DrawerContentScrollView, DrawerItem, DrawerItemList } from "expo-router/drawer";

import { router } from "expo-router";
import "../../global.css";

function CustomDrawerContent(props: any) {
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem label="Explore" onPress={() => router.push('/(tabs)/explore')} />
      <DrawerItem label="Folder" onPress={() => router.push('/(tabs)/folder')} />
      <DrawerItem label="Subscription" onPress={() => router.push('/(tabs)/subscription')} />
      <DrawerItem label="Settings" onPress={() => router.push('/(tabs)/settings')} />
    </DrawerContentScrollView>
  );
}

export default function RootLayout() {
  return (
    <Drawer drawerContent={(props) => <CustomDrawerContent {...props} />}>
      <Drawer.Screen
        name="(tabs)"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="(auth)/signin"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="(auth)/signup"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  )
}

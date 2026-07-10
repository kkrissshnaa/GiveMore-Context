import { router } from "expo-router";
import { Drawer, DrawerContentScrollView, DrawerItem, DrawerItemList } from "expo-router/drawer";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import "../../global.css";

const CustomHeader = ({ navigation }: any) => {
  return (
    <SafeAreaView>
      <View className="flex-row items-center justify-between w-full">
        <View>
          <TouchableOpacity onPress={() => navigation.toggleDrawer()}>
            <Text className="text-4xl">≡</Text>
          </TouchableOpacity>
        </View>
        <View>
          <Text className="text-lg font-semibold">Generate Images</Text>
        </View>
        <View>
          <TouchableOpacity>
            <Text className="text-3xl">😎</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <DrawerContentScrollView {...props}>
          <DrawerItemList {...props} />
          <DrawerItem label="Explore" onPress={() => router.push('/(tabs)/explore')} />
          <DrawerItem label="Folder" onPress={() => router.push('/(tabs)/folder')} />
          <DrawerItem label="Subscription" onPress={() => router.push('/(tabs)/subscription')} />
          <DrawerItem label="Settings" onPress={() => router.push('/(tabs)/settings')} />
        </DrawerContentScrollView>
      )}
      screenOptions={{
        drawerType: "back",
        // Pass a function returning your custom component to the header prop
        header: ({ navigation }) => (
          <CustomHeader navigation={navigation} />
        ),
      }}>
      <Drawer.Screen name="index" options={{
        drawerItemStyle: { display: "none" },
        title: "gen"
      }} />
      <Drawer.Screen name="(auth)/signin" options={{
        headerShown: false,
        drawerItemStyle: { display: "none" },
      }} />
      <Drawer.Screen name="(auth)/signup" options={{
        headerShown: false,
        drawerItemStyle: { display: "none" },
      }} />
      <Drawer.Screen name="(tabs)" options={{
        headerShown: false,
        drawerItemStyle: { display: "none" }
      }} />
    </Drawer>
  );
}
import { Link } from 'expo-router'
import { Text, View } from 'react-native'

export default function Index(){
  return (
    <View className="flex-1 items-center justify-center pt-safe">
    <Text className="text-blue-500">Edit src/app/index.tsx to edit this screen.</Text>
    <Link href={"../(auth)/signin"}>Go to signin</Link>
    <Link href={"/settings"}>Go to settings</Link> 
  </View>
  )
}
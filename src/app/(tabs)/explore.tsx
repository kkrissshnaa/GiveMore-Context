import { Link } from 'expo-router'
import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Index(){
  return (
    <SafeAreaView className="flex-1 items-center justify-center">
    <Text className="text-blue-500">Edit src/app/index.tsx to edit this screen.</Text>
    <Link href={"../(auth)/signin"}>Go to signin</Link>
    <Link href={"/settings"}>Go to settings</Link> 
  </SafeAreaView>
  )
}
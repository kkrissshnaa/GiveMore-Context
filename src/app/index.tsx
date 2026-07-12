import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";

export default function Index() {
  const [item, setItem] = useState<any[]>([]);
  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const { data, error } = await supabase.from('users').select("*");

    if (error) throw error;
    if (data) setItem(data);
  }
  return (
    <SafeAreaView>
      <View>
        <Text>
          {JSON.stringify(item, null, 2)}
        </Text>
      </View>
      <TextInput ></TextInput>
    </SafeAreaView>
  );
}

import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function index() {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [showAspectRatios, setShowAspectRatios] = useState(false);

  const aspectRatios = ['1:1', '16:9', '9:16', '3:2', '2:3'];

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      setReferenceImage(result.assets[0].uri);
    }
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;

    Keyboard.dismiss();
    setLoading(true);
    setImageUrl(null);
    setErrorText(null);

    try {
      // NOTE: If testing on a physical mobile device, relative paths ('/api/generation') 
      // might fail. You may need to use your local IP address, e.g.:
      // const url = 'http://192.168.1.X:8081/api/generation';
      const url = '/api/generation';

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio, referenceImage }),
      });

      const data = await response.json();

      if (data.success) {
        setImageUrl(data.imageUrl);
      }
    } catch (error: any) {
      console.error("Network error:", error);
      setErrorText(error.message || "Network request failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]">
      <KeyboardAvoidingView 
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 20 }}>
          <Text className="text-3xl font-bold mb-5 text-white text-center">AI Image Generator</Text>
          
          {loading && (
            <View className="items-center mt-5">
              <ActivityIndicator size="large" color="#007AFF" />
              <Text className="mt-3 text-gray-400 text-base">Generating Image...</Text>
            </View>
          )}

          {errorText && (
            <Text className="text-red-500 text-center mt-3 text-base">{errorText}</Text>
          )}

          {imageUrl && (
            <View className="w-full mt-3 rounded-xl overflow-hidden bg-gray-800 aspect-square">
              <Image
                source={{ uri: imageUrl }}
                className="w-full h-full"
                resizeMode="contain"
              />
            </View>
          )}
          
          {!loading && !imageUrl && !errorText && (
            <View className="flex-1 items-center justify-center min-h-[300px]">
              <Ionicons name="image-outline" size={64} color="#444" />
              <Text className="text-gray-500 mt-4 text-center">Enter a prompt below to generate an image</Text>
            </View>
          )}
        </ScrollView>

        {/* Bottom Prompt Area */}
        <View className="px-4 pb-4 pt-2 bg-[#1C1C1E] rounded-t-3xl border-t border-gray-800">
          
          {/* Options row (Aspect Ratio & Reference Image Preview) */}
          <View className="flex-row items-center justify-between mb-3 mt-1 min-h-[40px]">
            <View className="flex-row items-center space-x-2">
              {showAspectRatios ? (
                <View className="flex-row flex-wrap gap-2">
                  {aspectRatios.map((ratio) => (
                    <TouchableOpacity 
                      key={ratio}
                      onPress={() => {
                        setAspectRatio(ratio);
                        setShowAspectRatios(false);
                      }}
                      className={`px-3 py-1.5 rounded-full ${aspectRatio === ratio ? 'bg-[#007AFF]' : 'bg-gray-800'}`}
                    >
                      <Text className={`text-sm ${aspectRatio === ratio ? 'text-white font-semibold' : 'text-gray-300'}`}>{ratio}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TouchableOpacity 
                  onPress={() => setShowAspectRatios(true)}
                  className="flex-row items-center bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700"
                >
                  <Ionicons name="crop" size={14} color="#A1C6FA" />
                  <Text className="text-gray-300 text-sm ml-1.5 mr-1 font-medium">{aspectRatio}</Text>
                  <Ionicons name="chevron-down" size={14} color="#888" />
                </TouchableOpacity>
              )}
            </View>

            {referenceImage && (
              <View className="relative">
                <Image 
                  source={{ uri: referenceImage }} 
                  className="w-10 h-10 rounded-lg border border-gray-600"
                  resizeMode="cover"
                />
                <TouchableOpacity 
                  className="absolute -top-2 -right-2 bg-gray-900 rounded-full w-5 h-5 items-center justify-center border border-gray-600"
                  onPress={() => setReferenceImage(null)}
                >
                  <Ionicons name="close" size={12} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Input Box Area */}
          <View className="flex-row items-end bg-gray-900 rounded-2xl border border-gray-700 p-2 min-h-[60px]">
            <TouchableOpacity 
              onPress={pickImage}
              className="p-3 bg-gray-800 rounded-xl mr-2"
            >
              <Ionicons name="image-outline" size={24} color="#A1C6FA" />
            </TouchableOpacity>

            <TextInput
              className="flex-1 text-white text-base max-h-32 min-h-[44px] pt-3 pb-3"
              placeholder="Describe your image..."
              placeholderTextColor="#666"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              autoCapitalize="none"
              style={{ textAlignVertical: 'center' }}
            />

            <TouchableOpacity
              onPress={generateImage}
              disabled={loading || !prompt.trim()}
              className={`p-3 rounded-xl ml-2 ${prompt.trim() && !loading ? 'bg-[#007AFF]' : 'bg-gray-800'}`}
            >
              <Ionicons 
                name="arrow-up" 
                size={24} 
                color={prompt.trim() && !loading ? '#FFFFFF' : '#555'} 
              />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
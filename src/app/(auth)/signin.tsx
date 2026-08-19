import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useOAuth } from '@clerk/expo';
import { useSignIn } from '@clerk/expo/legacy';
import { router, useFocusEffect } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';

WebBrowser.maybeCompleteAuthSession();

const HELVETICA_FONT = Platform.select({
  ios: 'Helvetica',
  android: 'sans-serif',
  default: 'Helvetica, Arial, sans-serif',
});

const HELVETICA_BOLD = Platform.select({
  ios: 'Helvetica-Bold',
  android: 'sans-serif-medium',
  default: 'Helvetica, Arial, sans-serif',
});

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear inputs whenever user switches to another page or screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setIdentifier('');
        setPassword('');
        setShowPassword(false);
        setErrorMessage(null);
      };
    }, [])
  );

  // Username or Email / Password Sign In
  const handleEmailSignIn = async () => {
    if (!isLoaded || !signIn) {
      setErrorMessage('Authentication service is initializing. Please wait a moment and try again.');
      return;
    }
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your username/email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await signIn.create({
        identifier: identifier.trim(),
        password: password.trim(),
      });

      if (result.status === 'complete') {
        if (setActive) {
          await setActive({ session: result.createdSessionId });
        }
        router.replace('/');
      } else {
        console.log('Sign in status:', result.status);
        setErrorMessage(`Sign in incomplete (status: ${result.status}). Please check your credentials.`);
      }
    } catch (err: any) {
      console.error('Sign in error details:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Failed to sign in. Please check your credentials.');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Sign In
  const handleGoogleSignIn = useCallback(async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);

      const redirectUrl = AuthSession.makeRedirectUri({
        scheme: 'givemorecontext',
      });

      const { createdSessionId, setActive: setOAuthActive } = await startOAuthFlow({
        redirectUrl,
      });

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        router.replace('/');
      }
    } catch (err: any) {
      console.error('Google OAuth error:', JSON.stringify(err, null, 2));
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Google sign in failed. Please check Google OAuth settings in Clerk Dashboard.';
      setErrorMessage(msg);
    } finally {
      setGoogleLoading(false);
    }
  }, [startOAuthFlow]);

  return (
    <AestheticBackdrop fullWindowAlign={true}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 20,
            paddingHorizontal: 24,
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Close Button */}
          <TouchableOpacity
            onPress={() => router.replace('/')}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/15 mb-6 self-start"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#E5FF1F" />
          </TouchableOpacity>

          {/* Logo & Title */}
          <View className="mb-8">
            <Text
              style={{ fontFamily: HELVETICA_BOLD }}
              className="text-3xl font-bold text-white"
            >
              Welcome back
            </Text>
            <Text
              style={{ fontFamily: HELVETICA_FONT, color: '#E5FF1F' }}
              className="text-sm font-medium mt-1"
            >
              Sign in to continue with <Text style={{ fontFamily: HELVETICA_BOLD, fontWeight: '900', color: '#E5FF1F' }}>Givemore-Context</Text>
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View className="bg-red-500/15 border border-red-500/40 rounded-xl p-3.5 mb-6 flex-row items-center gap-3">
              <Feather name="alert-circle" size={18} color="#ef4444" />
              <Text
                style={{ fontFamily: HELVETICA_FONT }}
                className="text-red-300 text-xs font-semibold flex-1"
              >
                {errorMessage}
              </Text>
            </View>
          )}

          {/* Identifier Input */}
          <View className="mb-4">
            <Text
              style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
              className="text-xs font-bold mb-2 uppercase tracking-wider"
            >
              Username or Email
            </Text>
            <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
              <Feather name="user" size={18} color="#E5FF1F" style={{ marginRight: 10 }} />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="username or you@example.com"
                placeholderTextColor="#ffffff"
                autoCapitalize="none"
                autoCorrect={false}
                style={{ flex: 1, color: '#fff', fontSize: 14, fontFamily: HELVETICA_FONT }}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text
              style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
              className="text-xs font-bold mb-2 uppercase tracking-wider"
            >
              Password
            </Text>
            <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
              <Feather name="lock" size={18} color="#E5FF1F" style={{ marginRight: 10 }} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#ffffff"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                style={{ flex: 1, color: '#fff', fontSize: 14, fontFamily: HELVETICA_FONT }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#E5FF1F" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleEmailSignIn}
            disabled={loading || googleLoading}
            activeOpacity={0.8}
            className="py-4 rounded-2xl bg-[#E5FF1F] items-center justify-center shadow-lg shadow-[#E5FF1F]/30 active:opacity-90 mb-6"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#070801" />
            ) : (
              <Text
                style={{ fontFamily: HELVETICA_BOLD }}
                className="text-[#070801] font-bold text-sm tracking-wide"
              >
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-[1px] bg-white/10" />
            <Text
              style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
              className="px-3 text-xs font-bold uppercase tracking-wider"
            >
              or continue with
            </Text>
            <View className="flex-1 h-[1px] bg-white/10" />
          </View>

          {/* Google SSO Button */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.8}
            className="flex-row items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/[0.07] border border-white/15 active:bg-white/[0.12] mb-6"
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#E5FF1F" />
            ) : (
              <>
                <FontAwesome name="google" size={17} color="#E5FF1F" />
                <Text
                  style={{ fontFamily: HELVETICA_BOLD }}
                  className="text-white text-sm font-semibold"
                >
                  Continue with Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer Link to Sign Up */}
          <View className="flex-row justify-center items-center gap-1.5">
            <Text
              style={{ fontFamily: HELVETICA_FONT, color: 'rgba(229, 255, 31, 0.75)' }}
              className="text-xs"
            >
              Don&apos;t have an account?
            </Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/signup')}>
              <Text
                style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
                className="text-xs underline"
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AestheticBackdrop>
  );
}

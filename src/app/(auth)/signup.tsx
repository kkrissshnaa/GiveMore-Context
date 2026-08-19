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
import { useSignUp } from '@clerk/expo/legacy';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { AestheticBackdrop } from '../../components/AestheticBackdrop';

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email / Password Sign Up (Step 1)
  const handleSignUp = async () => {
    if (!isLoaded || !signUp) {
      setErrorMessage('Authentication service is initializing. Please wait a moment and try again.');
      return;
    }
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signUp.create({
        emailAddress: email.trim(),
        password: password.trim(),
      });

      if (res.status === 'complete') {
        if (setActive) {
          await setActive({ session: res.createdSessionId });
        }
        router.replace('/');
      } else {
        // Send email verification code
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
        setPendingVerification(true);
      }
    } catch (err: any) {
      console.error('Sign up error details:', err);
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        (typeof err === 'string' ? err : 'Failed to create account. Check your details.');
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Verify Email Code (Step 2)
  const handleVerifyCode = async () => {
    if (!isLoaded || !signUp) return;
    if (!code.trim()) {
      setErrorMessage('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code: code.trim(),
      });

      if (completeSignUp.status === 'complete') {
        if (setActive) {
          await setActive({ session: completeSignUp.createdSessionId });
        }
        router.replace('/');
      } else {
        console.log('Verification status:', completeSignUp.status);
        setErrorMessage(`Verification incomplete (status: ${completeSignUp.status}). Please try again.`);
      }
    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
      const msg =
        err?.errors?.[0]?.longMessage ||
        err?.errors?.[0]?.message ||
        err?.message ||
        'Invalid verification code. Please try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // Google OAuth Sign Up / In
  const handleGoogleSignUp = useCallback(async () => {
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
        'Google sign up failed. Please check Google OAuth settings in Clerk Dashboard.';
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
          {/* Header Close/Back Button */}
          <TouchableOpacity
            onPress={() => {
              if (pendingVerification) {
                setPendingVerification(false);
              } else {
                router.replace('/');
              }
            }}
            className="w-10 h-10 rounded-full bg-white/10 items-center justify-center border border-white/15 mb-6 self-start"
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={18} color="#E5FF1F" />
          </TouchableOpacity>

          {/* Logo & Title */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-white font-display">
              {pendingVerification ? 'Verify Email' : 'Create Account'}
            </Text>
            <Text className="text-sm font-medium text-[#8a8385] mt-1 font-sans">
              {pendingVerification
                ? `Enter the code sent to ${email}`
                : 'Join give more —context today'}
            </Text>
          </View>

          {/* Error Banner */}
          {errorMessage && (
            <View className="bg-red-500/15 border border-red-500/40 rounded-xl p-3.5 mb-6 flex-row items-center gap-3">
              <Feather name="alert-circle" size={18} color="#ef4444" />
              <Text className="text-red-300 text-xs font-semibold flex-1 font-sans">
                {errorMessage}
              </Text>
            </View>
          )}

          {!pendingVerification ? (
            <>
              {/* Google SSO Button */}
              <TouchableOpacity
                onPress={handleGoogleSignUp}
                disabled={googleLoading || loading}
                activeOpacity={0.8}
                className="flex-row items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white/[0.07] border border-white/15 active:bg-white/[0.12] mb-6"
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color="#E5FF1F" />
                ) : (
                  <>
                    <Feather name="globe" size={18} color="#E5FF1F" />
                    <Text className="text-white text-sm font-semibold font-display">
                      Sign up with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-white/10" />
                <Text className="px-3 text-xs font-bold text-[#8a8385] uppercase tracking-wider font-mono">
                  or email
                </Text>
                <View className="flex-1 h-[1px] bg-white/10" />
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider font-mono">
                  Email Address
                </Text>
                <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
                  <Feather name="mail" size={18} color="#8a8385" style={{ marginRight: 10 }} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ flex: 1, color: '#fff', fontSize: 14 }}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider font-mono">
                  Password
                </Text>
                <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
                  <Feather name="lock" size={18} color="#8a8385" style={{ marginRight: 10 }} />
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor="#666"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={{ flex: 1, color: '#fff', fontSize: 14 }}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#8a8385" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSignUp}
                disabled={loading || googleLoading}
                activeOpacity={0.8}
                className="py-4 rounded-2xl bg-[#E5FF1F] items-center justify-center shadow-lg shadow-[#E5FF1F]/30 active:opacity-90 mb-6"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#070801" />
                ) : (
                  <Text className="text-[#070801] font-bold text-sm font-display tracking-wide">
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Footer Link to Sign In */}
              <View className="flex-row justify-center items-center gap-1">
                <Text className="text-gray-400 text-xs font-sans">
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/signin')}>
                  <Text className="text-[#E5FF1F] font-bold text-xs font-display underline">
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Step 2: Verification Code Input */
            <>
              <View className="mb-6">
                <Text className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider font-mono">
                  Verification Code
                </Text>
                <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
                  <Feather name="shield" size={18} color="#8a8385" style={{ marginRight: 10 }} />
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    style={{ flex: 1, color: '#fff', fontSize: 16, letterSpacing: 3 }}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleVerifyCode}
                disabled={loading}
                activeOpacity={0.8}
                className="py-4 rounded-2xl bg-[#E5FF1F] items-center justify-center shadow-lg shadow-[#E5FF1F]/30 active:opacity-90 mb-6"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#070801" />
                ) : (
                  <Text className="text-[#070801] font-bold text-sm font-display tracking-wide">
                    Verify & Continue
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AestheticBackdrop>
  );
}

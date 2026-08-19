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
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clear inputs whenever user switches to another page or screen loses focus
  useFocusEffect(
    useCallback(() => {
      return () => {
        setUsername('');
        setEmail('');
        setPassword('');
        setShowPassword(false);
        setCode('');
        setPendingVerification(false);
        setErrorMessage(null);
      };
    }, [])
  );

  // Sign Up (Step 1)
  const handleSignUp = async () => {
    if (!isLoaded || !signUp) {
      setErrorMessage('Authentication service is initializing. Please wait a moment and try again.');
      return;
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername) {
      setErrorMessage('Please choose a unique username.');
      return;
    }
    if (cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(cleanUsername)) {
      setErrorMessage('Username can only contain letters, numbers, underscores, and hyphens.');
      return;
    }
    if (!cleanEmail || !cleanPassword) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await signUp.create({
        username: cleanUsername,
        emailAddress: cleanEmail,
        password: cleanPassword,
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

      // Check specifically for username uniqueness / conflict
      const usernameErr = err?.errors?.find((e: any) =>
        e?.meta?.paramName === 'username' ||
        e?.code === 'form_identifier_exists' ||
        e?.message?.toLowerCase()?.includes('username')
      );

      if (usernameErr) {
        if (
          usernameErr.code === 'form_identifier_exists' ||
          usernameErr.message?.toLowerCase()?.includes('taken') ||
          usernameErr.longMessage?.toLowerCase()?.includes('taken')
        ) {
          setErrorMessage(`The username "${cleanUsername}" is already taken. Please choose a different unique username.`);
          return;
        }
        setErrorMessage(usernameErr.longMessage || usernameErr.message || 'Invalid username.');
        return;
      }

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

      if (completeSignUp.status === 'complete' || completeSignUp.createdSessionId) {
        if (setActive && completeSignUp.createdSessionId) {
          await setActive({ session: completeSignUp.createdSessionId });
        }
        router.replace('/');
      } else {
        console.log('Verification status:', completeSignUp.status, 'missing:', completeSignUp.missingFields);
        if (completeSignUp.missingFields && completeSignUp.missingFields.length > 0) {
          setErrorMessage(`Additional info required by Clerk: ${completeSignUp.missingFields.join(', ')}`);
        } else {
          setErrorMessage(`Verification status: ${completeSignUp.status}. Please check your verification code.`);
        }
      }
    } catch (err: any) {
      console.error('Verification error:', JSON.stringify(err, null, 2));
      const isAlreadyVerified = err?.errors?.some?.((e: any) => e.code === 'verification_already_verified');
      if (isAlreadyVerified) {
        if (signUp.createdSessionId && setActive) {
          await setActive({ session: signUp.createdSessionId });
          router.replace('/');
          return;
        } else {
          router.replace('/(auth)/signin');
          return;
        }
      }
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
            <Text
              style={{ fontFamily: HELVETICA_BOLD }}
              className="text-3xl font-bold text-white"
            >
              {pendingVerification ? 'Verify Email' : 'Create Account'}
            </Text>
            <Text
              style={{ fontFamily: HELVETICA_FONT, color: '#E5FF1F' }}
              className="text-sm font-medium mt-1"
            >
              {pendingVerification
                ? `Enter the code sent to ${email}`
                : 'Join give more —context today'}
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
                    <Text
                      style={{ fontFamily: HELVETICA_BOLD }}
                      className="text-white text-sm font-semibold"
                    >
                      Sign up with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-[1px] bg-white/10" />
                <Text
                  style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
                  className="px-3 text-xs font-bold uppercase tracking-wider"
                >
                  or email
                </Text>
                <View className="flex-1 h-[1px] bg-white/10" />
              </View>

              {/* Username Input */}
              <View className="mb-4">
                <Text
                  style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
                  className="text-xs font-bold mb-2 uppercase tracking-wider"
                >
                  Username
                </Text>
                <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
                  <Feather name="user" size={18} color="#E5FF1F" style={{ marginRight: 10 }} />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="choose_username"
                    placeholderTextColor="#71717a"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={{ flex: 1, color: '#fff', fontSize: 14, fontFamily: HELVETICA_FONT }}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View className="mb-4">
                <Text
                  style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
                  className="text-xs font-bold mb-2 uppercase tracking-wider"
                >
                  Email Address
                </Text>
                <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
                  <Feather name="mail" size={18} color="#E5FF1F" style={{ marginRight: 10 }} />
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#71717a"
                    keyboardType="email-address"
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
                    placeholderTextColor="#71717a"
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
                onPress={handleSignUp}
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
                    Create Account
                  </Text>
                )}
              </TouchableOpacity>

              {/* Footer Link to Sign In */}
              <View className="flex-row justify-center items-center gap-1.5">
                <Text
                  style={{ fontFamily: HELVETICA_FONT, color: 'rgba(229, 255, 31, 0.75)' }}
                  className="text-xs"
                >
                  Already have an account?
                </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/signin')}>
                  <Text
                    style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
                    className="text-xs underline"
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            /* Step 2: Verification Code Input */
            <>
              <View className="mb-6">
                <Text
                  style={{ fontFamily: HELVETICA_BOLD, color: '#E5FF1F' }}
                  className="text-xs font-bold mb-2 uppercase tracking-wider"
                >
                  Verification Code
                </Text>
                <View className="flex-row items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3 focus:border-[#E5FF1F]">
                  <Feather name="shield" size={18} color="#E5FF1F" style={{ marginRight: 10 }} />
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#71717a"
                    keyboardType="number-pad"
                    style={{ flex: 1, color: '#fff', fontSize: 16, letterSpacing: 3, fontFamily: HELVETICA_FONT }}
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
                  <Text
                    style={{ fontFamily: HELVETICA_BOLD }}
                    className="text-[#070801] font-bold text-sm tracking-wide"
                  >
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

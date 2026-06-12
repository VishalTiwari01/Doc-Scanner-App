import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Card, Snackbar, TextInput } from 'react-native-paper';
import { useForgotPasswordMutation, useResetPasswordMutation } from '../services/authApi';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const ForgotPasswordScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [phase, setPhase] = useState<'request' | 'reset'>('request');
  const [secureText, setSecureText] = useState(true);

  const [forgotPassword, { isLoading: isRequesting }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetting }] = useResetPasswordMutation();

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestOtp = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setErrorMsg('Please enter a valid email address');
      return;
    }

    setErrorMsg(null);
    try {
      const response = await forgotPassword({ email }).unwrap();
      console.log('Forgot Password API Response:', response); // Debugging API response
      
      if (response.success) {
        console.log('Email sent successfully according to API.');
        setSuccessMsg('OTP sent successfully! Please check your email.');
        // Transition to reset phase without pre-filling OTP
        setPhase('reset');
      } else {
        console.log('Failed to request OTP:', response.message);
        setErrorMsg(response.message || 'Failed to request OTP');
      }
    } catch (err: any) {
      console.log('Error from API when requesting OTP:', err);
      setErrorMsg(err.data?.message || 'Email address not found');
    }
  };

  const handleResetPassword = async () => {
    if (!otp || otp.trim().length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match');
      return;
    }

    setErrorMsg(null);
    try {
      const response = await resetPassword({ email, otp, newPassword }).unwrap();
      if (response.success) {
        Alert.alert(
          'Success',
          'Your password has been reset successfully. Please log in with your new password.',
          [{ text: 'Log In Now', onPress: () => navigation.navigate('Login') }]
        );
      } else {
        setErrorMsg(response.message || 'Failed to reset password');
      }
    } catch (err: any) {
      setErrorMsg(err.data?.message || 'Invalid or expired OTP');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Card style={styles.card}>
          <Card.Content>
            {phase === 'request' ? (
              // Phase 1: Request OTP
              <View>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="lock-reset" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.cardTitle} variant="titleLarge">Forgot Password?</Text>
                <Text style={styles.cardSubtitle} variant="bodySmall">
                  Enter your registered email address and we will generate a verification OTP to reset your password.
                </Text>

                <TextInput
                  mode="outlined"
                  label="Email Address"
                  placeholder="e.g., alex@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  left={<TextInput.Icon icon="email-outline" />}
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />

                <CustomButton
                  title="Send Reset OTP"
                  onPress={handleRequestOtp}
                  loading={isRequesting}
                  style={styles.button}
                />
              </View>
            ) : (
              // Phase 2: Enter OTP & New Password
              <View>
                <View style={styles.iconContainer}>
                  <MaterialCommunityIcons name="shield-key-outline" size={48} color={theme.colors.primary} />
                </View>
                <Text style={styles.cardTitle} variant="titleLarge">Reset Password</Text>
                <Text style={styles.cardSubtitle} variant="bodySmall">
                  An OTP verification code was generated for {email}. Enter it below along with your new password.
                </Text>

                <TextInput
                  mode="outlined"
                  label="OTP Code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  left={<TextInput.Icon icon="key-outline" />}
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />

                <TextInput
                  mode="outlined"
                  label="New Password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={secureText}
                  left={<TextInput.Icon icon="lock-outline" />}
                  right={
                    <TextInput.Icon
                      icon={secureText ? 'eye-off' : 'eye'}
                      onPress={() => setSecureText(!secureText)}
                    />
                  }
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />

                <TextInput
                  mode="outlined"
                  label="Confirm Password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={secureText}
                  left={<TextInput.Icon icon="lock-check-outline" />}
                  style={styles.input}
                  outlineColor={theme.colors.outline}
                  activeOutlineColor={theme.colors.primary}
                />

                <CustomButton
                  title="Reset Password"
                  onPress={handleResetPassword}
                  loading={isResetting}
                  style={styles.button}
                />

                <TouchableOpacity style={styles.backBtn} onPress={() => setPhase('request')}>
                  <Text style={styles.backBtnText} variant="bodyMedium">
                    Request new OTP code
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText} variant="bodyMedium">
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg(null)}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {errorMsg}
      </Snackbar>

      <Snackbar
        visible={!!successMsg}
        onDismiss={() => setSuccessMsg(null)}
        duration={3000}
        style={styles.successSnackbar}
      >
        {successMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 4,
    paddingVertical: 8,
  },
  iconContainer: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
  },
  cardSubtitle: {
    color: theme.colors.placeholder,
    marginBottom: 24,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  input: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  button: {
    marginTop: 12,
    marginBottom: 8,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  backBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  linkText: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  errorSnackbar: {
    backgroundColor: theme.colors.error,
  },
  successSnackbar: {
    backgroundColor: 'green',
  },
});

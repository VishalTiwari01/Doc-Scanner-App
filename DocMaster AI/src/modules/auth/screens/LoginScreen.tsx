import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Snackbar } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, LoginInput } from '../utils/validation';
import { useLoginMutation } from '../services/authApi';
import { useAppDispatch } from '../../../redux/store';
import { setCredentials } from '../../../redux/slices/authSlice';
import { CustomInput } from '../../../components/CustomInput';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const LoginScreen = ({ navigation }: any) => {
  console.log('DOCMASTER: LoginScreen rendering...');
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [secureText] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginInput) => {
    setErrorMsg(null);
    try {
      const response = await login(data).unwrap();
      if (response.success && response.data) {
        dispatch(setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));
      } else {
        setErrorMsg(response.message || 'Login failed');
      }
    } catch (err: any) {
      console.log('Login Error: ', err);
      setErrorMsg(err.data?.message || 'Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.headerContainer}>
          <Text style={styles.title} variant="headlineLarge">DocMaster AI</Text>
          <Text style={styles.subtitle} variant="bodyMedium">Your Ultimate PDF & OCR Utility Suite</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle} variant="titleLarge">Welcome Back</Text>
            <Text style={styles.cardSubtitle} variant="bodySmall">Sign in to manage your documents</Text>

            <CustomInput
              control={control}
              name="email"
              label="Email Address"
              placeholder="e.g., alex@example.com"
              keyboardType="email-address"
              leftIcon="email-outline"
            />

            <CustomInput
              control={control}
              name="password"
              label="Password"
              placeholder="Enter password"
              secureTextEntry={secureText}
              leftIcon="lock-outline"
              rightIcon={secureText ? 'eye-off' : 'eye'}
            />

            <TouchableOpacity
              onPress={() => navigation.navigate('ForgotPassword')}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText} variant="bodyMedium">
                Forgot Password?
              </Text>
            </TouchableOpacity>

            <CustomButton
              title="Log In"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text variant="bodyMedium">Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.link} variant="bodyMedium">Sign Up</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg(null)}
        duration={3000}
        style={styles.snackbar}
      >
        {errorMsg}
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
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.placeholder,
    marginTop: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cardSubtitle: {
    color: theme.colors.placeholder,
    marginBottom: 24,
    marginTop: 4,
  },
  button: {
    marginTop: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  snackbar: {
    backgroundColor: theme.colors.error,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 8,
  },
  forgotText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
});

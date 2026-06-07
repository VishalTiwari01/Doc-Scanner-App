import React, { useState } from 'react';
import { StyleSheet, View, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Card, Snackbar } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterInput } from '../utils/validation';
import { useRegisterMutation } from '../services/authApi';
import { useAppDispatch } from '../../../redux/store';
import { setCredentials } from '../../../redux/slices/authSlice';
import { CustomInput } from '../../../components/CustomInput';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const RegisterScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [secureText, setSecureText] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setErrorMsg(null);
    try {
      const response = await register(data).unwrap();
      if (response.success && response.data) {
        dispatch(setCredentials({
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
        }));
      } else {
        setErrorMsg(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.log('Register Error: ', err);
      setErrorMsg(err.data?.message || 'Email already exists or invalid data');
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
          <Text style={styles.subtitle} variant="bodyMedium">Create your account</Text>
        </View>

        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.cardTitle} variant="titleLarge">Get Started</Text>
            <Text style={styles.cardSubtitle} variant="bodySmall">Access unlimited PDF and OCR utilities</Text>

            <CustomInput
              control={control}
              name="fullName"
              label="Full Name"
              placeholder="e.g., Alex Johnson"
              leftIcon="account-outline"
              autoCapitalize="words"
            />

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
              name="phone"
              label="Phone Number"
              placeholder="e.g., +15555555"
              keyboardType="phone-pad"
              leftIcon="phone-outline"
            />

            <CustomInput
              control={control}
              name="password"
              label="Password"
              placeholder="Enter password (min 6 characters)"
              secureTextEntry={secureText}
              leftIcon="lock-outline"
              rightIcon={secureText ? 'eye-off' : 'eye'}
              onRightIconPress={() => setSecureText(!secureText)}
            />

            <CustomButton
              title="Create Account"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text variant="bodyMedium">Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.link} variant="bodyMedium">Log In</Text>
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
    marginBottom: 24,
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
    marginBottom: 20,
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
});

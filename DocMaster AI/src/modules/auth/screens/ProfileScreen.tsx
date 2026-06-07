import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, Alert } from 'react-native';
import { Text, Card, Avatar, Snackbar } from 'react-native-paper';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema, ProfileInput } from '../utils/validation';
import { useUpdateProfileMutation } from '../services/authApi';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { updateUserProfile, logout } from '../../../redux/slices/authSlice';
import { CustomInput } from '../../../components/CustomInput';
import { CustomButton } from '../../../components/CustomButton';
import { theme } from '../../../styles/theme';

export const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [updateProfile, { isLoading }] = useUpdateProfileMutation();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { control, handleSubmit, reset } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
    },
  });

  // Sync state if user updates elsewhere
  useEffect(() => {
    if (user) {
      reset({
        fullName: user.fullName,
        phone: user.phone,
      });
    }
  }, [user, reset]);

  const onSubmit = async (data: ProfileInput) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const response = await updateProfile(data).unwrap();
      if (response.success && response.data) {
        dispatch(updateUserProfile(response.data));
        setSuccessMsg('Profile updated successfully');
      } else {
        setErrorMsg(response.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.log('Update Profile Error: ', err);
      setErrorMsg(err.data?.message || 'Error updating profile');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of DocMaster AI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            dispatch(logout());
          },
        },
      ]
    );
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.avatarSection}>
        <Avatar.Text size={80} label={initials} style={styles.avatar} labelStyle={styles.avatarLabel} />
        <Text variant="headlineSmall" style={styles.userName}>
          {user?.fullName}
        </Text>
        <Text variant="bodyMedium" style={styles.userEmail}>
          {user?.email}
        </Text>
      </View>

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.cardTitle}>
            Edit Profile
          </Text>

          <CustomInput
            control={control}
            name="fullName"
            label="Full Name"
            placeholder="Edit your name"
            leftIcon="account-outline"
            autoCapitalize="words"
          />

          <CustomInput
            control={control}
            name="phone"
            label="Phone Number"
            placeholder="Edit your phone"
            keyboardType="phone-pad"
            leftIcon="phone-outline"
          />

          <CustomButton
            title="Save Changes"
            onPress={handleSubmit(onSubmit)}
            loading={isLoading}
            style={styles.saveButton}
          />
        </Card.Content>
      </Card>

      <CustomButton
        title="Log Out"
        onPress={handleLogout}
        mode="outlined"
        icon="logout"
        style={styles.logoutButton}
        labelStyle={styles.logoutButtonLabel}
      />

      <Snackbar
        visible={!!successMsg}
        onDismiss={() => setSuccessMsg(null)}
        duration={3000}
        style={styles.successSnackbar}
      >
        {successMsg}
      </Snackbar>

      <Snackbar
        visible={!!errorMsg}
        onDismiss={() => setErrorMsg(null)}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {errorMsg}
      </Snackbar>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  avatar: {
    backgroundColor: theme.colors.primary,
  },
  avatarLabel: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 12,
  },
  userEmail: {
    color: theme.colors.placeholder,
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    elevation: 2,
    marginBottom: 24,
  },
  cardTitle: {
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  saveButton: {
    marginTop: 8,
  },
  logoutButton: {
    borderColor: theme.colors.error,
    borderWidth: 1.5,
  },
  logoutButtonLabel: {
    color: theme.colors.error,
  },
  successSnackbar: {
    backgroundColor: 'green',
  },
  errorSnackbar: {
    backgroundColor: theme.colors.error,
  },
});

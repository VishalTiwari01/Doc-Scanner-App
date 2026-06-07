import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { theme } from '../styles/theme';

interface CustomButtonProps {
  onPress: () => void;
  title: string;
  mode?: 'text' | 'outlined' | 'contained';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
  labelStyle?: any;
  textColor?: string;
}

export const CustomButton = ({
  onPress,
  title,
  mode = 'contained',
  loading = false,
  disabled = false,
  icon,
  style,
  labelStyle,
  textColor,
}: CustomButtonProps) => {
  return (
    <Button
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      textColor={textColor}
      style={[
        mode === 'contained' ? styles.contained : styles.outlined,
        style,
      ]}
      labelStyle={[
        mode === 'contained' ? styles.containedLabel : styles.outlinedLabel,
        labelStyle,
      ]}
      theme={{ colors: { primary: theme.colors.primary } }}
    >
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  contained: {
    borderRadius: 8,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  outlined: {
    borderRadius: 8,
    paddingVertical: 4,
    borderWidth: 1.5,
  },
  containedLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  outlinedLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 0.5,
  },
});

import React from 'react';
import { StyleSheet, View } from 'react-native';
import { TextInput, HelperText } from 'react-native-paper';
import { Control, Controller, FieldPath, FieldValues } from 'react-hook-form';

interface CustomInputProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
}

export const CustomInput = <TFieldValues extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  leftIcon,
  rightIcon,
  onRightIconPress,
}: CustomInputProps<TFieldValues>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View style={styles.container}>
          <TextInput
            mode="outlined"
            label={label}
            placeholder={placeholder}
            value={value || ''}
            onChangeText={onChange}
            onBlur={onBlur}
            secureTextEntry={secureTextEntry}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            error={!!error}
            style={styles.input}
            left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
            right={rightIcon ? <TextInput.Icon icon={rightIcon} onPress={onRightIconPress} /> : undefined}
          />
          <HelperText type="error" visible={!!error} style={styles.helper}>
            {error?.message}
          </HelperText>
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
  },
  helper: {
    paddingLeft: 4,
  },
});

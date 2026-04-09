import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { screenStyles } from './shared';

export function LoginScreen({ onOpenRegister }: { onOpenRegister: () => void }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await login({ identifier: identifier.trim(), password });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={screenStyles.container}>
      <View style={screenStyles.card}>
        <Text style={screenStyles.title}>Entrar</Text>
        <Text style={screenStyles.subtitle}>Use email ou NIF para autenticar.</Text>

        <TextInput
          style={screenStyles.input}
          autoCapitalize="none"
          placeholder="Email ou NIF"
          value={identifier}
          onChangeText={setIdentifier}
        />
        <TextInput
          style={screenStyles.input}
          autoCapitalize="none"
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={screenStyles.error}>{error}</Text> : null}

        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonPrimary]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={screenStyles.buttonTextPrimary}>Entrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonSecondary, { marginTop: 10 }]} onPress={onOpenRegister}>
          <Text style={screenStyles.buttonTextSecondary}>Criar conta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

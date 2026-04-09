import type { UserRole } from '@bulir-challenges/api-contracts';
import React, { useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { screenStyles } from './shared';

export function RegisterScreen({ onBack }: { onBack: () => void }) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [nif, setNif] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('CLIENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        nif: nif.trim(),
        password,
        role,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={screenStyles.container}>
      <View style={screenStyles.card}>
        <Text style={screenStyles.title}>Registo</Text>

        <TextInput style={screenStyles.input} placeholder="Nome" value={name} onChangeText={setName} />
        <TextInput
          style={screenStyles.input}
          autoCapitalize="none"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={screenStyles.input}
          keyboardType="numeric"
          placeholder="NIF (9 digitos)"
          value={nif}
          onChangeText={setNif}
        />
        <TextInput
          style={screenStyles.input}
          autoCapitalize="none"
          placeholder="Senha"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <View style={screenStyles.row}>
          <TouchableOpacity
            style={[screenStyles.button, role === 'CLIENT' ? screenStyles.buttonPrimary : screenStyles.buttonSecondary, screenStyles.grow]}
            onPress={() => setRole('CLIENT')}
          >
            <Text style={role === 'CLIENT' ? screenStyles.buttonTextPrimary : screenStyles.buttonTextSecondary}>Cliente</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[screenStyles.button, role === 'PROVIDER' ? screenStyles.buttonPrimary : screenStyles.buttonSecondary, screenStyles.grow]}
            onPress={() => setRole('PROVIDER')}
          >
            <Text style={role === 'PROVIDER' ? screenStyles.buttonTextPrimary : screenStyles.buttonTextSecondary}>Prestador</Text>
          </TouchableOpacity>
        </View>

        {error ? <Text style={[screenStyles.error, { marginTop: 10 }]}>{error}</Text> : null}

        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonPrimary, { marginTop: 10 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={screenStyles.buttonTextPrimary}>Criar conta</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonSecondary, { marginTop: 10 }]} onPress={onBack}>
          <Text style={screenStyles.buttonTextSecondary}>Voltar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

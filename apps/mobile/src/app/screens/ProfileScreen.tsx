import React, { useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../lib/errors';
import { getApiBaseUrl } from '../lib/http';
import { screenStyles } from './shared';

export function ProfileScreen() {
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doRefresh = async () => {
    setError(null);
    setLoading(true);
    try {
      await refreshUser();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={screenStyles.container}>
      <Text style={screenStyles.title}>Perfil</Text>

      <View style={screenStyles.card}>
        <Text style={screenStyles.muted}>Nome: {user?.name}</Text>
        <Text style={screenStyles.muted}>Email: {user?.email}</Text>
        <Text style={screenStyles.muted}>NIF: {user?.nif}</Text>
        <Text style={screenStyles.muted}>Role: {user?.role}</Text>
        <Text style={screenStyles.muted}>Saldo: EUR {user?.balance}</Text>
        <Text style={[screenStyles.muted, { marginTop: 8 }]}>API: {getApiBaseUrl()}</Text>
      </View>

      {error ? <Text style={screenStyles.error}>{error}</Text> : null}

      <TouchableOpacity style={[screenStyles.button, screenStyles.buttonSecondary, { marginBottom: 10 }]} onPress={() => void doRefresh()}>
        {loading ? <ActivityIndicator /> : <Text style={screenStyles.buttonTextSecondary}>Atualizar dados</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={[screenStyles.button, screenStyles.buttonDanger]} onPress={() => void logout()}>
        <Text style={screenStyles.buttonTextPrimary}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

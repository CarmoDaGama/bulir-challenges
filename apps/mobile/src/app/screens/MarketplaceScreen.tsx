import type { Service } from '@bulir-challenges/api-contracts';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import * as api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { screenStyles } from './shared';

function makeIdempotencyKey() {
  return `mobile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function MarketplaceScreen() {
  const { user, withAuth, refreshUser } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = async (nextPage = page) => {
    setError(null);
    try {
      const result = await withAuth((token) =>
        api.listServices(token, {
          page: nextPage,
          pageSize: 10,
          query: query || undefined,
        })
      );
      setServices(result.items);
      setPage(result.meta.page);
      setTotalPages(result.meta.totalPages);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contract = async (serviceId: string) => {
    setError(null);
    setSuccess(null);
    try {
      await withAuth((token) => api.createTransaction(token, { serviceId, idempotencyKey: makeIdempotencyKey() }));
      await refreshUser();
      setSuccess('Servico contratado com sucesso.');
      await load(page);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const balance = Number(user?.balance ?? '0');

  return (
    <ScrollView style={screenStyles.container}>
      <Text style={screenStyles.title}>Servicos</Text>
      <Text style={screenStyles.subtitle}>Saldo atual: EUR {balance.toFixed(2)}</Text>

      <View style={screenStyles.card}>
        <TextInput style={screenStyles.input} placeholder="Pesquisar" value={query} onChangeText={setQuery} />
        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonSecondary]} onPress={() => void load(1)}>
          <Text style={screenStyles.buttonTextSecondary}>Aplicar filtro</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={screenStyles.error}>{error}</Text> : null}
      {success ? <Text style={{ color: '#166534', marginBottom: 10 }}>{success}</Text> : null}

      {services.map((service) => {
        const canAfford = balance >= Number(service.price);

        return (
          <View style={screenStyles.card} key={service.id}>
            <Text style={screenStyles.serviceTitle}>{service.title}</Text>
            <Text style={screenStyles.muted}>{service.description}</Text>
            <Text style={[screenStyles.muted, { marginTop: 6 }]}>EUR {service.price}</Text>
            <TouchableOpacity
              style={[
                screenStyles.button,
                canAfford ? screenStyles.buttonPrimary : screenStyles.buttonSecondary,
                { marginTop: 10 },
              ]}
              disabled={!canAfford}
              onPress={() => void contract(service.id)}
            >
              <Text style={canAfford ? screenStyles.buttonTextPrimary : screenStyles.buttonTextSecondary}>
                {canAfford ? 'Contratar' : 'Saldo insuficiente'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <View style={[screenStyles.row, { marginBottom: 20 }]}>
        <TouchableOpacity
          style={[screenStyles.button, screenStyles.buttonSecondary, screenStyles.grow]}
          disabled={page <= 1}
          onPress={() => void load(page - 1)}
        >
          <Text style={screenStyles.buttonTextSecondary}>Anterior</Text>
        </TouchableOpacity>
        <Text style={screenStyles.muted}>Pagina {page} de {totalPages}</Text>
        <TouchableOpacity
          style={[screenStyles.button, screenStyles.buttonSecondary, screenStyles.grow]}
          disabled={page >= totalPages}
          onPress={() => void load(page + 1)}
        >
          <Text style={screenStyles.buttonTextSecondary}>Proxima</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

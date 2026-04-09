import type { Transaction, TransactionStatus, TransactionType } from '@bulir-challenges/api-contracts';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import * as api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { screenStyles } from './shared';

export function TransactionsScreen() {
  const { withAuth } = useAuth();
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = async (nextPage = page) => {
    setError(null);
    try {
      const result = await withAuth((token) =>
        api.listTransactions(token, {
          page: nextPage,
          pageSize: 10,
          from: from || undefined,
          to: to || undefined,
          status: (status || undefined) as TransactionStatus | undefined,
          type: (type || undefined) as TransactionType | undefined,
        })
      );
      setItems(result.items);
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

  return (
    <ScrollView style={screenStyles.container}>
      <Text style={screenStyles.title}>Transacoes</Text>

      <View style={screenStyles.card}>
        <TextInput style={screenStyles.input} placeholder="From (ISO date)" value={from} onChangeText={setFrom} />
        <TextInput style={screenStyles.input} placeholder="To (ISO date)" value={to} onChangeText={setTo} />
        <TextInput style={screenStyles.input} placeholder="Status (PENDING|COMPLETED|FAILED)" value={status} onChangeText={setStatus} />
        <TextInput style={screenStyles.input} placeholder="Type (PURCHASE|REFUND)" value={type} onChangeText={setType} />
        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonSecondary]} onPress={() => void load(1)}>
          <Text style={screenStyles.buttonTextSecondary}>Aplicar filtros</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={screenStyles.error}>{error}</Text> : null}

      {items.map((item) => (
        <View style={screenStyles.card} key={item.id}>
          <Text style={screenStyles.serviceTitle}>{item.service.title}</Text>
          <Text style={screenStyles.muted}>Valor: EUR {item.amount}</Text>
          <Text style={screenStyles.muted}>Status: {item.status}</Text>
          <Text style={screenStyles.muted}>Tipo: {item.type}</Text>
          <Text style={screenStyles.muted}>Data: {new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      ))}

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

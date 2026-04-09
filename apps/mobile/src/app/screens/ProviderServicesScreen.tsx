import type { Service } from '@bulir-challenges/api-contracts';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../auth/AuthContext';
import * as api from '../lib/api';
import { getErrorMessage } from '../lib/errors';
import { screenStyles } from './shared';

export function ProviderServicesScreen() {
  const { withAuth } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async (nextPage = page) => {
    setError(null);
    try {
      const result = await withAuth((token) =>
        api.listServices(token, {
          page: nextPage,
          pageSize: 10,
          query: query || undefined,
          mine: true,
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

  const save = async () => {
    setError(null);
    try {
      if (editingId) {
        await withAuth((token) => api.updateService(token, editingId, { title, description, price }));
      } else {
        await withAuth((token) => api.createService(token, { title, description, price }));
      }
      setTitle('');
      setDescription('');
      setPrice('');
      setEditingId(null);
      await load(1);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (serviceId: string) => {
    Alert.alert('Remover servico', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await withAuth((token) => api.deleteService(token, serviceId));
            await load(1);
          } catch (err) {
            setError(getErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={screenStyles.container}>
      <Text style={screenStyles.title}>Meus servicos</Text>

      <View style={screenStyles.card}>
        <TextInput style={screenStyles.input} placeholder="Pesquisar" value={query} onChangeText={setQuery} />
        <TouchableOpacity style={[screenStyles.button, screenStyles.buttonSecondary]} onPress={() => void load(1)}>
          <Text style={screenStyles.buttonTextSecondary}>Aplicar filtro</Text>
        </TouchableOpacity>
      </View>

      <View style={screenStyles.card}>
        <Text style={screenStyles.subtitle}>{editingId ? 'Editar servico' : 'Novo servico'}</Text>
        <TextInput style={screenStyles.input} placeholder="Titulo" value={title} onChangeText={setTitle} />
        <TextInput
          style={screenStyles.input}
          placeholder="Descricao"
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={screenStyles.input}
          placeholder="Preco (ex: 49.90)"
          keyboardType="decimal-pad"
          value={price}
          onChangeText={setPrice}
        />

        {error ? <Text style={screenStyles.error}>{error}</Text> : null}

        <View style={screenStyles.row}>
          <TouchableOpacity style={[screenStyles.button, screenStyles.buttonPrimary, screenStyles.grow]} onPress={() => void save()}>
            <Text style={screenStyles.buttonTextPrimary}>{editingId ? 'Atualizar' : 'Criar'}</Text>
          </TouchableOpacity>
          {editingId ? (
            <TouchableOpacity
              style={[screenStyles.button, screenStyles.buttonSecondary, screenStyles.grow]}
              onPress={() => {
                setEditingId(null);
                setTitle('');
                setDescription('');
                setPrice('');
              }}
            >
              <Text style={screenStyles.buttonTextSecondary}>Cancelar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {services.map((service) => (
        <View style={screenStyles.card} key={service.id}>
          <Text style={screenStyles.serviceTitle}>{service.title}</Text>
          <Text style={screenStyles.muted}>{service.description}</Text>
          <Text style={[screenStyles.muted, { marginTop: 6 }]}>EUR {service.price}</Text>
          <View style={[screenStyles.row, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[screenStyles.button, screenStyles.buttonSecondary, screenStyles.grow]}
              onPress={() => {
                setEditingId(service.id);
                setTitle(service.title);
                setDescription(service.description);
                setPrice(service.price);
              }}
            >
              <Text style={screenStyles.buttonTextSecondary}>Editar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[screenStyles.button, screenStyles.buttonDanger, screenStyles.grow]}
              onPress={() => remove(service.id)}
            >
              <Text style={screenStyles.buttonTextPrimary}>Remover</Text>
            </TouchableOpacity>
          </View>
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

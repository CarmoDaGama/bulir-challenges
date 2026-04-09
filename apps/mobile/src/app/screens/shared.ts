import { StyleSheet } from 'react-native';

export const screenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fb',
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 12,
  },
  input: {
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    marginBottom: 10,
  },
  button: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#0f766e',
  },
  buttonDanger: {
    backgroundColor: '#be123c',
  },
  buttonSecondary: {
    backgroundColor: '#e2e8f0',
  },
  buttonTextPrimary: {
    color: '#ffffff',
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#0f172a',
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  grow: {
    flex: 1,
  },
  serviceTitle: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  muted: {
    color: '#64748b',
  },
  error: {
    color: '#b91c1c',
    marginBottom: 10,
  },
});

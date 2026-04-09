import React, { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginScreen } from './screens/LoginScreen';
import { MarketplaceScreen } from './screens/MarketplaceScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { ProviderServicesScreen } from './screens/ProviderServicesScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';

const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthFlow() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      {mode === 'login' ? (
        <AuthStack.Screen name="Login">
          {() => <LoginScreen onOpenRegister={() => setMode('register')} />}
        </AuthStack.Screen>
      ) : (
        <AuthStack.Screen name="Register">
          {() => <RegisterScreen onBack={() => setMode('login')} />}
        </AuthStack.Screen>
      )}
    </AuthStack.Navigator>
  );
}

function ProtectedTabs() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <Tab.Navigator>
      {user.role === 'PROVIDER' ? (
        <Tab.Screen name="Meus Servicos" component={ProviderServicesScreen} />
      ) : (
        <Tab.Screen name="Servicos" component={MarketplaceScreen} />
      )}
      <Tab.Screen name="Transacoes" component={TransactionsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fb' }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>A carregar...</Text>
      </View>
    );
  }

  return status === 'authenticated' ? <ProtectedTabs /> : <AuthFlow />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

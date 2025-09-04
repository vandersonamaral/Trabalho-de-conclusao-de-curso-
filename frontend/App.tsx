import React, { useState, useEffect, useRef } from "react";
import { AuthProvider, useAuth } from "./src/contexts/AuthContext";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import SolicitarReserva from "./src/screens/SolicitarReserva";
import DetalheReserva from "./src/screens/DetalheReserva";
import QRCodeReserva from "./src/screens/QRCodeReserva";
import EditarPerfilAluno from "./src/screens/EditarPerfilAluno";
import RecuperarSenhaAluno from "./src/screens/RecuperarSenhaAluno";
import AppTabs from "./src/navigation/AppTabs";

const Stack = createStackNavigator();
const { width, height } = Dimensions.get("window");

// Tela de Splash
function SplashScreen({ onFinish }: { onFinish: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <LinearGradient
      colors={["#667eea", "#764ba2"]}
      style={styles.splashContainer}
    >
      <View style={styles.splashContent}>
        <View style={styles.logoContainer}>
          <FontAwesome5 name="bus" size={80} color="#fff" />
        </View>
        <Text style={styles.splashTitle}>Transporte Universitário</Text>
        <Text style={styles.splashSubtitle}>
          Sua mobilidade, nossa prioridade
        </Text>

        <View style={styles.loadingContainer}>
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
          <View style={styles.loadingDot} />
        </View>
      </View>
    </LinearGradient>
  );
}

function MainApp() {
  const { isAuthenticated } = useAuth();
  const navigationRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1000);
  }, []);

  useEffect(() => {
    if (!isLoading && navigationRef.current) {
      if (!isAuthenticated) {
        navigationRef.current.reset({ index: 0, routes: [{ name: "Login" }] });
      }
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <SplashScreen onFinish={() => setIsLoading(false)} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "AppTabs" : "Login"}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen
          name="RecuperarSenhaAluno"
          component={RecuperarSenhaAluno}
        />
        <Stack.Screen name="AppTabs" component={AppTabs} />
        <Stack.Screen name="SolicitarReserva" component={SolicitarReserva} />
        <Stack.Screen name="DetalheReserva" component={DetalheReserva} />
        <Stack.Screen name="QRCodeReserva" component={QRCodeReserva} />
        <Stack.Screen name="EditarPerfilAluno" component={EditarPerfilAluno} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  splashContent: {
    alignItems: "center",
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 30,
  },
  splashTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  splashSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
    marginBottom: 60,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 4,
  },
});

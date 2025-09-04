import React, { useEffect, useState } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeAluno from "../screens/HomeAluno";
import MinhasReservas from "../screens/MinhasReservas";
import PerfilAluno from "../screens/PerfilAluno";
import CarteirinhaAluno from "../screens/CarteirinhaAluno";
import HomeMotorista from "../screens/HomeMotorista";
import HomeSupervisor from "../screens/HomeSupervisor";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const Tab = createBottomTabNavigator();

// Função simples para decodificar JWT (sem biblioteca externa)
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return null;
  }
};

interface DecodedToken {
  id: string;
  role: string;
  exp: number;
}

export default function AppTabs() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    getUserRole();
  }, []);

  const getUserRole = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (token) {
        const decoded: DecodedToken = decodeJWT(token);
        if (decoded) {
          setUserRole(decoded.role);
        }
      }
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      setUserRole("ALUNO"); // fallback
    }
  };

  // Configuração de abas baseada no role
  const getTabsForRole = () => {
    switch (userRole) {
      case "MOTORISTA":
        return (
          <>
            <Tab.Screen
              name="HomeMotorista"
              component={HomeMotorista}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="home" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="ListaEmbarques"
              component={require("../screens/ListaEmbarquesMotorista").default}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="list-alt" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="PerfilMotorista"
              component={require("../screens/PerfilMotorista").default}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person" color={color} size={30} />
                ),
              }}
            />
          </>
        );

      case "SUPERVISOR":
        return (
          <>
            <Tab.Screen
              name="HomeSupervisor"
              component={HomeSupervisor}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="home" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="PendentesAprovacao"
              component={require("../screens/PendentesAprovacao").default}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="pending-actions" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="Instituicoes"
              component={require("../screens/Instituicoes").default}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="business" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="PerfilSupervisor"
              component={require("../screens/PerfilSupervisor").default}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person" color={color} size={30} />
                ),
              }}
            />
          </>
        );

      default: // ALUNO
        return (
          <>
            <Tab.Screen
              name="HomeAluno"
              component={HomeAluno}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="home" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="MinhasReservas"
              component={MinhasReservas}
              options={{
                tabBarIcon: ({ color }) => (
                  <FontAwesome5 name="calendar-check" color={color} size={24} />
                ),
              }}
            />
            <Tab.Screen
              name="CarteirinhaAluno"
              component={CarteirinhaAluno}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="confirmation-number" color={color} size={30} />
                ),
              }}
            />
            <Tab.Screen
              name="PerfilAluno"
              component={PerfilAluno}
              options={{
                tabBarIcon: ({ color }) => (
                  <MaterialIcons name="person" color={color} size={30} />
                ),
              }}
            />
          </>
        );
    }
  };

  if (!userRole) {
    // Renderiza uma versão padrão enquanto carrega o role
    return (
      <Tab.Navigator
        initialRouteName="HomeAluno"
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#007bff",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: { paddingVertical: 18, paddingHorizontal: 24, height: 84 },
          tabBarLabelStyle: { fontSize: 13 },
          tabBarItemStyle: { marginHorizontal: 24 },
          tabBarShowLabel: false,
        }}
      >
        <Tab.Screen
          name="HomeAluno"
          component={HomeAluno}
          options={{
            tabBarIcon: ({ color }) => (
              <MaterialIcons name="home" color={color} size={30} />
            ),
          }}
        />
      </Tab.Navigator>
    );
  }
  return (
    <Tab.Navigator
      initialRouteName={
        userRole === "MOTORISTA" ? "HomeMotorista" : 
        userRole === "SUPERVISOR" ? "HomeSupervisor" : 
        "HomeAluno"
      }
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "#888",
        tabBarStyle: { paddingVertical: 18, paddingHorizontal: 24, height: 84 },
        tabBarLabelStyle: { fontSize: 13 },
        tabBarItemStyle: { marginHorizontal: 24 },
        tabBarShowLabel: false,
      }}
    >
      {getTabsForRole()}
    </Tab.Navigator>
  );
}

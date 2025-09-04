import React, { createContext, useContext, useState, useEffect } from "react";
import { subscribeAuthEvent } from "./authEvents";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AuthContextProps {
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
  isAuthenticated: false,
  setAuthenticated: () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("token");
      setIsAuthenticated(!!token);
    };
    checkToken();
    // Escuta eventos de logout/token removido
    const unsubscribe = subscribeAuthEvent(() => {
      checkToken();
    });
    return unsubscribe;
  }, []);

  const setAuthenticated = (auth: boolean) => {
    setIsAuthenticated(auth);
  };

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuthenticated, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { getToken } from "./src/services/api";
import LoginScreen from "./src/screens/LoginScreen";
import RegisterScreen from "./src/screens/RegisterScreen";
import HomeScreen from "./src/screens/HomeScreen";
import SpiritsScreen from "./src/screens/SpiritsScreen";
import SpiritDetailScreen from "./src/screens/SpiritDetailScreen";
import CreateSpiritScreen from "./src/screens/CreateSpiritScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    getToken().then((token) => setIsLoggedIn(!!token));
  }, []);

  if (isLoggedIn === null) return null; // splash

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#0a0a1a" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "900" },
          contentStyle: { backgroundColor: "#0a0a1a" },
        }}
      >
        {isLoggedIn ? (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: "🌙 Nightasaur" }} />
            <Stack.Screen name="Spirits" component={SpiritsScreen} options={{ title: "我的精靈" }} />
            <Stack.Screen name="SpiritDetail" component={SpiritDetailScreen} options={{ title: "精靈詳情" }} />
            <Stack.Screen name="CreateSpirit" component={CreateSpiritScreen} options={{ title: "孵化精靈" }} />
          </>
        ) : (
          <>
            <Stack.Screen name="Login" options={{ headerShown: false }}>
              {(props) => <LoginScreen {...props} onLogin={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
            <Stack.Screen name="Register" options={{ headerShown: false }}>
              {(props) => <RegisterScreen {...props} onRegister={() => setIsLoggedIn(true)} />}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
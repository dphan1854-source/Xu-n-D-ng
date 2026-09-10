import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import MainTabNavigator from "@navigation/MainTabNavigator";
import ProfileScreen from "@screens/ProfileScreen";
import { COLORS } from "@constants/theme";

const Drawer = createDrawerNavigator();

interface Props {
    onLogout: () => void;
    cartBadgeCount?: number;
}

const RootDrawerNavigator = ({ onLogout, cartBadgeCount = 0 }: Props) => {
    return (
        <Drawer.Navigator
            screenOptions={{
                headerShown: true,
                drawerActiveTintColor: COLORS.primary,
            }}
        >
            {/* Toàn bộ MainTabNavigator (Home + Cart) được nhồi vào làm 1 "trang" của Drawer */}
            <Drawer.Screen name="MainApp" options={{ title: "ShopAI" }}>
                {() => <MainTabNavigator onLogout={onLogout} cartBadgeCount={cartBadgeCount} />}
            </Drawer.Screen>
            <Drawer.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: "Hồ sơ của tôi" }}
            />
        </Drawer.Navigator>
    );
};

export default RootDrawerNavigator;
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS, SIZES } from "@constants/theme";

// Placeholder: Logic Hồ sơ thật (đổi ảnh, đổi tên...) sẽ làm khi cần
const ProfileScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.emoji}>👤</Text>
                <Text style={styles.title}>Hồ sơ của tôi</Text>
                <Text style={styles.subtitle}>Bài tập Drawer Navigator — Phần 5.5</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.background },
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    emoji: { fontSize: 48, marginBottom: 12 },
    title: { fontSize: SIZES.h2, fontWeight: "bold", color: COLORS.text },
    subtitle: { fontSize: SIZES.body2, color: COLORS.textLight, marginTop: 4 },
});

export default ProfileScreen;
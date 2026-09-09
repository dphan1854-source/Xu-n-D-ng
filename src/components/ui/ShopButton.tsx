// src/components/ui/ShopButton.tsx
import React, { memo } from "react";
import {
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    ViewStyle,
    TextStyle,
} from "react-native";
import Typography from "@components/ui/Typography";
import { COLORS, SIZES } from "@constants/theme";

export interface ShopButtonProps {
    title: string;
    onPress: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "outline"; // ➕ MỚI — không truyền thì mặc định 'primary'
    style?: ViewStyle;
    textStyle?: TextStyle;
    accessibilityLabel?: string;
}

const ShopButton: React.FC<ShopButtonProps> = ({
    title,
    onPress,
    isLoading = false,
    disabled = false,
    variant = "primary",
    style,
    textStyle,
    accessibilityLabel,
}) => {
    // Tra đúng style nền + màu chữ theo variant
    const variantStyle = styles[variant];
    const textColor = variant === "outline" ? COLORS.primary : COLORS.surface;

    return (
        <TouchableOpacity
            // Thứ tự mảng style: layout chung -> màu theo variant -> khoá (disabled) -> style riêng từ props
            style={[
                styles.button,
                variantStyle,
                disabled && styles.disabledButton,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || isLoading}
            activeOpacity={0.8}
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityRole="button"
        >
            {isLoading ? (
                <ActivityIndicator color={textColor} />
            ) : (
                <Typography
                    variant="body1"
                    color={textColor}
                    style={[{ fontWeight: "600" }, textStyle]}
                >
                    {title}
                </Typography>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        height: 48,
        borderRadius: SIZES.radius,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: SIZES.padding,
        width: "100%",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 4,
    },
    disabledButton: {
        backgroundColor: COLORS.border,
        shadowOpacity: 0,
        elevation: 0,
    },
    // Ba biến thể: chỉ đổi màu nền/viền/bóng, dùng chung layout từ `button`
    primary: {
        backgroundColor: COLORS.primary,
    },
    secondary: {
        backgroundColor: COLORS.secondary,
        shadowOpacity: 0,
        elevation: 0,
    },
    outline: {
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        shadowOpacity: 0,
        elevation: 0,
    },
});

export default memo(ShopButton);
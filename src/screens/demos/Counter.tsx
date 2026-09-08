import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function Counter() {
  const [count, setCount] = useState<number>(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bộ Đếm Số</Text>
      <Text style={styles.countText}>{count}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.decrementBtn]}
          onPress={() => setCount((prev) => prev - 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>- 1</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.resetBtn]}
          onPress={() => setCount(0)}
          activeOpacity={0.7}
        >
          <Text style={styles.resetBtnText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.incrementBtn]}
          onPress={() => setCount((prev) => prev + 1)}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>+ 1</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  countText: {
    fontSize: 64,
    fontWeight: '800',
    color: '#FF4D4F',
    marginBottom: 32,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  decrementBtn: {
    backgroundColor: '#FF7875',
  },
  incrementBtn: {
    backgroundColor: '#FF4D4F',
  },
  resetBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  resetBtnText: {
    color: '#595959',
    fontSize: 16,
    fontWeight: '600',
  },
});

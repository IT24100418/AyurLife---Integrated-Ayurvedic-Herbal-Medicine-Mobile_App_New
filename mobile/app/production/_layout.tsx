import { Stack } from 'expo-router';

export default function ProductionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="formulas" />
      <Stack.Screen name="batches" />
      <Stack.Screen name="orders" />
    </Stack>
  );
}

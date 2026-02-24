import { Link, Stack } from "expo-router";
import { View, Text } from "react-native";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View className="flex-1 bg-nexus-bg items-center justify-center px-8">
        <Text className="text-white text-xl font-bold mb-4">
          Page not found
        </Text>
        <Link href="/" className="mt-4">
          <Text className="text-nexus-purple text-sm font-medium">
            Go to Home
          </Text>
        </Link>
      </View>
    </>
  );
}

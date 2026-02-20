import { Link, Stack, type Href } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Side ikke funnet" }} />
      <View style={styles.container}>
        <Text style={styles.title}>Denne siden finnes ikke</Text>

        <Link href={"/" as Href} style={styles.link}>
          <Text style={styles.linkText}>Gå til oversikt</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text.primary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600" as const,
  },
});

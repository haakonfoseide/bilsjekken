import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Colors from "@/constants/colors";
import { log } from "@/lib/logger";

type AppErrorBoundaryProps = {
  children: React.ReactNode;
};

type AppErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
  errorName?: string;
};

export default class AppErrorBoundary extends React.PureComponent<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
    errorName: undefined,
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    const err = error as { message?: unknown; name?: unknown } | null;
    const errorMessage =
      typeof err?.message === "string"
        ? err.message
        : "Noe gikk galt. Prøv igjen.";

    return {
      hasError: true,
      errorMessage,
      errorName: typeof err?.name === "string" ? err.name : undefined,
    };
  }

  componentDidCatch(error: unknown, info: unknown) {
    log("[ErrorBoundary] Caught error", error);
    log("[ErrorBoundary] Component stack", info);
  }

  private handleReset = () => {
    this.setState({ hasError: false, errorMessage: "", errorName: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.root} testID="error-boundary">
        <View style={styles.card}>
          <Text style={styles.kicker}>Bilsjekken</Text>
          <Text style={styles.title}>Appen krasjet</Text>
          <Text style={styles.subtitle} numberOfLines={4}>
            {this.state.errorMessage}
          </Text>

          {Platform.OS !== "web" && this.state.errorName ? (
            <Text style={styles.meta} numberOfLines={1}>
              {this.state.errorName}
            </Text>
          ) : null}

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.button, styles.primaryBtn]}
              onPress={this.handleReset}
              activeOpacity={0.85}
              testID="error-boundary-retry"
            >
              <Text style={styles.primaryBtnText}>Prøv igjen</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.help}>
            Hvis dette skjer igjen: lukk appen helt og åpne på nytt.
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0b1220",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 520,
    borderRadius: 20,
    backgroundColor: "#0f172a",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    padding: 18,
  },
  kicker: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    color: "#fff",
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 10,
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600" as const,
  },
  meta: {
    marginTop: 8,
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "600" as const,
  },
  row: {
    marginTop: 14,
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800" as const,
  },
  help: {
    marginTop: 14,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontWeight: "600" as const,
  },
});

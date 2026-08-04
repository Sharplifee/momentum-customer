import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { currentCoords, getForecast, serviceDayOutlook } from "./weather";

/**
 * A single line of weather above the web app.
 *
 * Deliberately one line, not a panel. The customer came to see their schedule
 * or pay a bill; the weather is context, not the point. It earns its space by
 * answering the service-day question before they ask it.
 */
export function WeatherBar() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await currentCoords();
      if (!coords) {
        // Location refused. Fall back to the middle of the service area rather
        // than showing nothing — most customers are within a few miles of it.
        const fallback = { lat: 40.5622, lng: -111.9297 };
        const data = await getForecast(fallback);
        if (!cancelled) setState(data ? { status: "ok", data, approx: true } : { status: "off" });
        return;
      }
      const data = await getForecast(coords);
      if (!cancelled) setState(data ? { status: "ok", data } : { status: "off" });
    })();
    return () => { cancelled = true; };
  }, []);

  if (state.status === "off") return null;

  if (state.status === "loading") {
    return (
      <View style={styles.bar}>
        <ActivityIndicator size="small" color="#7FB8BE" />
      </View>
    );
  }

  const { data } = state;
  const today = data.days?.[0];
  const outlook = serviceDayOutlook(data.today);
  const tone = outlook?.tone ?? "good";

  return (
    <Pressable style={styles.bar} accessibilityRole="summary"
      accessibilityLabel={`${Math.round(today?.highF ?? 0)} degrees. ${outlook?.text ?? ""}`}>
      <View style={[styles.dot, tone === "warn" ? styles.warn : tone === "watch" ? styles.watch : styles.good]} />
      <Text style={styles.temp}>{Math.round(today?.highF ?? 0)}°</Text>
      <Text style={styles.text} numberOfLines={1}>
        {outlook?.text ?? "Clear for your visit."}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: "#0F1720", borderBottomWidth: 1, borderBottomColor: "#22303D",
    minHeight: 44,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  good: { backgroundColor: "#5FB98B" },
  watch: { backgroundColor: "#D9A441" },
  warn: { backgroundColor: "#D9776F" },
  temp: { color: "#E8F1F3", fontSize: 15, fontWeight: "600" },
  text: { color: "#93A7B2", fontSize: 13, flex: 1 },
});

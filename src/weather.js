import * as Location from "expo-location";

/**
 * Live weather for the customer's own property.
 *
 * This is the app's main reason to be native rather than a bookmark. A lawn
 * customer's first question on service day is always the same — is it going to
 * rain, are they still coming — and answering it on the device, from their
 * actual location, is something the web app cannot do.
 *
 * WeatherKit is Apple's own service and needs no third-party key: on iOS the
 * REST API authenticates with a token minted from the team's private key. We
 * ask the server for that token rather than shipping the key in the bundle,
 * where anyone could extract it.
 */

const API = "https://momentumlandscapingut.com";

/** Ask once, politely, and only when the person opens the weather view. */
export async function ensureLocation() {
  const existing = await Location.getForegroundPermissionsAsync();
  if (existing.status === "granted") return true;
  if (!existing.canAskAgain) return false;
  const asked = await Location.requestForegroundPermissionsAsync();
  return asked.status === "granted";
}

export async function currentCoords() {
  const ok = await ensureLocation();
  if (!ok) return null;
  try {
    const pos = await Location.getLastKnownPositionAsync({ maxAge: 15 * 60 * 1000 })
      ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return pos ? { lat: pos.coords.latitude, lng: pos.coords.longitude } : null;
  } catch {
    return null;
  }
}

/**
 * Forecast for a point. Falls back to the service address when location is
 * refused, because a customer who says no to location still deserves to know
 * whether it will rain on their lawn.
 */
export async function getForecast({ lat, lng, sessionToken }) {
  if (lat == null || lng == null) return null;
  try {
    const res = await fetch(
      `${API}/api/weather?lat=${lat}&lng=${lng}`,
      sessionToken ? { headers: { Authorization: `Bearer ${sessionToken}` } } : undefined
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Plain-English read on whether service day looks workable.
 *
 * Deliberately not a raw percentage. "60% chance of precipitation" makes a
 * customer decide for themselves; "rain likely, we may move you" tells them
 * what it means for their yard, which is the only thing they wanted to know.
 */
export function serviceDayOutlook(day) {
  if (!day) return null;
  const rain = day.precipitationChance ?? 0;
  const wind = day.windSpeedMax ?? 0;

  if (rain >= 0.7) {
    return { tone: "warn", text: "Rain likely — we may move your visit. We'll text you if we do." };
  }
  if (rain >= 0.4) {
    return { tone: "watch", text: "Showers possible. We'll keep an eye on it and let you know." };
  }
  if (wind >= 35) {
    return { tone: "watch", text: "Windy — clippings may scatter, so we'll take extra care on cleanup." };
  }
  return { tone: "good", text: "Clear for your visit." };
}

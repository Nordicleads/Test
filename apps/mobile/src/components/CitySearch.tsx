import { useState, useEffect, useRef } from "react";
import { View, TextInput, StyleSheet } from "react-native";

export interface CityHit {
  place_id: number;
  name: string;
  country: string;
  lat: number;
  lng: number;
}

interface Props {
  onHitsChange: (hits: CityHit[]) => void;
  onClear: () => void;
  style?: object;
}

export function CitySearch({ onHitsChange, onClear, style }: Props) {
  const [text, setText] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(timer.current);
    if (text.length < 2) {
      onHitsChange([]);
      return;
    }
    timer.current = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=12`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "en", "User-Agent": "WANDR-App/1.0" },
        });
        const data: any[] = await res.json();
        const hits: CityHit[] = data
          .filter(
            (r) =>
              r.class === "place" &&
              ["city", "town", "village", "municipality", "borough", "suburb"].includes(r.type)
          )
          .slice(0, 8)
          .map((r) => ({
            place_id: r.place_id,
            name:
              r.address?.city ||
              r.address?.town ||
              r.address?.village ||
              r.address?.municipality ||
              r.name,
            country: r.address?.country ?? "",
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          }));
        onHitsChange(hits);
      } catch {
        onHitsChange([]);
      }
    }, 380);
    return () => clearTimeout(timer.current);
  }, [text]);

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        style={styles.input}
        placeholder="Any city in the world…"
        placeholderTextColor="#555"
        value={text}
        onChangeText={(t) => {
          setText(t);
          if (!t) { onHitsChange([]); onClear(); }
        }}
        returnKeyType="search"
        onSubmitEditing={() => onHitsChange([])}
        autoCorrect={false}
        autoCapitalize="words"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  input: {
    backgroundColor: "#161616",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#f0ece4",
    fontSize: 14,
  },
});

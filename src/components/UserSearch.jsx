import React, { useState, useEffect, useRef } from "react";
import {
  View,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Text,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { searchUsers } from "../services/userService";

export default function UserSearch({
  value,
  onChangeText,
  onSelect,
  placeholder = "@usuario",
  excludeIds = [],
  limit = 6,
  debounceMs = 300,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef(null);
  const requestRef = useRef(0);

  const normalizeQuery = (text) => (text || "").replace(/^@/, "").trim();

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const q = normalizeQuery(value);
    if (!q) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const currentRequest = requestRef.current + 1;
    requestRef.current = currentRequest;

    timeoutRef.current = setTimeout(() => {
      buscar(q, currentRequest);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value, debounceMs, excludeIds]);

  async function buscar(q, requestId) {
    setLoading(true);
    try {
      const { data: filtered, error } = await searchUsers(q, { excludeIds, limit });
      if (error) {
        throw error;
      }

      if (requestRef.current === requestId) {
        setSuggestions(filtered);
      }
    } catch (err) {
      if (requestRef.current === requestId) {
        setSuggestions([]);
      }
    } finally {
      if (requestRef.current === requestId) {
        setLoading(false);
      }
    }
  }

  function handleSelect(user) {
    onSelect?.(user);
    setSuggestions([]);
  }

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#B514F6" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      ) : null}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <FlatList
            data={suggestions}
            keyExtractor={(item, index) => String(item.id ?? index)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.suggestionItem}
                onPress={() => handleSelect(item)}
              >
                <Image
                  source={{
                    uri: item.foto_perfil || "https://via.placeholder.com/40",
                  }}
                  style={styles.avatar}
                />
                <View style={styles.suggestionTextWrap}>
                  <Text style={styles.suggestionText}>@{item.username}</Text>
                  {(item.nombre || item.apellido) ? (
                    <Text style={styles.suggestionMeta} numberOfLines={1}>
                      {[item.nombre, item.apellido].filter(Boolean).join(" ")}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  input: {
    backgroundColor: "#2E2E3A",
    color: "white",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Utendo",
  },
  suggestionsContainer: {
    backgroundColor: "#2B2B32",
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomColor: "#3a3a3a",
    borderBottomWidth: 1,
  },
  avatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10 },
  suggestionTextWrap: { flex: 1 },
  suggestionText: { color: "white", fontFamily: "Utendo" },
  suggestionMeta: { color: "#B8B8B8", fontFamily: "Utendo", fontSize: 12 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: { color: "#B8B8B8", marginLeft: 8 },
});

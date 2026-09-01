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
import supabase from "../services/supabaseClient";

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

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    const q = (value || "").replace(/^@/, "").trim();
    if (!q) {
      setSuggestions([]);
      return;
    }

    timeoutRef.current = setTimeout(() => {
      buscar(q);
    }, debounceMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [value]);

  async function buscar(q) {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("usuario")
        .select("id,username,foto_perfil")
        .ilike("username", `${q}%`)
        .limit(limit);

      const filtered = (data || []).filter((u) => !excludeIds.includes(u.id));
      setSuggestions(filtered);
    } catch (err) {
      setSuggestions([]);
    } finally {
      setLoading(false);
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
            keyExtractor={(item) => item.id}
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
                <Text style={styles.suggestionText}>@{item.username}</Text>
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
  suggestionText: { color: "white", fontFamily: "Utendo" },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  loadingText: { color: "#B8B8B8", marginLeft: 8 },
});

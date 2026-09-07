import { View, Text, StyleSheet, TextInput } from "react-native";

function Input({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  Icon,
  ...props
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconoTexto}>
        {Icon && <Icon color="#FFFFFF" size={28} />}
        <Text style={styles.texto}>{label}</Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },

  iconoTexto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },

  texto: {
    color: "white",
    fontFamily: "Utendo",
    fontSize: 20,
  },

  input: {
    borderRadius: 15,
    borderColor: "#57575c",
    borderWidth: 2,
    backgroundColor: "#36363a",
    padding: 15,
    color: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
});

export default Input;

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { buscarSugerenciasFechasPorGrupo } from '../services/horariosService';

export default function BuscadorFechas({
  visible,
  onClose,
  idGrupo,
  opcionesExistentes = [],
  onAgregarFecha,
}) {
  const [anticipacion, setAnticipacion] = useState(7);
  const [horaDesde, setHoraDesde] = useState('09:00');
  const [horaHasta, setHoraHasta] = useState('21:00');
  const [cargando, setCargando] = useState(false);
  const [sugerencias, setSugerencias] = useState([]);
  const [estado, setEstado] = useState('idle');
  const [error, setError] = useState('');

  const buscar = async () => {
    if (!idGrupo) {
      setError('No se pudo identificar el grupo.');
      setEstado('error');
      return;
    }

    setCargando(true);
    setError('');
    setEstado('loading');

    const { data, error: errorBusqueda } = await buscarSugerenciasFechasPorGrupo({
      idGrupo,
      anticipacion,
      horaDesde,
      horaHasta,
    });

    setCargando(false);

    if (errorBusqueda) {
      setSugerencias([]);
      setEstado('error');
      setError(errorBusqueda.message || 'No se pudo buscar fechas.');
      return;
    }

    if (!Array.isArray(data) || data.length === 0) {
      setSugerencias([]);
      setEstado('vacio');
      return;
    }

    setSugerencias(data);
    setEstado('ok');
  };

  const puedeAgregar = (fecha) => !opcionesExistentes.includes(fecha);

  const informacionEstado = useMemo(() => {
    if (estado === 'error') {
      return error;
    }

    if (estado === 'vacio') {
      return 'No hay horarios cargados en el grupo todavía. Pedile a los integrantes que agreguen sus calendarios manualmente.';
    }

    if (estado === 'loading') {
      return 'Buscando coincidencias entre los horarios del grupo...';
    }

    return 'Buscá momentos puntuales dentro del rango elegido.';
  }, [error, estado]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.capa} onPress={onClose}>
        <Pressable style={styles.modal} onPress={() => null}>
          <View style={styles.header}>
            <Text style={styles.titulo}>Sugerir fechas</Text>
            <Pressable onPress={onClose} style={styles.cerrarButton}>
              <Text style={styles.cerrarTexto}>✕</Text>
            </Pressable>
          </View>

          <Text style={styles.label}>Anticipación</Text>
          <View style={styles.rowPills}>
            {[7, 15, 30].map((valor) => (
              <Pressable
                key={valor}
                style={[styles.pill, anticipacion === valor && styles.pillActivo]}
                onPress={() => setAnticipacion(valor)}
              >
                <Text style={styles.pillTexto}>{valor} días</Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Franja horaria</Text>
          <View style={styles.rowInputs}>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Desde</Text>
              <TextInput
                style={styles.input}
                value={horaDesde}
                onChangeText={setHoraDesde}
                placeholder="09:00"
                placeholderTextColor="#8A8A8A"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Hasta</Text>
              <TextInput
                style={styles.input}
                value={horaHasta}
                onChangeText={setHoraHasta}
                placeholder="21:00"
                placeholderTextColor="#8A8A8A"
                autoCapitalize="none"
              />
            </View>
          </View>

          <Pressable style={styles.botonBuscar} onPress={buscar} disabled={cargando || !idGrupo}>
            {cargando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.botonBuscarTexto}>Buscar sugerencias</Text>
            )}
          </Pressable>

          <Text style={styles.info}>{informacionEstado}</Text>

          {estado === 'ok' && (
            <ScrollView style={styles.lista} contentContainerStyle={styles.listaContenido}>
              {sugerencias.map((sugerencia, index) => (
                <View key={`${sugerencia.fechaHoraInicio}-${index}`} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardFecha}>{sugerencia.fecha}</Text>
                    <Text style={styles.cardCantidad}>
                      {sugerencia.personasDisponibles === 1
                        ? '1 persona coincide'
                        : `${sugerencia.personasDisponibles} personas coinciden`}
                    </Text>
                  </View>

                  {Array.isArray(sugerencia.conflictos) && sugerencia.conflictos.length > 0 && (
                    <Text style={styles.aviso}>
                      Este horario se cruza con un horario de {sugerencia.conflictos.join(', ')}.
                    </Text>
                  )}

                  <Pressable
                    style={[
                      styles.agregarButton,
                      !puedeAgregar(sugerencia.fecha) && styles.agregarButtonDisabled,
                    ]}
                    onPress={() => {
                      if (puedeAgregar(sugerencia.fecha)) {
                        onAgregarFecha?.(sugerencia.fecha);
                      }
                    }}
                    disabled={!puedeAgregar(sugerencia.fecha)}
                  >
                    <Text style={styles.agregarTexto}>
                      {puedeAgregar(sugerencia.fecha) ? 'Agregar' : 'Ya agregada'}
                    </Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  capa: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
});

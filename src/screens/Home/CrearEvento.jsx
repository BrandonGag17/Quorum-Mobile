import React, { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ScrollView,
	Platform,
	StyleSheet,
	ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import IndicadorPasos from '../../components/IndicadorPasos';
import Button from '../../components/Botones';
import Input from '../../components/Input';
import ErrorMessage from '../../components/MensajeError';
import useCreateEvent from '../../hooks/useCreateEvent';

const DateTimePicker =
	Platform.OS !== 'web'
		? require('@react-native-community/datetimepicker').default
		: null;

function CrearEvento({ route, onCreado }) {
	const navigation = useNavigation();

	const eventoBase = route?.params?.eventoBase;
	const esRehacer = !!eventoBase;

	const idGrupo = route?.params?.idGrupo || route?.params?.id;

	const [mensaje, setMensaje] = useState('');

	// pasos
	const [paso, setPaso] = useState('paso1');

	// paso 1
	const [nombreJuntada, setNombreJuntada] = useState(eventoBase?.nombre || '');
	const [descripcion, setDescripcion] = useState(eventoBase?.descripcion || '');

	// paso 2
	const [date, setDate] = useState(new Date());
	const [pickerMode, setPickerMode] = useState('date');
	const [showPicker, setShowPicker] = useState(false);
	const [fechaEvento, setFechaEvento] = useState(eventoBase?.fecha_hora_inicio || '');
	const [lugarEvento, setLugarEvento] = useState(eventoBase?.lugar || '');

	const { crearEvento, loading, error } = useCreateEvent();

	const onChangeNativo = (event, selectedDate) => {
		if (event.type === 'dismissed') {
			setShowPicker(false);
			setPickerMode('date');
			return;
		}

		const currentDate = selectedDate || date;
		setDate(currentDate);
		setFechaEvento(currentDate.toISOString());

		if (Platform.OS === 'android') {
			if (pickerMode === 'date') {
				setTimeout(() => {
					setPickerMode('time');
					setShowPicker(true);
				}, 0);
				return;
			} else {
				setShowPicker(false);
				setPickerMode('date');
			}
		}
	};

	const validarPaso1 = () => {
		setMensaje('');
		if (!nombreJuntada.trim()) {
			setMensaje('Ingresá un nombre para la juntada');
			return;
		}
		if (nombreJuntada.trim().length < 3) {
			setMensaje('El nombre debe tener al menos 3 caracteres');
			return;
		}
		setMensaje('');
		setPaso('paso2');
	};

	const validarPaso2 = async () => {
		setMensaje('');
		if (!fechaEvento) {
			setMensaje('Elegí la fecha del evento');
			return;
		}
		if (!lugarEvento.trim()) {
			setMensaje('Ingresá el lugar del evento');
			return;
		}

		// crear evento via hook
		const { data, error: createError } = await crearEvento({
			nombre: nombreJuntada,
			descripcion,
			id_grupo: idGrupo,
			fecha_hora_inicio: fechaEvento,
			lugar_text: lugarEvento,
			invitados: []
		});

		if (createError) {
			setMensaje(createError.message || String(createError));
			return;
		}

		if (onCreado) onCreado();

		navigation.navigate('Juntada', { idEvento: data.id });
	};

	if (paso === 'paso1') {
		return (
			<View style={styles.fondo}>
				<View style={styles.contenedorIndicador}>
					<IndicadorPasos pasoActual={1} totalPasos={2} />
				</View>

				{esRehacer && <Text style={styles.bannerRehacer}>🔁 Rehaciendo juntada</Text>}

				<View style={styles.formulario}>
					<Text style={styles.text}>Nombre de la juntada:</Text>
					<Input value={nombreJuntada} onChangeText={setNombreJuntada} placeholder="Nombre" />

					<Text style={[styles.text, { marginTop: 10 }]}>Descripción (Opcional):</Text>
					<Input value={descripcion} onChangeText={setDescripcion} placeholder="Descripción" />
				</View>

				{mensaje ? <ErrorMessage mensaje={mensaje} /> : null}

				<View style={styles.botonContainer}>
					<Button nombre={loading ? 'Cargando...' : 'Continuar'} onPress={validarPaso1} disabled={loading} />
				</View>
			</View>
		);
	}

	// paso2
	return (
		<View style={styles.fondo}>
			<View style={styles.contenedorIndicador}>
				<IndicadorPasos pasoActual={2} totalPasos={2} />
			</View>

			<ScrollView style={{ marginTop: 40 }}>
				<Text style={styles.text}>Fecha del evento</Text>

				{Platform.OS === 'web' ? (
					<input
						type="datetime-local"
						value={fechaEvento}
						onChange={e => setFechaEvento(e.target.value)}
						style={{
							borderRadius: 15,
							border: '2px solid #979797',
							backgroundColor: '#312e32',
							padding: 15,
							color: 'white',
							width: '100%',
							boxSizing: 'border-box',
							fontFamily: 'Utendo',
							fontSize: 16,
							colorScheme: 'dark',
							marginTop: 10
						}}
					/>
				) : (
					<Pressable onPress={() => { setPickerMode('date'); setShowPicker(true); }}>
						<Text style={{ color: 'white', marginTop: 10 }}>{fechaEvento ? new Date(fechaEvento).toLocaleString() : 'Seleccionar fecha...'}</Text>
					</Pressable>
				)}

				<Text style={[styles.text, { marginTop: 20 }]}>Lugar del evento</Text>
				<Input placeholder="Ej: Casa de Juan, plaza, bar..." value={lugarEvento} onChangeText={setLugarEvento} />

				{showPicker && DateTimePicker && (
					<DateTimePicker
						value={date}
						mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
						is24Hour={true}
						onChange={onChangeNativo}
					/>
				)}

				{mensaje ? <ErrorMessage mensaje={mensaje} /> : null}
				{error ? <ErrorMessage mensaje={error} /> : null}
			</ScrollView>

			<View style={styles.botonContainer}>
				<Button nombre={loading ? 'Cargando...' : 'Crear evento'} onPress={validarPaso2} disabled={loading} />
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	fondo: {
		flex: 1,
		backgroundColor: '#15151C',
		padding: 25,
		justifyContent: 'center'
	},
	text: {
		fontFamily: 'CashMarket',
		color: 'white'
	},
	contenedorIndicador: {
		position: 'absolute',
		top: 25,
		left: 25,
		right: 25,
	},
	formulario: {
		marginTop: 80
	},
	botonContainer: {
		marginTop: 'auto',
		marginBottom: 70
	},
	bannerRehacer: {
		color: 'white',
		textAlign: 'center',
		marginBottom: 12
	}
});

export default CrearEvento;


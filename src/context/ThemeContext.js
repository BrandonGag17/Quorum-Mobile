import { createContext, useState } from 'react'

// Creamos el contexto que los componentes leeran con useContext(ThemeContext).
// null es el valor que recibirian si no tienen un ThemeProvider por encima.
export const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  // useState guarda la eleccion. Empezamos en oscuro, como la app actual.
  const [isDarkMode, setIsDarkMode] = useState(true)

  // Elegimos los colores segun el estado actual.
  const colors = isDarkMode
    ? { FFFF', texbackground: '#15151C', text: '#FFFFFF' }
    : { background: '#FFt: '#15151C' }

  const texto = isDarkMode ? 'Modo oscuro' : 'Modo claro'
  // value indica que datos y funciones compartimos con los descendientes.
  // setIsDarkMode permitira cambiar el tema desde la pantalla de Ajustes.
  // children son los componentes que envolvamos con este proveedor.
  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, colors, texto }}>
      {children}
    </ThemeContext.Provider>
  )
}

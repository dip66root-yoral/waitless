import { createContext, useContext, useState, useEffect } from 'react'

const LocationContext = createContext(null)

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Chennai', 'Hyderabad']

export function LocationProvider({ children }) {
  const [city, setCity] = useState('Mumbai')

  useEffect(() => {
    const saved = localStorage.getItem('waitless_city')
    if (saved && CITIES.includes(saved)) {
      setCity(saved)
    }
  }, [])

  const changeCity = (newCity) => {
    setCity(newCity)
    localStorage.setItem('waitless_city', newCity)
  }

  return (
    <LocationContext.Provider value={{ city, CITIES, changeCity }}>
      {children}
    </LocationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLocation = () => useContext(LocationContext)

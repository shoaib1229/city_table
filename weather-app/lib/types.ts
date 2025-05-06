export interface City {
  id: string
  name: string
  country: string
  timezone: string
  population: number
  latitude: number
  longitude: number
}

export interface WeatherData {
  current: {
    temp: number
    feelsLike: number
    humidity: number
    pressure: number
    windSpeed: number
    visibility: number
    condition: string
  }
  forecast: Array<{
    date: string
    tempMax: number
    tempMin: number
    condition: string
    precipitation: number
  }>
}

export interface WeatherSummary {
  temp: number
  condition: string
}

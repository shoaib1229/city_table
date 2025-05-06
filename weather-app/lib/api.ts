// Fix the previous edit by exporting the API key
// API key for OpenWeatherMap
export const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY" // Replace with your API key
import type { City, WeatherData, WeatherSummary } from "./types"

// API key for OpenWeatherMap
// const OPENWEATHER_API_KEY = "YOUR_OPENWEATHER_API_KEY" // Replace with your API key

// Function to check if we're using a real API key
function isUsingRealApiKey(): boolean {
  return OPENWEATHER_API_KEY !== "YOUR_OPENWEATHER_API_KEY" && OPENWEATHER_API_KEY.length > 10
}

// Function to fetch cities from the API
export async function fetchCities(page = 1, search = ""): Promise<City[]> {
  const limit = 20
  const offset = (page - 1) * limit

  let url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&rows=${limit}&start=${offset}&sort=name`

  if (search) {
    url += `&q=${encodeURIComponent(search)}`
  }

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch cities: ${response.status}`)
    }

    const data = await response.json()

    return data.records.map((record: any) => ({
      id: record.recordid,
      name: record.fields.name,
      country: record.fields.cou_name_en,
      timezone: record.fields.timezone || "Unknown",
      population: record.fields.population || 0,
      latitude: record.fields.coordinates[0],
      longitude: record.fields.coordinates[1],
    }))
  } catch (error) {
    console.error("Error fetching cities:", error)
    throw error
  }
}

// Function to fetch a specific city by ID
export async function fetchCityById(id: string): Promise<City> {
  const url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&q=recordid:${id}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch city: ${response.status}`)
    }

    const data = await response.json()

    if (data.records.length === 0) {
      throw new Error("City not found")
    }

    const record = data.records[0]

    return {
      id: record.recordid,
      name: record.fields.name,
      country: record.fields.cou_name_en,
      timezone: record.fields.timezone || "Unknown",
      population: record.fields.population || 0,
      latitude: record.fields.coordinates[0],
      longitude: record.fields.coordinates[1],
    }
  } catch (error) {
    console.error("Error fetching city by ID:", error)
    throw error
  }
}

// Function to fetch weather data for a city
export async function fetchWeatherForCity(lat: number, lon: number): Promise<WeatherData> {
  // Check if we're using the placeholder API key
  if (OPENWEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    // Return mock data if no valid API key is provided
    return getMockWeatherData(lat, lon)
  }

  const url = `https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lon}&exclude=minutely,hourly&units=metric&appid=${OPENWEATHER_API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Weather API returned status ${response.status}. Falling back to mock data.`)
      return getMockWeatherData(lat, lon)
    }

    const data = await response.json()

    return {
      current: {
        temp: Math.round(data.current.temp),
        feelsLike: Math.round(data.current.feels_like),
        humidity: data.current.humidity,
        pressure: data.current.pressure,
        windSpeed: data.current.wind_speed,
        visibility: data.current.visibility / 1000, // Convert to km
        condition: data.current.weather[0].description,
      },
      forecast: data.daily.slice(0, 5).map((day: any) => ({
        date: new Date(day.dt * 1000).toISOString(),
        tempMax: Math.round(day.temp.max),
        tempMin: Math.round(day.temp.min),
        condition: day.weather[0].description,
        precipitation: Math.round(day.pop * 100), // Probability of precipitation
      })),
    }
  } catch (error) {
    console.error("Error fetching weather:", error)
    // Return mock data on error
    return getMockWeatherData(lat, lon)
  }
}

// Function to fetch just a weather summary for a city (for the table)
export async function fetchWeatherSummary(lat: number, lon: number): Promise<WeatherSummary> {
  // Check if we're using the placeholder API key
  if (OPENWEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY") {
    // Return mock data if no valid API key is provided
    return getMockWeatherSummary(lat, lon)
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`

  try {
    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Weather API returned status ${response.status}. Falling back to mock data.`)
      return getMockWeatherSummary(lat, lon)
    }

    const data = await response.json()

    return {
      temp: Math.round(data.main.temp),
      condition: data.weather[0].description,
    }
  } catch (error) {
    console.error("Error fetching weather summary:", error)
    // Return mock data on error
    return getMockWeatherSummary(lat, lon)
  }
}

// Add these helper functions for mock data at the end of the file
// Function to generate mock weather summary data
function getMockWeatherSummary(lat: number, lon: number): WeatherSummary {
  // Use latitude to vary the temperature (just for some variety in the mock data)
  const baseTemp = 20
  const tempVariation = (Math.abs(lat) % 10) - 5

  // Generate a random condition from this list
  const conditions = [
    "clear sky",
    "few clouds",
    "scattered clouds",
    "broken clouds",
    "shower rain",
    "rain",
    "thunderstorm",
    "snow",
    "mist",
  ]
  const conditionIndex = Math.floor(Math.abs(lat + lon) % conditions.length)

  return {
    temp: Math.round(baseTemp + tempVariation),
    condition: conditions[conditionIndex],
  }
}

// Function to generate more detailed mock weather data
function getMockWeatherData(lat: number, lon: number): WeatherData {
  const summary = getMockWeatherSummary(lat, lon)
  const baseTemp = summary.temp

  // Generate mock forecast data
  const forecast = []
  for (let i = 0; i < 5; i++) {
    const dayVariation = Math.sin(i) * 3
    const conditions = [
      "clear sky",
      "few clouds",
      "scattered clouds",
      "broken clouds",
      "shower rain",
      "rain",
      "thunderstorm",
      "snow",
      "mist",
    ]
    const conditionIndex = Math.floor((Math.abs(lat + lon) + i) % conditions.length)

    forecast.push({
      date: new Date(Date.now() + i * 86400000).toISOString(), // Add i days to current date
      tempMax: Math.round(baseTemp + dayVariation + 3),
      tempMin: Math.round(baseTemp + dayVariation - 3),
      condition: conditions[conditionIndex],
      precipitation: Math.round(Math.abs(Math.sin(lat + lon + i)) * 100),
    })
  }

  return {
    current: {
      temp: baseTemp,
      feelsLike: baseTemp - 2,
      humidity: Math.round(Math.abs(Math.sin(lat)) * 50 + 50), // 50-100%
      pressure: Math.round(1000 + Math.abs(Math.cos(lon)) * 30), // 1000-1030 hPa
      windSpeed: Math.round(Math.abs(Math.sin(lat + lon)) * 20), // 0-20 km/h
      visibility: 10, // 10 km
      condition: summary.condition,
    },
    forecast: forecast,
  }
}

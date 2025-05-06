"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Droplets, Thermometer, Wind } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { City, WeatherData } from "@/lib/types"
import { fetchCityById, fetchWeatherForCity, OPENWEATHER_API_KEY } from "@/lib/api"

export default function CityWeatherPage() {
  const { id } = useParams()
  const [city, setCity] = useState<City | null>(null)
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(true)

  // Update the useEffect hook to check if we're using mock data
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        // Check if we're using the placeholder API key
        setUsingMockData(OPENWEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY")

        // Fetch city data
        const cityData = await fetchCityById(id as string)
        setCity(cityData)

        // Fetch weather data
        if (cityData) {
          const weatherData = await fetchWeatherForCity(cityData.latitude, cityData.longitude)
          setWeather(weatherData)
        }
      } catch (err) {
        console.error("Error loading data:", err)
        setError("Failed to load weather data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadData()
    }
  }, [id])

  // Get background class based on weather condition
  const getWeatherBackground = () => {
    if (!weather) return "bg-gradient-to-br from-blue-100 to-blue-200"

    const condition = weather.current.condition.toLowerCase()
    if (condition.includes("clear") || condition.includes("sunny")) {
      return "bg-gradient-to-br from-yellow-100 to-blue-200"
    } else if (condition.includes("cloud")) {
      return "bg-gradient-to-br from-gray-100 to-gray-300"
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
      return "bg-gradient-to-br from-blue-200 to-blue-400"
    } else if (condition.includes("snow")) {
      return "bg-gradient-to-br from-blue-50 to-gray-200"
    } else if (condition.includes("thunder") || condition.includes("storm")) {
      return "bg-gradient-to-br from-gray-400 to-gray-700"
    }
    return "bg-gradient-to-br from-blue-100 to-blue-200"
  }

  // Get weather icon based on condition
  const getWeatherIcon = () => {
    if (!weather) return null

    const condition = weather.current.condition.toLowerCase()
    if (condition.includes("clear") || condition.includes("sunny")) {
      return "☀️"
    } else if (condition.includes("cloud")) {
      return "☁️"
    } else if (condition.includes("rain") || condition.includes("drizzle")) {
      return "🌧️"
    } else if (condition.includes("snow")) {
      return "❄️"
    } else if (condition.includes("thunder") || condition.includes("storm")) {
      return "⚡"
    }
    return "🌤️"
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <div className="mb-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cities
            </Button>
          </Link>
        </div>
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${getWeatherBackground()} transition-colors duration-500`}>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-4">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cities
            </Button>
          </Link>
        </div>

        {usingMockData && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-lg mb-4">
            <p className="font-medium">Using mock weather data</p>
            <p className="text-sm">
              To display real weather data, replace "YOUR_OPENWEATHER_API_KEY" in lib/api.ts with a valid OpenWeatherMap
              API key.
            </p>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          </div>
        ) : (
          <>
            {city && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold">{city.name}</h1>
                <p className="text-lg text-gray-600 dark:text-gray-300">
                  {city.country}, {city.timezone}
                </p>
              </div>
            )}

            {weather && (
              <div className="space-y-6">
                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Current Weather</span>
                      <span className="text-4xl">{getWeatherIcon()}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <div className="flex items-center">
                          <Thermometer className="h-6 w-6 mr-2 text-orange-500" />
                          <div>
                            <p className="text-4xl font-bold">{weather.current.temp}°C</p>
                            <p className="text-gray-500 dark:text-gray-400">Feels like {weather.current.feelsLike}°C</p>
                          </div>
                        </div>
                        <p className="mt-2 text-lg capitalize">{weather.current.condition}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center">
                          <Wind className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Wind</p>
                            <p>{weather.current.windSpeed} km/h</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <Droplets className="h-5 w-5 mr-2 text-blue-500" />
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Humidity</p>
                            <p>{weather.current.humidity}%</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Pressure</p>
                            <p>{weather.current.pressure} hPa</p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-2 text-yellow-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                            />
                          </svg>
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Visibility</p>
                            <p>{weather.current.visibility} km</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <h2 className="text-2xl font-bold mt-8 mb-4">5-Day Forecast</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {weather.forecast.map((day, index) => (
                    <Card key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">
                          {new Date(day.date).toLocaleDateString("en-US", {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-center">
                          <div className="text-3xl mb-2">
                            {day.condition.includes("clear")
                              ? "☀️"
                              : day.condition.includes("cloud")
                                ? "☁️"
                                : day.condition.includes("rain")
                                  ? "🌧️"
                                  : day.condition.includes("snow")
                                    ? "❄️"
                                    : day.condition.includes("thunder")
                                      ? "⚡"
                                      : "🌤️"}
                          </div>
                          <p className="capitalize text-sm mb-2">{day.condition}</p>
                          <div className="flex justify-between items-center">
                            <span className="font-bold">{day.tempMax}°</span>
                            <span className="text-gray-500 dark:text-gray-400">{day.tempMin}°</span>
                          </div>
                          <p className="text-sm mt-2">
                            <span className="text-blue-500">{day.precipitation}%</span> chance of rain
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

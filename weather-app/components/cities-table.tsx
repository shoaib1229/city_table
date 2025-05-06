"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { ChevronDown, ChevronUp, Search, ArrowUpDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { City, WeatherSummary } from "@/lib/types"
import { fetchCities, fetchWeatherSummary, OPENWEATHER_API_KEY } from "@/lib/api"
import { debounce } from "@/lib/utils"

// Add a notification about using mock data at the top of the component, right after the imports
export default function CitiesTable() {
  const router = useRouter()
  const [cities, setCities] = useState<Array<City & { weather?: WeatherSummary }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof City
    direction: "asc" | "desc"
  } | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const observer = useRef<IntersectionObserver | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [usingMockData, setUsingMockData] = useState(true)

  // Function to load cities
  const loadCities = useCallback(async (pageNum: number, search = "") => {
    try {
      setLoading(true)
      const newCities = await fetchCities(pageNum, search)

      if (newCities.length === 0) {
        setHasMore(false)
      } else {
        if (pageNum === 1) {
          setCities(newCities)
        } else {
          setCities((prevCities) => {
            // Filter out duplicates
            const existingIds = new Set(prevCities.map((city) => city.id))
            const uniqueNewCities = newCities.filter((city) => !existingIds.has(city.id))
            return [...prevCities, ...uniqueNewCities]
          })
        }
      }
    } catch (err) {
      console.error("Error fetching cities:", err)
      setError("Failed to load cities. Please try again later.")
    } finally {
      setLoading(false)
    }
  }, [])

  // Update the useEffect hook to check if we're using mock data
  // Load initial data
  useEffect(() => {
    loadCities(1, searchTerm)
    // Check if we're using the placeholder API key
    setUsingMockData(OPENWEATHER_API_KEY === "YOUR_OPENWEATHER_API_KEY")
  }, [loadCities])

  // Setup intersection observer for infinite scroll
  const lastCityElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore],
  )

  // Load more cities when page changes
  useEffect(() => {
    if (page > 1) {
      loadCities(page, searchTerm)
    }
  }, [page, searchTerm, loadCities])

  // Fetch weather summaries for visible cities
  useEffect(() => {
    const fetchWeatherForVisibleCities = async () => {
      const citiesToFetch = cities.filter((city) => !city.weather).slice(0, 20) // Limit to first 20 cities without weather data

      if (citiesToFetch.length === 0) return

      try {
        const weatherPromises = citiesToFetch.map((city) =>
          fetchWeatherSummary(city.latitude, city.longitude)
            .then((weatherData) => ({ cityId: city.id, weather: weatherData }))
            .catch(() => ({ cityId: city.id, weather: null })),
        )

        const weatherResults = await Promise.all(weatherPromises)

        setCities((prevCities) =>
          prevCities.map((city) => {
            const weatherResult = weatherResults.find((w) => w.cityId === city.id)
            if (weatherResult && weatherResult.weather) {
              return { ...city, weather: weatherResult.weather }
            }
            return city
          }),
        )
      } catch (err) {
        console.error("Error fetching weather summaries:", err)
      }
    }

    fetchWeatherForVisibleCities()
  }, [cities])

  // Handle search input change with debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)

    if (value.length > 1) {
      // Get suggestions based on current cities
      const cityNames = cities
        .map((city) => city.name)
        .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)

      setSuggestions(cityNames)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    debouncedSearch(value)
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setPage(1)
      setHasMore(true)
      loadCities(1, searchValue)
    }, 500),
    [loadCities],
  )

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setShowSuggestions(false)
    setPage(1)
    setHasMore(true)
    loadCities(1, suggestion)
  }

  // Handle sorting
  const handleSort = (key: keyof City) => {
    let direction: "asc" | "desc" = "asc"

    if (sortConfig && sortConfig.key === key) {
      direction = sortConfig.direction === "asc" ? "desc" : "asc"
    }

    setSortConfig({ key, direction })

    // Sort the cities
    const sortedCities = [...cities].sort((a, b) => {
      if (a[key] < b[key]) return direction === "asc" ? -1 : 1
      if (a[key] > b[key]) return direction === "asc" ? 1 : -1
      return 0
    })

    setCities(sortedCities)
  }

  // Handle city click
  const handleCityClick = (cityId: string) => {
    router.push(`/city/${cityId}`)
  }

  // Handle right click (open in new tab)
  const handleCityRightClick = (cityId: string, e: React.MouseEvent) => {
    // Don't prevent default to allow the browser's context menu
    // Just add the URL to the browser history
    window.open(`/city/${cityId}`, "_blank")
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="flex w-full max-w-sm items-center space-x-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Search cities..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border rounded-md shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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

      {error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-2"
            onClick={() => {
              setError(null)
              loadCities(1, searchTerm)
            }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button variant="ghost" onClick={() => handleSort("name")} className="flex items-center gap-1">
                      City Name
                      {sortConfig?.key === "name" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("country")} className="flex items-center gap-1">
                      Country
                      {sortConfig?.key === "country" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => handleSort("timezone")} className="flex items-center gap-1">
                      Timezone
                      {sortConfig?.key === "timezone" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("population")}
                      className="flex items-center gap-1"
                    >
                      Population
                      {sortConfig?.key === "population" ? (
                        sortConfig.direction === "asc" ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ArrowUpDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Weather</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cities.map((city, index) => (
                  <TableRow key={city.id} ref={index === cities.length - 5 ? lastCityElementRef : null}>
                    <TableCell>
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                        onClick={() => handleCityClick(city.id)}
                        onContextMenu={(e) => handleCityRightClick(city.id, e)}
                      >
                        {city.name}
                      </button>
                    </TableCell>
                    <TableCell>{city.country}</TableCell>
                    <TableCell>{city.timezone}</TableCell>
                    <TableCell>{city.population.toLocaleString()}</TableCell>
                    <TableCell>
                      {city.weather ? (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {city.weather.condition.includes("clear")
                              ? "☀️"
                              : city.weather.condition.includes("cloud")
                                ? "☁️"
                                : city.weather.condition.includes("rain")
                                  ? "🌧️"
                                  : city.weather.condition.includes("snow")
                                    ? "❄️"
                                    : city.weather.condition.includes("thunder")
                                      ? "⚡"
                                      : "🌤️"}
                          </span>
                          <span>{city.weather.temp}°C</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        Loading cities...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading && cities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No cities found. Try a different search term.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

import CitiesTable from "@/components/cities-table"

export default function Home() {
  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Cities Weather Explorer</h1>
      <CitiesTable />
    </main>
  )
}

import Timer from '@/components/timer'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center pt-10">
      <h1 className="text-4xl font-bold mb-8">TM Timer</h1>
      <Timer />
    </main>
  )
}
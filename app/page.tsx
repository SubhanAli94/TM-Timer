import Timer from '@/components/timer'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center pt-8">
      <div className="flex justify-start items-start w-full">
        <h1 className="text-3xl ml-8">
          <span className="font-bold">TM</span> Timer
        </h1>
      </div>
      <Timer />
    </main>
  )
}
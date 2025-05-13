import { GameContainer } from "@/components/game-container"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white mb-4 sm:mb-8 drop-shadow-md">
          💅 100 Borrachxs Dijieron: Edición Delulu
        </h1>
        <GameContainer />
      </div>
    </main>
  )
}

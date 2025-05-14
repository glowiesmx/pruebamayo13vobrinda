import { GameContainer } from "@/components/game-container"
import Link from "next/link"
import { InfoIcon } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow-md">
            💅 100 Borrachxs Dijieron: Edición Delulu
          </h1>
          <Link
            href="/como-jugar"
            className="flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full text-sm transition-colors"
          >
            <InfoIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Cómo jugar</span>
          </Link>
        </div>
        <GameContainer />
      </div>
    </main>
  )
}

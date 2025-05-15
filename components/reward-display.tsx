"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Share2, RefreshCw, ExternalLink } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface RewardDisplayProps {
  reward: any
  onReset: () => void
}

export function RewardDisplay({ reward, onReset }: RewardDisplayProps) {
  const { toast } = useToast()

  const handleShare = () => {
    // En una implementación real, esto usaría la API Web Share
    // Por ahora, solo mostraremos un toast
    toast({
      title: "¡Compartido!",
      description: "Tu logro ha sido compartido en tus redes sociales (no realmente, pero imagina).",
    })
  }

  return (
    <Card className="w-full border-dashed border-pink-400 border-2 bg-white/90">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl text-center">🏆 ¡Logro Desbloqueado!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 p-4 sm:p-6 rounded-lg text-center">
          <p className="text-base sm:text-lg font-medium mb-2">Feedback del ex tóxico:</p>
          <p className="text-base sm:text-xl italic break-words">
            {reward?.resultado || "¡Eso fue tan delulu que hasta Taylor Swift te daría un like! 💅"}
          </p>
        </div>

        <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 sm:p-6 rounded-lg">
          <p className="text-base sm:text-lg font-medium mb-3">Tu recompensa:</p>

          <div className="space-y-3">
            {reward?.recompensas?.map((recompensa: any, index: number) => (
              <div
                key={index}
                className="bg-white/80 p-3 rounded-lg flex items-start sm:items-center gap-3 flex-wrap sm:flex-nowrap"
              >
                <span className="text-xl sm:text-2xl">
                  {recompensa.tipo === "playlist" ? "🎧" : recompensa.tipo === "filtro" ? "📱" : "📄"}
                </span>
                <div className="w-full sm:w-auto">
                  <p className="font-medium text-sm sm:text-base">{recompensa.nombre}</p>
                  <p className="text-xs sm:text-sm text-gray-600 break-words">{recompensa.descripcion}</p>
                  {recompensa.url && (
                    <a
                      href={recompensa.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs sm:text-sm text-pink-600 hover:text-pink-800 flex items-center mt-1"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" /> Abrir enlace
                    </a>
                  )}
                </div>
              </div>
            )) || (
              <>
                <div className="bg-white/80 p-3 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">🎧</span>
                  <div>
                    <p className="font-medium">Playlist Spotify</p>
                    <p className="text-sm text-gray-600">
                      "Canciones para llorar en el Oxxo mientras stalkeas a tu ex"
                    </p>
                  </div>
                </div>

                <div className="bg-white/80 p-3 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-medium">Filtro Instagram</p>
                    <p className="text-sm text-gray-600">"Golden Hour Falso" para tus stories de peda casera</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-center gap-3">
        <Button variant="outline" className="border-pink-300 hover:bg-pink-100 w-full sm:w-auto" onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartir
        </Button>
        <Button
          onClick={onReset}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Jugar de nuevo
        </Button>
      </CardFooter>
    </Card>
  )
}

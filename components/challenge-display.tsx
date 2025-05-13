"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { HelpCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface ChallengeDisplayProps {
  card: any
  challenge: string
  source?: string
  onNext: () => void
}

export function ChallengeDisplay({ card, challenge, source, onNext }: ChallengeDisplayProps) {
  const [showingHelp, setShowingHelp] = useState(false)
  const { toast } = useToast()

  const handleHelpRequest = async () => {
    setShowingHelp(true)

    // En una implementación real, esto llamaría a la API para obtener ayuda de OpenAI
    // Por ahora, mostraremos algunas ayudas predefinidas
    toast({
      title: "¡Help, estoy en mi peor era! 🧠",
      description: (
        <div className="mt-2 space-y-2">
          <p>- Usa el template: "Perdón, estaba [actividad random] con [celebridad] en [lugar básico]" 💅</p>
          <p>- Menciona tu red flag favorita y gana un shot de validación 🚩🍸</p>
          <p>- Confiesa que tu ex era más falso que el guacamole del Oxxo 🥑</p>
        </div>
      ),
      duration: 8000,
    })
  }

  return (
    <Card className="w-full border-dashed border-pink-400 border-2 bg-white/90">
      <CardHeader className="sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl flex items-center">
            <span className="truncate max-w-[200px] sm:max-w-none">
              {getEmojiForCard(card?.nombre || "")} {card?.nombre || "Carta"}
            </span>
          </CardTitle>

          <div className="flex items-center gap-2">
            {source && source !== "openai" && (
              <Badge variant="outline" className="ml-2 text-xs">
                Desafío predeterminado
              </Badge>
            )}
            {source === "openai" && (
              <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                OpenAI
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleHelpRequest}
              disabled={showingHelp}
              className="text-pink-500 hover:text-pink-700 hover:bg-pink-100 ml-2"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-lg mb-4">
          <p className="text-base sm:text-lg font-medium break-words">{challenge}</p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <p className="text-xs sm:text-sm font-medium text-yellow-800">
              💡 Tip: Entre más cringe, más puntos. ¡No tengas miedo de ser el main character!
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto"
        >
          ✨ Estoy listo para brillar ✨
        </Button>
      </CardFooter>
    </Card>
  )
}

function getEmojiForCard(cardName: string): string {
  const emojiMap: Record<string, string> = {
    "El Delulu": "🌈",
    "El Ghosteador VIP": "👻",
    "El Storytoxic": "📸",
    "El Add to Cart": "🛒",
  }

  return emojiMap[cardName] || "🃏"
}

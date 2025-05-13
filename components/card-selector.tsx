"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface CardSelectorProps {
  onSelectCard: (card: any) => void
  loading: boolean
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Cartas predeterminadas en caso de error
const defaultCards = [
  {
    id: 1,
    nombre: "El Delulu",
    descripcion: "Confiesa tu teoría más 'delulu' que creíste borracho/a",
    variables: { hashtag: "#DeluluIsTheSolulu", emoji: "🌈" },
    tipo: "individual",
  },
  {
    id: 2,
    nombre: "El Ghosteador VIP",
    descripcion: "Recrea el mensaje que enviaste a las 3 AM y luego borraste",
    variables: { formato: "audio de WhatsApp temblando" },
    tipo: "dueto",
  },
  {
    id: 3,
    nombre: "El Storytoxic",
    descripcion: "Crea una story fingiendo que estás en un viaje épico... pero es el Oxxo de tu colonia",
    variables: { filtro: "Golden Hour Falso" },
    tipo: "grupal",
  },
  {
    id: 4,
    nombre: "El Add to Cart",
    descripcion: "Confiesa la compra más random que hiciste ebrio/a en Amazon",
    variables: { emoji: "🛒🔥" },
    tipo: "individual",
  },
]

export function CardSelector({ onSelectCard, loading }: CardSelectorProps) {
  const [cards, setCards] = useState<any[]>([])
  const [loadingCards, setLoadingCards] = useState<boolean>(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchCards() {
      try {
        const { data, error } = await supabase.from("cartas_genz").select("*")

        if (error) throw error

        if (data && data.length > 0) {
          setCards(data)
        } else {
          console.log("No se encontraron cartas en la base de datos, usando cartas predeterminadas")
          setCards(defaultCards)
          toast({
            title: "Usando cartas predeterminadas",
            description: "No se encontraron cartas en la base de datos.",
            variant: "default",
          })
        }
      } catch (error) {
        console.error("Error fetching cards:", error)
        setCards(defaultCards)
        toast({
          title: "Error de conexión",
          description: "Usando cartas predeterminadas para continuar el juego.",
          variant: "default",
        })
      } finally {
        setLoadingCards(false)
      }
    }

    fetchCards()
  }, [toast])

  const handleRandomCard = () => {
    if (cards.length === 0) {
      // Si no hay cartas, usar la primera carta predeterminada
      onSelectCard(defaultCards[0])
      return
    }
    const randomIndex = Math.floor(Math.random() * cards.length)
    onSelectCard(cards[randomIndex])
  }

  if (loadingCards) {
    return (
      <Card className="w-full text-center p-8">
        <CardContent className="pt-6">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">Cargando cartas...</p>
        </CardContent>
      </Card>
    )
  }

  // Si no hay cartas después de cargar, mostrar las predeterminadas
  if (cards.length === 0) {
    setCards(defaultCards)
  }

  return (
    <div className="space-y-6">
      <Card className="w-full text-center">
        <CardHeader>
          <CardTitle className="text-xl sm:text-2xl">Selecciona una carta</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            O deja que el destino elija por ti con una carta aleatoria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cards.map((card) => (
              <Button
                key={card.id}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center justify-center border-2 border-pink-200 hover:border-pink-500 hover:bg-pink-50 transition-all"
                onClick={() => onSelectCard(card)}
                disabled={loading}
              >
                <span className="text-lg sm:text-xl mb-2 truncate max-w-full">
                  {getEmojiForCard(card.nombre)} {card.nombre}
                </span>
                <span className="text-xs sm:text-sm text-gray-500 line-clamp-2 text-center">{card.descripcion}</span>
              </Button>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button
            onClick={handleRandomCard}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cargando...
              </>
            ) : (
              "🎲 Carta Aleatoria"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
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

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, User, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { VotingSystem } from "./voting-system"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

interface Player {
  id: string
  name: string
  avatar?: string
}

interface GameMechanicsProps {
  type: "individual" | "dueto" | "grupal"
  onComplete: (score: number) => void
  players?: Player[]
  mesaId?: string
  activePlayer?: string
  partnerPlayer?: string
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function GameMechanics({
  type,
  onComplete,
  players = [],
  mesaId = "mesa-default",
  activePlayer,
  partnerPlayer,
}: GameMechanicsProps) {
  const [showVoting, setShowVoting] = useState<boolean>(false)
  const { toast } = useToast()
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null

  // Si no hay jugadores, usar jugadores predeterminados
  const defaultPlayers: Player[] = [
    { id: "player-1", name: "Jugador 1" },
    { id: "player-2", name: "Jugador 2" },
    { id: "player-3", name: "Jugador 3" },
  ]

  // Usar jugadores proporcionados o predeterminados
  const gamePlayers = players.length > 0 ? players : defaultPlayers

  // Iniciar la votación
  const startVoting = () => {
    setShowVoting(true)
  }

  // Manejar la finalización de la votación
  const handleVotingComplete = (scores: Record<string, number>) => {
    let finalScore = 0

    if (type === "individual") {
      // Para individual, usar la puntuación del jugador activo
      if (activePlayer) {
        finalScore = scores[activePlayer] || 0
      }
    } else if (type === "dueto") {
      // Para dueto, sumar las puntuaciones de ambos jugadores
      if (activePlayer && partnerPlayer) {
        finalScore = (scores[activePlayer] || 0) + (scores[partnerPlayer] || 0)
      }
    } else {
      // Para grupal, sumar todas las puntuaciones
      finalScore = Object.values(scores).reduce((sum, score) => sum + score, 0)
    }

    onComplete(finalScore)
  }

  if (showVoting) {
    return (
      <VotingSystem
        cardType={type}
        players={gamePlayers}
        activePlayer={activePlayer}
        partnerPlayer={partnerPlayer}
        onComplete={handleVotingComplete}
        mesaId={mesaId}
        currentUserId={userId || undefined}
      />
    )
  }

  return (
    <Card className="w-full border-dashed border-pink-400 border-2 bg-white/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl">
            {type === "individual" ? (
              <span className="flex items-center">
                <User className="mr-2 h-5 w-5" /> Desafío Individual
              </span>
            ) : type === "dueto" ? (
              <span className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5" /> Desafío en Dueto
              </span>
            ) : (
              <span className="flex items-center">
                <Users className="mr-2 h-5 w-5" /> Desafío Grupal
              </span>
            )}
          </CardTitle>
          <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-200">
            {type === "individual" ? "1 jugador" : type === "dueto" ? "2 jugadores" : "Todos juegan"}
          </Badge>
        </div>
        <CardDescription>
          {type === "individual"
            ? "Un solo jugador debe completar este desafío y los demás votan"
            : type === "dueto"
              ? "Dos jugadores deben colaborar para completar este desafío"
              : "Todos los jugadores participan y votan por la mejor respuesta"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === "individual" && activePlayer && (
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Jugador activo:</p>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback className="bg-pink-300">
                  {gamePlayers.find((p) => p.id === activePlayer)?.name[0] || "J"}
                </AvatarFallback>
              </Avatar>
              <span>{gamePlayers.find((p) => p.id === activePlayer)?.name || "Jugador"}</span>
            </div>
          </div>
        )}

        {type === "dueto" && activePlayer && partnerPlayer && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Jugadores del dueto:</p>

            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-center">
                <Avatar className="mx-auto mb-2">
                  <AvatarFallback className="bg-pink-300">
                    {gamePlayers.find((p) => p.id === activePlayer)?.name[0] || "J"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm">{gamePlayers.find((p) => p.id === activePlayer)?.name || "Jugador 1"}</p>
              </div>
              <span className="text-2xl">+</span>
              <div className="text-center">
                <Avatar className="mx-auto mb-2">
                  <AvatarFallback className="bg-purple-300">
                    {gamePlayers.find((p) => p.id === partnerPlayer)?.name[0] || "P"}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm">{gamePlayers.find((p) => p.id === partnerPlayer)?.name || "Jugador 2"}</p>
              </div>
            </div>
          </div>
        )}

        {type === "grupal" && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Todos participan:</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
              {gamePlayers.map((player) => (
                <div key={player.id} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar>
                      <AvatarFallback className="bg-blue-300">{player.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{player.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          onClick={startVoting}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
        >
          Iniciar votación
        </Button>
      </CardFooter>
    </Card>
  )
}

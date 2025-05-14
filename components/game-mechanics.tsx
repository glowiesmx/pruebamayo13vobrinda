"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, User, UserPlus } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { VotingSystem } from "./voting-system"
import { useToast } from "@/hooks/use-toast"

interface GameMechanicsProps {
  type: "individual" | "dueto" | "grupal"
  onComplete: (score: number) => void
  players?: string[]
  mesaId?: string
}

export function GameMechanics({
  type,
  onComplete,
  players = ["Jugador 1", "Jugador 2", "Jugador 3"],
  mesaId = "mesa-default",
}: GameMechanicsProps) {
  const [activePlayer, setActivePlayer] = useState<string | null>(type === "individual" ? players[0] : null)
  const [partnerPlayer, setPartnerPlayer] = useState<string | null>(null)
  const [showVoting, setShowVoting] = useState<boolean>(false)
  const { toast } = useToast()

  // Convertir los nombres de jugadores a objetos de jugador para el sistema de votación
  const playerObjects = players.map((name, index) => ({
    id: `player-${index}`,
    name,
  }))

  // Seleccionar un compañero para el dueto
  const selectPartner = (player: string) => {
    if (type !== "dueto" || activePlayer === null) return
    setPartnerPlayer(player)
  }

  // Iniciar la votación
  const startVoting = () => {
    if (type === "dueto" && !partnerPlayer) {
      toast({
        title: "Selecciona un compañero",
        description: "Debes seleccionar un compañero para el dueto antes de continuar",
        variant: "destructive",
      })
      return
    }

    setShowVoting(true)
  }

  // Manejar la finalización de la votación
  const handleVotingComplete = (scores: Record<string, number>) => {
    let finalScore = 0

    if (type === "individual") {
      // Para individual, usar la puntuación del jugador activo
      const activePlayerId = playerObjects.find((p) => p.name === activePlayer)?.id
      if (activePlayerId) {
        finalScore = scores[activePlayerId] || 0
      }
    } else if (type === "dueto") {
      // Para dueto, sumar las puntuaciones de ambos jugadores
      const activePlayerId = playerObjects.find((p) => p.name === activePlayer)?.id
      const partnerPlayerId = playerObjects.find((p) => p.name === partnerPlayer)?.id

      if (activePlayerId && partnerPlayerId) {
        finalScore = (scores[activePlayerId] || 0) + (scores[partnerPlayerId] || 0)
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
        players={playerObjects}
        activePlayer={playerObjects.find((p) => p.name === activePlayer)?.id}
        partnerPlayer={playerObjects.find((p) => p.name === partnerPlayer)?.id}
        onComplete={handleVotingComplete}
        mesaId={mesaId}
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
        {type === "individual" && (
          <div className="bg-pink-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Jugador activo:</p>
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback className="bg-pink-300">{activePlayer?.[0] || "J"}</AvatarFallback>
              </Avatar>
              <span>{activePlayer}</span>
            </div>
          </div>
        )}

        {type === "dueto" && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Selecciona un compañero para el dueto:</p>

            {partnerPlayer ? (
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <Avatar className="mx-auto mb-2">
                    <AvatarFallback className="bg-pink-300">{activePlayer?.[0] || "J"}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">{activePlayer}</p>
                </div>
                <span className="text-2xl">+</span>
                <div className="text-center">
                  <Avatar className="mx-auto mb-2">
                    <AvatarFallback className="bg-purple-300">{partnerPlayer?.[0] || "P"}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm">{partnerPlayer}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {players
                  .filter((p) => p !== activePlayer)
                  .map((player) => (
                    <Button
                      key={player}
                      variant="outline"
                      className="border-purple-300 hover:bg-purple-100"
                      onClick={() => selectPartner(player)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {player}
                    </Button>
                  ))}
              </div>
            )}
          </div>
        )}

        {type === "grupal" && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="font-medium mb-2">Todos participan:</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
              {players.map((player) => (
                <div key={player} className="bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar>
                      <AvatarFallback className="bg-blue-300">{player[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{player}</span>
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
          disabled={type === "dueto" && !partnerPlayer}
        >
          Iniciar votación
        </Button>
      </CardFooter>
    </Card>
  )
}

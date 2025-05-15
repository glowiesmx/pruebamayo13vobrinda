"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Trophy, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

interface Player {
  id: string
  name: string
  avatar?: string
}

interface VotingSystemProps {
  cardType: "individual" | "dueto" | "grupal"
  players: Player[]
  activePlayer?: string
  partnerPlayer?: string
  onComplete: (scores: Record<string, number>) => void
  mesaId: string
  currentUserId?: string
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function VotingSystem({
  cardType,
  players,
  activePlayer,
  partnerPlayer,
  onComplete,
  mesaId,
  currentUserId,
}: VotingSystemProps) {
  const [votes, setVotes] = useState<Record<string, { up: number; down: number }>>({})
  const [hasVoted, setHasVoted] = useState<Record<string, boolean>>({})
  const [timeLeft, setTimeLeft] = useState(30) // 30 segundos para votar
  const [votingComplete, setVotingComplete] = useState(false)
  const { toast } = useToast()

  // Inicializar votos
  useEffect(() => {
    const initialVotes: Record<string, { up: number; down: number }> = {}
    players.forEach((player) => {
      initialVotes[player.id] = { up: 0, down: 0 }
    })
    setVotes(initialVotes)

    // Inicializar estado de votación
    const initialHasVoted: Record<string, boolean> = {}
    players.forEach((player) => {
      initialHasVoted[player.id] = false
    })
    setHasVoted(initialHasVoted)
  }, [players])

  // Temporizador para la votación
  useEffect(() => {
    if (timeLeft > 0 && !votingComplete) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && !votingComplete) {
      finishVoting()
    }
  }, [timeLeft, votingComplete])

  // Suscribirse a cambios en tiempo real
  useEffect(() => {
    // En una implementación real, aquí se suscribiría a cambios en Supabase
    const channel = supabase
      .channel(`voting-${mesaId}`)
      .on("broadcast", { event: "vote" }, (payload) => {
        if (payload.payload) {
          const { playerId, voteType } = payload.payload as { playerId: string; voteType: "up" | "down" }
          handleVoteUpdate(playerId, voteType)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mesaId])

  const handleVoteUpdate = (playerId: string, voteType: "up" | "down") => {
    setVotes((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [voteType]: prev[playerId][voteType] + 1,
      },
    }))
  }

  const castVote = async (playerId: string, voteType: "up" | "down") => {
    // No permitir votar por uno mismo
    if (playerId === currentUserId) {
      toast({
        title: "No puedes votarte a ti mismo",
        description: "Vota por otros jugadores",
        variant: "destructive",
      })
      return
    }

    // Evitar votar más de una vez por el mismo jugador
    if (hasVoted[playerId]) {
      toast({
        title: "Ya has votado",
        description: "Solo puedes votar una vez por cada jugador",
        variant: "destructive",
      })
      return
    }

    // Actualizar votos localmente
    setVotes((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [voteType]: prev[playerId][voteType] + 1,
      },
    }))

    // Marcar como votado
    setHasVoted((prev) => ({
      ...prev,
      [playerId]: true,
    }))

    // Enviar el voto a la API
    try {
      await fetch("/api/votaciones", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mesaId,
          respuestaId: 1, // Esto debería ser el ID real de la respuesta
          usuarioId: currentUserId,
          voto: voteType === "up" ? 1 : -1,
        }),
      })
    } catch (error) {
      console.error("Error al enviar voto:", error)
    }

    // En una implementación real, enviar el voto a Supabase
    try {
      await supabase.channel(`voting-${mesaId}`).send({
        type: "broadcast",
        event: "vote",
        payload: { playerId, voteType },
      })
    } catch (error) {
      console.error("Error al enviar voto:", error)
    }

    // Verificar si todos han votado
    const allVoted = Object.values(hasVoted).every((voted) => voted)
    if (allVoted) {
      finishVoting()
    }
  }

  const finishVoting = () => {
    setVotingComplete(true)

    // Calcular puntuaciones finales
    const finalScores: Record<string, number> = {}
    Object.entries(votes).forEach(([playerId, playerVotes]) => {
      finalScores[playerId] = playerVotes.up - playerVotes.down
    })

    // Guardar resultados en Supabase (simulado)
    try {
      supabase.from("votaciones").insert({
        mesa_id: mesaId,
        resultados: finalScores,
        tipo_carta: cardType,
      })
    } catch (error) {
      console.error("Error al guardar resultados:", error)
    }

    // Notificar al componente padre
    onComplete(finalScores)
  }

  const getPlayerById = (id: string) => {
    return players.find((p) => p.id === id) || { id, name: "Jugador" }
  }

  const getWinner = () => {
    if (!votingComplete) return null

    const finalScores: Record<string, number> = {}
    Object.entries(votes).forEach(([playerId, playerVotes]) => {
      finalScores[playerId] = playerVotes.up - playerVotes.down
    })

    let winnerId = Object.keys(finalScores)[0]
    let maxScore = finalScores[winnerId]

    Object.entries(finalScores).forEach(([playerId, score]) => {
      if (score > maxScore) {
        maxScore = score
        winnerId = playerId
      }
    })

    return getPlayerById(winnerId)
  }

  const renderVotingSection = () => {
    switch (cardType) {
      case "individual":
        return (
          <div className="space-y-4">
            <div className="bg-pink-50 p-4 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Avatar>
                  <AvatarFallback className="bg-pink-300">{getPlayerById(activePlayer || "").name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{getPlayerById(activePlayer || "").name}</p>
                  <p className="text-xs text-gray-500">Jugador activo</p>
                </div>
              </div>

              {!votingComplete ? (
                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="border-green-300 hover:bg-green-100"
                    onClick={() => castVote(activePlayer || "", "up")}
                    disabled={hasVoted[activePlayer || ""] || activePlayer === currentUserId}
                  >
                    <ThumbsUp className="mr-2 h-4 w-4 text-green-600" />
                    Me gusta ({votes[activePlayer || ""]?.up || 0})
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 hover:bg-red-100"
                    onClick={() => castVote(activePlayer || "", "down")}
                    disabled={hasVoted[activePlayer || ""] || activePlayer === currentUserId}
                  >
                    <ThumbsDown className="mr-2 h-4 w-4 text-red-600" />
                    No me gusta ({votes[activePlayer || ""]?.down || 0})
                  </Button>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg shadow-sm mt-3">
                  <p className="font-medium text-center mb-2">Puntuación final:</p>
                  <p className="text-2xl font-bold text-center text-pink-600">
                    {(votes[activePlayer || ""]?.up || 0) - (votes[activePlayer || ""]?.down || 0)} puntos
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case "dueto":
        return (
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-center items-center gap-6 mb-4">
                <div className="text-center">
                  <Avatar className="mx-auto mb-2">
                    <AvatarFallback className="bg-pink-300">{getPlayerById(activePlayer || "").name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{getPlayerById(activePlayer || "").name}</p>
                </div>
                <span className="text-2xl">+</span>
                <div className="text-center">
                  <Avatar className="mx-auto mb-2">
                    <AvatarFallback className="bg-purple-300">
                      {getPlayerById(partnerPlayer || "").name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-sm font-medium">{getPlayerById(partnerPlayer || "").name}</p>
                </div>
              </div>

              {!votingComplete ? (
                <div className="flex justify-center gap-3 mt-4">
                  <Button
                    variant="outline"
                    className="border-green-300 hover:bg-green-100"
                    onClick={() => {
                      castVote(activePlayer || "", "up")
                      castVote(partnerPlayer || "", "up")
                    }}
                    disabled={
                      hasVoted[activePlayer || ""] ||
                      hasVoted[partnerPlayer || ""] ||
                      activePlayer === currentUserId ||
                      partnerPlayer === currentUserId
                    }
                  >
                    <ThumbsUp className="mr-2 h-4 w-4 text-green-600" />
                    Buen dueto
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 hover:bg-red-100"
                    onClick={() => {
                      castVote(activePlayer || "", "down")
                      castVote(partnerPlayer || "", "down")
                    }}
                    disabled={
                      hasVoted[activePlayer || ""] ||
                      hasVoted[partnerPlayer || ""] ||
                      activePlayer === currentUserId ||
                      partnerPlayer === currentUserId
                    }
                  >
                    <ThumbsDown className="mr-2 h-4 w-4 text-red-600" />
                    Mal dueto
                  </Button>
                </div>
              ) : (
                <div className="bg-white p-3 rounded-lg shadow-sm mt-3">
                  <p className="font-medium text-center mb-2">Puntuación final del dueto:</p>
                  <p className="text-2xl font-bold text-center text-purple-600">
                    {(votes[activePlayer || ""]?.up || 0) -
                      (votes[activePlayer || ""]?.down || 0) +
                      (votes[partnerPlayer || ""]?.up || 0) -
                      (votes[partnerPlayer || ""]?.down || 0)}{" "}
                    puntos
                  </p>
                </div>
              )}
            </div>
          </div>
        )

      case "grupal":
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {players.map((player) => (
                  <div key={player.id} className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar>
                        <AvatarFallback className="bg-blue-300">{player.name[0]}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium truncate">{player.name}</p>
                    </div>

                    {!votingComplete ? (
                      <div className="flex justify-center gap-2 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-300 hover:bg-green-100 h-8 w-8 p-0"
                          onClick={() => castVote(player.id, "up")}
                          disabled={hasVoted[player.id] || player.id === currentUserId}
                        >
                          <ThumbsUp className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 hover:bg-red-100 h-8 w-8 p-0"
                          onClick={() => castVote(player.id, "down")}
                          disabled={hasVoted[player.id] || player.id === currentUserId}
                        >
                          <ThumbsDown className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center mt-2">
                        <p className="font-medium">{(votes[player.id]?.up || 0) - (votes[player.id]?.down || 0)} pts</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {votingComplete && (
                <div className="mt-4 bg-white p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">Ganador:</p>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      <Trophy className="h-3 w-3 mr-1" /> Ganador
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-yellow-300">{getWinner()?.name[0] || "W"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getWinner()?.name}</p>
                      <p className="text-sm text-gray-500">
                        {(votes[getWinner()?.id || ""]?.up || 0) - (votes[getWinner()?.id || ""]?.down || 0)} puntos
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Card className="w-full border-dashed border-pink-400 border-2 bg-white/90">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl sm:text-2xl flex items-center">
            {cardType === "individual" ? (
              <span className="flex items-center">Votación Individual</span>
            ) : cardType === "dueto" ? (
              <span className="flex items-center">Votación en Dueto</span>
            ) : (
              <span className="flex items-center">Votación Grupal</span>
            )}
          </CardTitle>
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            <Users className="h-3 w-3 mr-1" /> {players.length} jugadores
          </Badge>
        </div>
        <CardDescription>
          {!votingComplete ? `Tiempo restante para votar: ${timeLeft} segundos` : "¡Votación finalizada! Resultados:"}
        </CardDescription>
        {!votingComplete && <Progress value={(timeLeft / 30) * 100} className="h-2" />}
      </CardHeader>
      <CardContent>{renderVotingSection()}</CardContent>
      <CardFooter className="flex justify-center">
        {!votingComplete ? (
          <Button
            onClick={finishVoting}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
          >
            Finalizar votación
          </Button>
        ) : (
          <Button variant="outline" onClick={() => onComplete({})} className="border-pink-300 hover:bg-pink-100">
            Continuar
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

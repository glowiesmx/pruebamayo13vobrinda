"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

interface RespuestasJugadoresProps {
  mesaId: string
  cartaId?: number
  onVote: (respuestaId: number, voto: number) => void
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function RespuestasJugadores({ mesaId, cartaId, onVote }: RespuestasJugadoresProps) {
  const [respuestas, setRespuestas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [votando, setVotando] = useState<Record<number, boolean>>({})
  const [votosRealizados, setVotosRealizados] = useState<Record<number, number>>({})
  const { toast } = useToast()
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null

  useEffect(() => {
    if (!mesaId) return

    const fetchRespuestas = async () => {
      try {
        setLoading(true)

        // Modificamos la consulta para evitar el error de relación
        const { data: respuestasData, error: respuestasError } = await supabase
          .from("respuestas")
          .select("*")
          .eq("mesa_id", mesaId)
          .order("created_at", { ascending: false })

        if (respuestasError) throw respuestasError

        // Obtenemos la información de los usuarios por separado
        const usuariosIds = respuestasData.map((r) => r.usuario_id).filter(Boolean)

        let usuariosInfo: Record<string, any> = {}
        if (usuariosIds.length > 0) {
          const { data: usuariosData, error: usuariosError } = await supabase
            .from("usuarios")
            .select("id, nombre, avatar")
            .in("id", usuariosIds)

          if (usuariosError) throw usuariosError

          // Crear un mapa de usuarios por ID
          usuariosInfo = usuariosData.reduce((acc: Record<string, any>, user: any) => {
            acc[user.id] = user
            return acc
          }, {})
        }

        // Obtener los votos para cada respuesta
        if (respuestasData && respuestasData.length > 0) {
          const respuestasIds = respuestasData.map((r) => r.id)
          const { data: votosData, error: votosError } = await supabase
            .from("votaciones_respuestas")
            .select("*")
            .in("respuesta_id", respuestasIds)

          if (votosError) throw votosError

          // Agrupar votos por respuesta
          const votosPorRespuesta: Record<number, { positivos: number; negativos: number }> = {}
          votosData?.forEach((voto) => {
            if (!votosPorRespuesta[voto.respuesta_id]) {
              votosPorRespuesta[voto.respuesta_id] = { positivos: 0, negativos: 0 }
            }
            if (voto.voto > 0) {
              votosPorRespuesta[voto.respuesta_id].positivos += 1
            } else {
              votosPorRespuesta[voto.respuesta_id].negativos += 1
            }

            // Guardar los votos realizados por el usuario actual
            if (voto.usuario_id === userId) {
              setVotosRealizados((prev) => ({
                ...prev,
                [voto.respuesta_id]: voto.voto,
              }))
            }
          })

          // Añadir información de usuarios y votos a las respuestas
          const respuestasCompletas = respuestasData.map((respuesta) => ({
            ...respuesta,
            usuario: usuariosInfo[respuesta.usuario_id] || { nombre: "Usuario", avatar: null },
            votos: votosPorRespuesta[respuesta.id] || { positivos: 0, negativos: 0 },
          }))

          setRespuestas(respuestasCompletas)
        } else {
          setRespuestas([])
        }
      } catch (error) {
        console.error("Error al obtener respuestas:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar las respuestas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchRespuestas()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`respuestas-${mesaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "respuestas", filter: `mesa_id=eq.${mesaId}` },
        () => fetchRespuestas(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votaciones_respuestas", filter: `mesa_id=eq.${mesaId}` },
        () => fetchRespuestas(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mesaId, toast, userId])

  const handleVote = async (respuestaId: number, voto: number) => {
    if (votando[respuestaId]) return

    // No permitir votar por uno mismo
    const respuesta = respuestas.find((r) => r.id === respuestaId)
    if (respuesta?.usuario_id === userId) {
      toast({
        title: "No puedes votarte a ti mismo",
        description: "Vota por las respuestas de otros jugadores",
        variant: "destructive",
      })
      return
    }

    // No permitir cambiar el voto
    if (votosRealizados[respuestaId]) {
      toast({
        title: "Ya has votado esta respuesta",
        description: "Solo puedes votar una vez por cada respuesta",
        variant: "destructive",
      })
      return
    }

    setVotando((prev) => ({ ...prev, [respuestaId]: true }))

    try {
      // Llamar a la función onVote para manejar la lógica de votación
      await onVote(respuestaId, voto)

      // Actualizar el estado local
      setVotosRealizados((prev) => ({
        ...prev,
        [respuestaId]: voto,
      }))

      toast({
        title: "Voto registrado",
        description: voto > 0 ? "Has votado positivamente" : "Has votado negativamente",
      })
    } catch (error) {
      console.error("Error al votar:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar tu voto",
        variant: "destructive",
      })
    } finally {
      setVotando((prev) => ({ ...prev, [respuestaId]: false }))
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <p className="ml-2">Cargando respuestas...</p>
        </CardContent>
      </Card>
    )
  }

  if (respuestas.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">No hay respuestas disponibles para esta mesa</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Respuestas de los jugadores</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {respuestas.map((respuesta) => (
          <Card key={respuesta.id} className="overflow-hidden">
            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-3">
              <div className="flex items-center gap-2">
                <Avatar>
                  <AvatarFallback className="bg-pink-300">{respuesta.usuario?.nombre?.[0] || "?"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{respuesta.usuario?.nombre || "Jugador"}</p>
                  <p className="text-xs text-gray-500">{new Date(respuesta.created_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="mb-3">{respuesta.contenido}</p>

              {respuesta.audio_url && (
                <div className="mb-3 bg-gray-50 p-2 rounded">
                  <audio controls src={respuesta.audio_url} className="w-full h-8" />
                </div>
              )}

              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-1 ${votosRealizados[respuesta.id] === 1 ? "bg-green-100 border-green-300" : ""}`}
                    onClick={() => handleVote(respuesta.id, 1)}
                    disabled={
                      votando[respuesta.id] ||
                      respuesta.usuario_id === userId ||
                      votosRealizados[respuesta.id] !== undefined
                    }
                  >
                    <ThumbsUp className="h-4 w-4 text-green-600" />
                    <span>{respuesta.votos?.positivos || 0}</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex items-center gap-1 ${votosRealizados[respuesta.id] === -1 ? "bg-red-100 border-red-300" : ""}`}
                    onClick={() => handleVote(respuesta.id, -1)}
                    disabled={
                      votando[respuesta.id] ||
                      respuesta.usuario_id === userId ||
                      votosRealizados[respuesta.id] !== undefined
                    }
                  >
                    <ThumbsDown className="h-4 w-4 text-red-600" />
                    <span>{respuesta.votos?.negativos || 0}</span>
                  </Button>
                </div>

                <div className="text-sm text-gray-500">
                  Puntuación: {(respuesta.votos?.positivos || 0) - (respuesta.votos?.negativos || 0)}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}

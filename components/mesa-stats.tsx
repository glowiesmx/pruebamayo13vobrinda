"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@supabase/supabase-js"
import { Users, Trophy, Clock } from "lucide-react"

interface MesaStatsProps {
  mesaId: string
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function MesaStats({ mesaId }: MesaStatsProps) {
  const [jugadores, setJugadores] = useState<any[]>([])
  const [respuestas, setRespuestas] = useState<number>(0)
  const [tiempoActivo, setTiempoActivo] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    if (!mesaId) return

    const fetchMesaStats = async () => {
      try {
        // Obtener jugadores
        const { data: jugadoresData, error: jugadoresError } = await supabase
          .from("jugadores_mesa")
          .select("*")
          .eq("mesa_id", mesaId)

        if (jugadoresError) throw jugadoresError
        setJugadores(jugadoresData || [])

        // Obtener respuestas
        const { count, error: respuestasError } = await supabase
          .from("respuestas")
          .select("*", { count: "exact", head: true })
          .eq("mesa_id", mesaId)

        if (respuestasError) throw respuestasError
        setRespuestas(count || 0)

        // Obtener tiempo activo
        const { data: mesaData, error: mesaError } = await supabase
          .from("mesas_juego")
          .select("created_at")
          .eq("id", mesaId)
          .single()

        if (mesaError) throw mesaError

        if (mesaData?.created_at) {
          const createdAt = new Date(mesaData.created_at)
          const now = new Date()
          const diffMs = now.getTime() - createdAt.getTime()
          const diffMins = Math.round(diffMs / 60000)

          if (diffMins < 60) {
            setTiempoActivo(`${diffMins} minutos`)
          } else {
            const hours = Math.floor(diffMins / 60)
            const mins = diffMins % 60
            setTiempoActivo(`${hours} h ${mins} min`)
          }
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMesaStats()

    // Suscribirse a cambios en tiempo real
    const channel = supabase
      .channel(`mesa-stats-${mesaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jugadores_mesa", filter: `mesa_id=eq.${mesaId}` },
        () => {
          fetchMesaStats()
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "respuestas", filter: `mesa_id=eq.${mesaId}` },
        () => {
          fetchMesaStats()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mesaId])

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <p className="text-center text-sm text-gray-500">Cargando estadísticas...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Estadísticas de la mesa</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
          <Users className="h-5 w-5 text-blue-500 mb-1" />
          <span className="text-xl font-bold">{jugadores.length}</span>
          <span className="text-xs text-gray-500">Jugadores</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
          <Trophy className="h-5 w-5 text-green-500 mb-1" />
          <span className="text-xl font-bold">{respuestas}</span>
          <span className="text-xs text-gray-500">Respuestas</span>
        </div>
        <div className="flex flex-col items-center p-2 bg-purple-50 rounded-lg">
          <Clock className="h-5 w-5 text-purple-500 mb-1" />
          <span className="text-xl font-bold">{tiempoActivo || "0 min"}</span>
          <span className="text-xs text-gray-500">Activo</span>
        </div>
      </CardContent>
    </Card>
  )
}

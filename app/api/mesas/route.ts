import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { nombre, userId, userName } = body

    if (!userId) {
      return NextResponse.json({ error: "Se requiere ID de usuario" }, { status: 400 })
    }

    // Generar ID único para la mesa
    const mesaId = `mesa-${Math.floor(Math.random() * 10000)}`

    // Crear la mesa
    const { data: mesa, error: mesaError } = await supabase
      .from("mesas_juego")
      .insert({
        id: mesaId,
        nombre: nombre || `Mesa de ${userName || "Jugador"}`,
        jugador_activo: userId,
      })
      .select()

    if (mesaError) throw mesaError

    // Agregar al creador como primer jugador
    const { error: jugadorError } = await supabase.from("jugadores_mesa").insert({
      mesa_id: mesaId,
      usuario_id: userId,
      nombre: userName || "Jugador",
      avatar: `/placeholder.svg?height=40&width=40&text=${(userName || "J")[0].toUpperCase()}`,
    })

    if (jugadorError) throw jugadorError

    return NextResponse.json({
      success: true,
      mesaId,
      message: "Mesa creada exitosamente",
    })
  } catch (error) {
    console.error("Error al crear mesa:", error)
    return NextResponse.json(
      {
        error: "Error al crear mesa de juego",
        details: error,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get("id")

    if (!mesaId) {
      return NextResponse.json({ error: "Se requiere ID de mesa" }, { status: 400 })
    }

    // Obtener información de la mesa
    const { data: mesa, error: mesaError } = await supabase.from("mesas_juego").select("*").eq("id", mesaId).single()

    if (mesaError) throw mesaError

    // Obtener jugadores de la mesa
    const { data: jugadores, error: jugadoresError } = await supabase
      .from("jugadores_mesa")
      .select("*")
      .eq("mesa_id", mesaId)

    if (jugadoresError) throw jugadoresError

    return NextResponse.json({
      success: true,
      mesa,
      jugadores,
    })
  } catch (error) {
    console.error("Error al obtener información de la mesa:", error)
    return NextResponse.json(
      {
        error: "Error al obtener información de la mesa",
        details: error,
      },
      { status: 500 },
    )
  }
}

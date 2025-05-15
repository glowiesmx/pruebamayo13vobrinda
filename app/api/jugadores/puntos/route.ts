import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mesaId, usuarioId, puntos } = body

    if (!mesaId || !usuarioId || puntos === undefined) {
      return NextResponse.json({ error: "Se requieren todos los campos: mesaId, usuarioId, puntos" }, { status: 400 })
    }

    // Obtener los puntos actuales del jugador
    const { data: jugador, error: jugadorError } = await supabase
      .from("jugadores_mesa")
      .select("puntos")
      .eq("mesa_id", mesaId)
      .eq("usuario_id", usuarioId)
      .single()

    if (jugadorError) {
      throw jugadorError
    }

    // Calcular los nuevos puntos
    const puntosActuales = jugador?.puntos || 0
    const nuevosPuntos = puntosActuales + puntos

    // Actualizar los puntos del jugador
    const { data, error } = await supabase
      .from("jugadores_mesa")
      .update({ puntos: nuevosPuntos })
      .eq("mesa_id", mesaId)
      .eq("usuario_id", usuarioId)
      .select()

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: `Puntos actualizados correctamente`,
      data,
      puntosAnteriores: puntosActuales,
      puntosNuevos: nuevosPuntos,
    })
  } catch (error) {
    console.error("Error al actualizar puntos:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar puntos",
        details: error,
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const mesaId = searchParams.get("mesaId")
    const usuarioId = searchParams.get("usuarioId")

    if (!mesaId) {
      return NextResponse.json({ error: "Se requiere mesaId" }, { status: 400 })
    }

    let query = supabase
      .from("jugadores_mesa")
      .select("usuario_id, nombre, puntos, avatar")
      .eq("mesa_id", mesaId)
      .order("puntos", { ascending: false })

    if (usuarioId) {
      query = query.eq("usuario_id", usuarioId)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error al obtener puntos:", error)
    return NextResponse.json(
      {
        error: "Error al obtener puntos",
        details: error,
      },
      { status: 500 },
    )
  }
}

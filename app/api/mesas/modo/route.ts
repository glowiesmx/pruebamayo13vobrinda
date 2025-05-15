import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mesaId, modo, jugadorActivo, jugadorPareja, cartaId } = body

    if (!mesaId || !modo) {
      return NextResponse.json({ error: "Se requiere ID de mesa y modo de juego" }, { status: 400 })
    }

    // Actualizar modo de juego de la mesa
    const { data, error } = await supabase
      .from("mesas_juego")
      .update({
        modo_actual: modo,
        jugador_activo: jugadorActivo || null,
        jugador_pareja: jugadorPareja || null,
        carta_actual: cartaId || null,
      })
      .eq("id", mesaId)
      .select()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Modo de juego actualizado a ${modo}`,
      data,
    })
  } catch (error) {
    console.error("Error al actualizar modo de juego:", error)
    return NextResponse.json(
      {
        error: "Error al actualizar modo de juego",
        details: error,
      },
      { status: 500 },
    )
  }
}

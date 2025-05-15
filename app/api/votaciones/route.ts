import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { mesaId, respuestaId, usuarioId, voto } = body

    if (!mesaId || !respuestaId || !usuarioId || voto === undefined) {
      return NextResponse.json(
        { error: "Se requieren todos los campos: mesaId, respuestaId, usuarioId, voto" },
        { status: 400 },
      )
    }

    // Verificar si el usuario ya votó esta respuesta
    const { data: existingVote, error: checkError } = await supabase
      .from("votaciones_respuestas")
      .select("*")
      .eq("respuesta_id", respuestaId)
      .eq("usuario_id", usuarioId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 es el código para "no se encontraron resultados"
      throw checkError
    }

    let result

    if (existingVote) {
      // Actualizar voto existente
      const { data, error } = await supabase
        .from("votaciones_respuestas")
        .update({ voto })
        .eq("id", existingVote.id)
        .select()

      if (error) throw error
      result = data
    } else {
      // Crear nuevo voto
      const { data, error } = await supabase
        .from("votaciones_respuestas")
        .insert({
          mesa_id: mesaId,
          respuesta_id: respuestaId,
          usuario_id: usuarioId,
          voto,
        })
        .select()

      if (error) throw error
      result = data
    }

    // Calcular puntuación total para esta respuesta
    const { data: votesData, error: votesError } = await supabase
      .from("votaciones_respuestas")
      .select("voto")
      .eq("respuesta_id", respuestaId)

    if (votesError) throw votesError

    const totalScore = votesData.reduce((sum, vote) => sum + vote.voto, 0)

    return NextResponse.json({
      success: true,
      message: "Voto registrado correctamente",
      data: result,
      totalScore,
    })
  } catch (error) {
    console.error("Error al registrar voto:", error)
    return NextResponse.json(
      {
        error: "Error al registrar voto",
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
    const respuestaId = searchParams.get("respuestaId")

    if (!mesaId && !respuestaId) {
      return NextResponse.json({ error: "Se requiere mesaId o respuestaId" }, { status: 400 })
    }

    let query = supabase.from("votaciones_respuestas").select("*")

    if (mesaId) {
      query = query.eq("mesa_id", mesaId)
    }

    if (respuestaId) {
      query = query.eq("respuesta_id", respuestaId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error al obtener votaciones:", error)
    return NextResponse.json(
      {
        error: "Error al obtener votaciones",
        details: error,
      },
      { status: 500 },
    )
  }
}

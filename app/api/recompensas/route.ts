import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const cartaNombre = searchParams.get("carta")
    const genero = searchParams.get("genero")
    const tipo = searchParams.get("tipo") || "playlist"

    let query = supabase.from("recompensas_personalizadas").select("*").eq("tipo", tipo)

    if (cartaNombre) {
      query = query.eq("contexto_carta", cartaNombre)
    }

    if (genero) {
      query = query.eq("genero_tag", genero)
    }

    const { data, error } = await query

    if (error) throw error

    // Si no hay recompensas específicas, obtener cualquier recompensa del mismo tipo
    if (!data || data.length === 0) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("recompensas_personalizadas")
        .select("*")
        .eq("tipo", tipo)
        .limit(5)

      if (fallbackError) throw fallbackError

      return NextResponse.json({
        success: true,
        data: fallbackData,
        message: "Recompensas genéricas obtenidas",
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Error al obtener recompensas:", error)
    return NextResponse.json(
      {
        error: "Error al obtener recompensas",
        details: error,
      },
      { status: 500 },
    )
  }
}

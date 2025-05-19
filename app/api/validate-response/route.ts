import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { analizarRespuesta, guardarAnalisis } from "@/lib/analisis-service"
import { obtenerRecompensasPersonalizadas } from "@/lib/recompensas-service"

// Asegurar que este código solo se ejecuta en el servidor
export const runtime = "nodejs"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Intentar parsear el cuerpo de la solicitud
    let respuesta, audioUrl, carta, usuarioId, mesaId, respuestaId
    try {
      const body = await request.json()
      respuesta = body.respuesta || ""
      audioUrl = body.audioUrl || ""
      carta = body.carta || {}
      usuarioId = body.usuarioId || ""
      mesaId = body.mesaId || ""
      respuestaId = body.respuestaId || null
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({
        resultado: generarResultadoPredeterminado(),
        recompensas: generarRecompensasAleatorias(),
      })
    }

    try {
      // Asegurarse de que los valores existen
      const nombreCarta = carta && carta.nombre ? carta.nombre : "carta del juego"
      const descripcionCarta = carta && carta.descripcion ? carta.descripcion : "un desafío"
      const respuestaUsuario = respuesta || "respuesta del usuario"

      // 1. Analizar la respuesta con nuestro nuevo servicio
      const analisis = await analizarRespuesta(respuestaUsuario, audioUrl, nombreCarta, descripcionCarta)

      // 2. Guardar el análisis en la base de datos
      if (usuarioId && mesaId) {
        await guardarAnalisis(
          analisis,
          respuestaId,
          usuarioId,
          mesaId,
          respuestaUsuario,
          audioUrl,
          nombreCarta,
          descripcionCarta,
        )
      }

      // 3. Generar feedback personalizado basado en el análisis
      const feedback = analisis.analisis_completo.feedback || generarResultadoPredeterminado()

      // 4. Obtener recompensas personalizadas basadas en el análisis
      const recompensas = await obtenerRecompensasPersonalizadas(analisis, nombreCarta)

      // 5. Devolver el resultado
      return NextResponse.json({
        resultado: feedback,
        recompensas,
        analisis: {
          creatividad: analisis.puntuacion_creatividad,
          humor: analisis.puntuacion_humor,
          autenticidad: analisis.puntuacion_autenticidad,
          viral: analisis.puntuacion_viral,
          categoria: analisis.analisis_completo.categoria_principal || "Humor",
        },
      })
    } catch (openaiError) {
      console.error("Error calling OpenAI:", openaiError)
      return NextResponse.json({
        resultado: generarResultadoPredeterminado(),
        recompensas: generarRecompensasAleatorias(),
      })
    }
  } catch (error) {
    console.error("Error validating response:", error)
    // Asegurarse de devolver una respuesta válida incluso en caso de error
    return NextResponse.json({
      resultado: generarResultadoPredeterminado(),
      recompensas: generarRecompensasAleatorias(),
    })
  }
}

function generarResultadoPredeterminado() {
  const resultados = [
    "¡Eso fue tan delulu que hasta Taylor Swift te daría un like! 💅 Mereces un PDF de 'Cómo fingir viajes en Instagram'.",
    "Ese nivel de drama solo lo veo en mis historias destacadas 📱 Te ganaste la playlist 'Canciones para llorar en el Oxxo'.",
    "Main character energy al 100% 🌟 Esto merece un filtro de 'Golden Hour Falso' para tus próximas stories.",
    "Esa respuesta es más tóxica que mi ex. Necesito ese nivel de caos en mi feed 🔥 Te mereces un curso de 'Red Flags 101'.",
    "Vibes inmaculadas, bestie. Esto es más aesthetic que mis fotos editadas con 27 filtros 💫 Mereces un preset exclusivo.",
  ]

  return resultados[Math.floor(Math.random() * resultados.length)]
}

function generarRecompensasAleatorias() {
  const playlists = [
    "Canciones para llorar en el Oxxo mientras stalkeas a tu ex",
    "Éxitos para fingir que superaste tu tusa",
    "Lo que escuchas cuando te ghostean por 5ta vez",
    "Soundtrack para tu era villain después de un situationship",
    "Canciones para fingir que estás en Tulum pero estás en tu cuarto",
  ]

  const filtros = [
    "Golden Hour Falso para tus stories de peda casera",
    "Filtro 'Soy un catch pero estoy traumado/a'",
    "Aesthetic Oxxo: Haz que cualquier tienda parezca Tulum",
    "Filtro 'Me ghostearon pero estoy mejor que nunca'",
    "Preset 'Soft Launch de relación que durará 2 semanas'",
  ]

  const pdfs = [
    "Cómo fingir viajes en el Oxxo: Guía para millennials quebrados",
    "10 captions para fotos de perfil que gritan 'Soy un catch pero estoy traumado/a'",
    "Guía de Ghosteo Épico: Técnicas avanzadas",
    "Manual del Situationship: Cómo estar en una relación sin compromiso",
    "Diccionario Gen Z: Para que no te digan Cheugy en 2023",
  ]

  return [
    {
      tipo: "playlist",
      nombre: "Playlist Spotify",
      descripcion: playlists[Math.floor(Math.random() * playlists.length)],
    },
    {
      tipo: "filtro",
      nombre: "Filtro Instagram",
      descripcion: filtros[Math.floor(Math.random() * filtros.length)],
    },
    {
      tipo: "pdf",
      nombre: "PDF Exclusivo",
      descripcion: pdfs[Math.floor(Math.random() * pdfs.length)],
    },
  ]
}

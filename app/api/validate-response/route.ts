import { NextResponse } from "next/server"
import OpenAI from "openai"
import { createClient } from "@supabase/supabase-js"

// NO inicializar OpenAI aquí, sino dentro de la función

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function POST(request: Request) {
  try {
    // Intentar parsear el cuerpo de la solicitud
    let respuesta, audioUrl, carta
    try {
      const body = await request.json()
      respuesta = body.respuesta
      audioUrl = body.audioUrl
      carta = body.carta
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({
        resultado: generarResultadoPredeterminado(),
        recompensas: generarRecompensasAleatorias(),
      })
    }

    // Si no hay API key de OpenAI, devolver un resultado predeterminado
    if (!process.env.OPENAI_KEY) {
      console.log("OpenAI API key no configurada, usando resultado predeterminado")
      return NextResponse.json({
        resultado: generarResultadoPredeterminado(),
        recompensas: generarRecompensasAleatorias(),
      })
    }

    // Inicializar OpenAI con la API key DENTRO de la función del servidor
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
      // No necesitamos dangerouslyAllowBrowser aquí porque estamos en el servidor
    })

    const prompt = `
      Eres el ex más tóxico de Reddit. Evalúa esta respuesta: "${respuesta || "respuesta del usuario"}"
      - Da feedback en 2 líneas máximo con slang de Gen Z
      - Si aprueba, sugiere una recompensa ridícula (ej: "PDF de memes para stalkear")
      - Usa 1 emoji y 1 referencia a Instagram
      
      Contexto: La carta era "${carta?.nombre || "carta del juego"}" que trata sobre "${carta?.descripcion || "un desafío"}"
      ${audioUrl ? "El usuario también grabó un audio (no puedes escucharlo, pero asume que fue increíble)" : ""}
    `

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9,
      })

      // Generar recompensas aleatorias
      const recompensas = generarRecompensasAleatorias()

      // Intentar guardar las recompensas en la base de datos, pero no fallar si hay error
      try {
        for (const recompensa of recompensas) {
          await supabase.from("recompensas").insert({
            nombre: recompensa.nombre,
            descripcion: recompensa.descripcion,
            tipo: recompensa.tipo,
          })
        }
      } catch (dbError) {
        console.error("Error al guardar recompensas:", dbError)
        // Continuar incluso si hay error en la base de datos
      }

      return NextResponse.json({
        resultado: completion.choices[0].message.content,
        recompensas,
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
  ]

  return resultados[Math.floor(Math.random() * resultados.length)]
}

function generarRecompensasAleatorias() {
  const playlists = [
    "Canciones para llorar en el Oxxo mientras stalkeas a tu ex",
    "Éxitos para fingir que superaste tu tusa",
    "Lo que escuchas cuando te ghostean por 5ta vez",
  ]

  const filtros = [
    "Golden Hour Falso para tus stories de peda casera",
    "Filtro 'Soy un catch pero estoy traumado/a'",
    "Aesthetic Oxxo: Haz que cualquier tienda parezca Tulum",
  ]

  const pdfs = [
    "Cómo fingir viajes en el Oxxo: Guía para millennials quebrados",
    "10 captions para fotos de perfil que gritan 'Soy un catch pero estoy traumado/a'",
    "Guía de Ghosteo Épico: Técnicas avanzadas",
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

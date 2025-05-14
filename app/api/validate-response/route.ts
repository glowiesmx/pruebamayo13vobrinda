import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Asegurar que este código solo se ejecuta en el servidor
export const runtime = "nodejs"

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
      respuesta = body.respuesta || ""
      audioUrl = body.audioUrl || ""
      carta = body.carta || {}
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

    try {
      // Asegurarse de que los valores existen
      const nombreCarta = carta && carta.nombre ? carta.nombre : "carta del juego"
      const descripcionCarta = carta && carta.descripcion ? carta.descripcion : "un desafío"
      const respuestaUsuario = respuesta || "respuesta del usuario"

      const prompt = `
        Eres el ex más tóxico de Reddit. Evalúa esta respuesta: "${respuestaUsuario}"
        - Da feedback en 2 líneas máximo con slang de Gen Z
        - Si aprueba, sugiere una recompensa ridícula (ej: "PDF de memes para stalkear")
        - Usa 1 emoji y 1 referencia a Instagram
        
        Contexto: La carta era "${nombreCarta}" que trata sobre "${descripcionCarta}"
        ${audioUrl ? "El usuario también grabó un audio (no puedes escucharlo, pero asume que fue increíble)" : ""}
      `

      // Usar fetch directamente en lugar del cliente OpenAI
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error("Error en la respuesta de OpenAI:", response.status, errorData)
        throw new Error(`Error en la respuesta de OpenAI: ${response.status}`)
      }

      const data = await response.json()

      // Verificar que la respuesta tiene la estructura esperada
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Respuesta de OpenAI inválida o incompleta")
      }

      const resultado = data.choices[0].message.content || "Respuesta no generada"

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
        resultado: resultado,
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

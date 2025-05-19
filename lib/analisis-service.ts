import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface AnalisisRespuesta {
  puntuacion_creatividad: number
  puntuacion_humor: number
  puntuacion_autenticidad: number
  puntuacion_viral: number
  tono: string[]
  temas: string[]
  palabras_clave: string[]
  analisis_completo: any
}

export async function analizarRespuesta(
  respuesta: string,
  audioUrl: string,
  cartaNombre: string,
  cartaDescripcion: string,
): Promise<AnalisisRespuesta> {
  try {
    // Si no hay API key de OpenAI, devolver un análisis predeterminado
    if (!process.env.OPENAI_KEY) {
      console.log("OpenAI API key no configurada, usando análisis predeterminado")
      return generarAnalisisPredeterminado(respuesta, cartaNombre)
    }

    const prompt = `
      Analiza esta respuesta a un desafío de un juego de cartas Gen Z: "${respuesta}"
      
      Contexto: La carta era "${cartaNombre}" que trata sobre "${cartaDescripcion}"
      ${audioUrl ? "El usuario también grabó un audio (no puedes escucharlo, pero asume que fue increíble)" : ""}
      
      Proporciona un análisis detallado en formato JSON con los siguientes campos:
      - puntuacion_creatividad: número del 1 al 100
      - puntuacion_humor: número del 1 al 100
      - puntuacion_autenticidad: número del 1 al 100
      - puntuacion_viral: número del 1 al 100
      - tono: array de strings (ej: ["humor", "sarcasmo", "confesión"])
      - temas: array de strings (ej: ["relaciones", "trabajo", "familia"])
      - palabras_clave: array de strings con palabras clave extraídas
      - categoria_principal: una de estas categorías ["Humor", "Creatividad", "Drama", "Confesión", "Viral", "Delulu", "Cringe", "Aesthetic"]
      - feedback: 2 líneas máximo con slang de Gen Z, incluye 1 emoji y 1 referencia a Instagram
      
      Devuelve SOLO el JSON, sin texto adicional.
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
        temperature: 0.7,
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

    const contenido = data.choices[0].message.content || "{}"

    // Intentar parsear el JSON
    let analisisJSON
    try {
      // Limpiar el contenido en caso de que OpenAI devuelva texto adicional
      const jsonString = contenido.replace(/```json|```/g, "").trim()
      analisisJSON = JSON.parse(jsonString)
    } catch (parseError) {
      console.error("Error al parsear JSON de OpenAI:", parseError, "Contenido:", contenido)
      return generarAnalisisPredeterminado(respuesta, cartaNombre)
    }

    // Construir el objeto de análisis
    const analisis: AnalisisRespuesta = {
      puntuacion_creatividad: analisisJSON.puntuacion_creatividad || Math.floor(Math.random() * 100),
      puntuacion_humor: analisisJSON.puntuacion_humor || Math.floor(Math.random() * 100),
      puntuacion_autenticidad: analisisJSON.puntuacion_autenticidad || Math.floor(Math.random() * 100),
      puntuacion_viral: analisisJSON.puntuacion_viral || Math.floor(Math.random() * 100),
      tono: analisisJSON.tono || ["casual", "divertido"],
      temas: analisisJSON.temas || ["general"],
      palabras_clave: analisisJSON.palabras_clave || [],
      analisis_completo: {
        ...analisisJSON,
        categoria_principal: analisisJSON.categoria_principal || "Humor",
        feedback: analisisJSON.feedback || generarFeedbackPredeterminado(),
      },
    }

    return analisis
  } catch (error) {
    console.error("Error al analizar respuesta:", error)
    return generarAnalisisPredeterminado(respuesta, cartaNombre)
  }
}

export async function guardarAnalisis(
  analisis: AnalisisRespuesta,
  respuestaId: number | null,
  usuarioId: string,
  mesaId: string,
  textoRespuesta: string,
  audioUrl: string,
  cartaNombre: string,
  cartaDescripcion: string,
) {
  try {
    if (!respuestaId) {
      console.log("No hay ID de respuesta, no se guardará el análisis")
      return null
    }

    const { data, error } = await supabase
      .from("analisis_respuestas")
      .insert({
        respuesta_id: respuestaId,
        usuario_id: usuarioId,
        mesa_id: mesaId,
        texto_respuesta: textoRespuesta,
        audio_url: audioUrl,
        carta_nombre: cartaNombre,
        carta_descripcion: cartaDescripcion,
        puntuacion_creatividad: analisis.puntuacion_creatividad,
        puntuacion_humor: analisis.puntuacion_humor,
        puntuacion_autenticidad: analisis.puntuacion_autenticidad,
        puntuacion_viral: analisis.puntuacion_viral,
        tono: analisis.tono,
        temas: analisis.temas,
        palabras_clave: analisis.palabras_clave,
        analisis_completo: analisis.analisis_completo,
      })
      .select()

    if (error) {
      console.error("Error al guardar análisis:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Error al guardar análisis:", error)
    return null
  }
}

function generarAnalisisPredeterminado(respuesta: string, cartaNombre: string): AnalisisRespuesta {
  // Generar puntuaciones aleatorias
  const creatividad = Math.floor(Math.random() * 100)
  const humor = Math.floor(Math.random() * 100)
  const autenticidad = Math.floor(Math.random() * 100)
  const viral = Math.floor(Math.random() * 100)

  // Determinar la categoría principal basada en la puntuación más alta
  const puntuaciones = [
    { nombre: "Creatividad", valor: creatividad },
    { nombre: "Humor", valor: humor },
    { nombre: "Confesión", valor: autenticidad },
    { nombre: "Viral", valor: viral },
  ]

  puntuaciones.sort((a, b) => b.valor - a.valor)
  const categoriaPrincipal = puntuaciones[0].nombre

  // Extraer algunas palabras clave del texto de la respuesta
  const palabrasClave = respuesta
    .split(/\s+/)
    .filter((palabra) => palabra.length > 4)
    .slice(0, 5)

  return {
    puntuacion_creatividad: creatividad,
    puntuacion_humor: humor,
    puntuacion_autenticidad: autenticidad,
    puntuacion_viral: viral,
    tono: ["casual", "divertido"],
    temas: [cartaNombre.toLowerCase(), "general"],
    palabras_clave: palabrasClave,
    analisis_completo: {
      categoria_principal: categoriaPrincipal,
      feedback: generarFeedbackPredeterminado(),
    },
  }
}

function generarFeedbackPredeterminado() {
  const feedbacks = [
    "¡Eso fue tan delulu que hasta Taylor Swift te daría un like! 💅 Mereces un PDF de 'Cómo fingir viajes en Instagram'.",
    "Ese nivel de drama solo lo veo en mis historias destacadas 📱 Te ganaste la playlist 'Canciones para llorar en el Oxxo'.",
    "Main character energy al 100% 🌟 Esto merece un filtro de 'Golden Hour Falso' para tus próximas stories.",
    "Esa respuesta es más tóxica que mi ex. Necesito ese nivel de caos en mi feed 🔥 Te mereces un curso de 'Red Flags 101'.",
    "Vibes inmaculadas, bestie. Esto es más aesthetic que mis fotos editadas con 27 filtros 💫 Mereces un preset exclusivo.",
  ]

  return feedbacks[Math.floor(Math.random() * feedbacks.length)]
}

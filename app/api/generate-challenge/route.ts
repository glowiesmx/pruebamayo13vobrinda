import { NextResponse } from "next/server"

// Asegurar que este código solo se ejecuta en el servidor
export const runtime = "nodejs"

export async function POST(request: Request) {
  try {
    // Intentar parsear el cuerpo de la solicitud
    let carta, userVibe
    try {
      const body = await request.json()
      carta = body.carta || {}
      userVibe = body.userVibe || "delulu"
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({
        desafio: "Confiesa algo vergonzoso que hiciste bajo los efectos del alcohol 🍸 #MomentoViral",
        source: "error",
      })
    }

    // Verificar si tenemos la API key de OpenAI
    if (!process.env.OPENAI_KEY) {
      console.log("OpenAI API key no configurada, usando desafío predeterminado")
      return NextResponse.json({
        desafio: generarDesafioPredeterminado(carta),
        source: "fallback",
      })
    }

    try {
      // Asegurarse de que carta.nombre existe
      const nombreCarta = carta && carta.nombre ? carta.nombre : "el jugador"
      const descripcionCarta = carta && carta.descripcion ? carta.descripcion : ""

      console.log("Generando desafío para carta:", nombreCarta)

      const prompt = `
        Eres un influencer tóxico de TikTok con 2M seguidores. Genera un reto para ${nombreCarta} que:
        - Use 1 slang de Gen Z (ej: "delulu", "ick", "no pick me")
        - Incluya 1 referencia a cultura pop (ej: "Taylor Swift", "Dua Lipa en la peda")
        - Tenga 1 emoji y 1 hashtag inventado
        - Ejemplo: "Confiesa tu ick más random (🚩) y gana un shot si usas #TraumaBonding"
        
        Vibe del usuario: ${userVibe}
        
        Descripción de la carta: ${descripcionCarta}
        
        IMPORTANTE: Genera un desafío único y creativo relacionado específicamente con el tema de la carta.
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

      const desafio = data.choices[0].message.content || "Desafío no generado"
      console.log("Desafío generado:", desafio)

      return NextResponse.json({
        desafio: desafio,
        source: "openai", // Indicar que viene de OpenAI
      })
    } catch (openaiError) {
      console.error("Error llamando a OpenAI:", openaiError)

      // Mostrar el error específico para depuración
      if (openaiError instanceof Error) {
        console.error("Mensaje de error:", openaiError.message)
        console.error("Stack trace:", openaiError.stack)
      }

      // Si hay error con OpenAI, usar un desafío predeterminado
      return NextResponse.json({
        desafio: generarDesafioPredeterminado(carta),
        error: openaiError instanceof Error ? openaiError.message : "Error desconocido",
        source: "fallback", // Indicar que es un fallback
      })
    }
  } catch (error) {
    console.error("Error general al generar desafío:", error)

    // Asegurarse de devolver una respuesta válida incluso en caso de error
    return NextResponse.json({
      desafio:
        "Confiesa tu teoría más delulu que has tenido después de tres shots de tequila 🍹 #DeluluEsMiPersonalidad",
      source: "error", // Indicar que es por error
    })
  }
}

// Función para generar un desafío predeterminado si no hay API key de OpenAI
function generarDesafioPredeterminado(carta: any) {
  // Asegurarse de que carta y carta.nombre existen
  if (!carta || !carta.nombre) {
    return "Confiesa algo vergonzoso que hiciste bajo los efectos del alcohol 🍸 #MomentoViral"
  }

  const desafios: Record<string, string> = {
    "El Delulu":
      "Confiesa tu teoría más delulu que has tenido después de tres shots de tequila 🍹 #DeluluEsMiPersonalidad",
    "El Ghosteador VIP":
      "Recrea el último mensaje que enviaste a las 3 AM y luego borraste. Bonus si mencionas a Bad Bunny 🐰 #GhosteadorProfesional",
    "El Storytoxic":
      "Crea una story fingiendo que estás en Tulum, pero es el Oxxo de tu colonia. Usa la frase 'living my best life' 🌴 #OxxoAesthetic",
    "El Add to Cart":
      "Confiesa la compra más random que hiciste ebrio/a en Amazon. Bonus si fue inspirada por TikTok 🛒 #ShoppingTherapy",
    "El Situationship":
      "Describe la red flag más grande que ignoraste por estar enamorado/a. Usa la frase 'pero tiene potencial' 🚩 #RedFlagParty",
    "El Soft Launch":
      "Crea el caption perfecto para anunciar una relación sin decir que estás en una relación 💫 #SoftLaunchEra",
    "El Rizz Master": "Comparte tu línea de ligue más cringe que increíblemente funcionó 😎 #UnrealRizz",
    "El Main Character":
      "Narra tu día como si fueras el protagonista de una serie de Netflix. Bonus si mencionas un soundtrack 🎬 #MainCharacterEnergy",
  }

  // Verificar si el nombre de la carta existe en el objeto desafios
  return desafios[carta.nombre] || "Confiesa algo vergonzoso que hiciste bajo los efectos del alcohol 🍸 #MomentoViral"
}

import { NextResponse } from "next/server"
import OpenAI from "openai"

// NO inicializar OpenAI aquí, sino dentro de la función

export async function POST(request: Request) {
  try {
    // Intentar parsear el cuerpo de la solicitud
    let carta, userVibe
    try {
      const body = await request.json()
      carta = body.carta
      userVibe = body.userVibe
    } catch (parseError) {
      console.error("Error parsing request body:", parseError)
      return NextResponse.json({
        desafio: "Confiesa algo vergonzoso que hiciste bajo los efectos del alcohol 🍸 #MomentoViral",
      })
    }

    // Verificar si tenemos la API key de OpenAI
    if (!process.env.OPENAI_KEY) {
      console.log("OpenAI API key no configurada, usando desafío predeterminado")
      return NextResponse.json({
        desafio: generarDesafioPredeterminado(carta),
      })
    }

    // Inicializar OpenAI con la API key DENTRO de la función del servidor
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
      // No necesitamos dangerouslyAllowBrowser aquí porque estamos en el servidor
    })

    console.log("Generando desafío para carta:", carta.nombre)

    const prompt = `
      Eres un influencer tóxico de TikTok con 2M seguidores. Genera un reto para ${carta?.nombre || "el jugador"} que:
      - Use 1 slang de Gen Z (ej: "delulu", "ick", "no pick me")
      - Incluya 1 referencia a cultura pop (ej: "Taylor Swift", "Dua Lipa en la peda")
      - Tenga 1 emoji y 1 hashtag inventado
      - Ejemplo: "Confiesa tu ick más random (🚩) y gana un shot si usas #TraumaBonding"
      
      Vibe del usuario: ${userVibe || "delulu"}
      
      Descripción de la carta: ${carta?.descripcion || ""}
      
      IMPORTANTE: Genera un desafío único y creativo relacionado específicamente con el tema de la carta.
    `

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.9, // Aumentar la temperatura para más variedad
      })

      const desafio = completion.choices[0].message.content
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
  const desafios: Record<string, string> = {
    "El Delulu":
      "Confiesa tu teoría más delulu que has tenido después de tres shots de tequila 🍹 #DeluluEsMiPersonalidad",
    "El Ghosteador VIP":
      "Recrea el último mensaje que enviaste a las 3 AM y luego borraste. Bonus si mencionas a Bad Bunny 🐰 #GhosteadorProfesional",
    "El Storytoxic":
      "Crea una story fingiendo que estás en Tulum, pero es el Oxxo de tu colonia. Usa la frase 'living my best life' 🌴 #OxxoAesthetic",
    "El Add to Cart":
      "Confiesa la compra más random que hiciste ebrio/a en Amazon. Bonus si fue inspirada por TikTok 🛒 #ShoppingTherapy",
  }

  return desafios[carta?.nombre] || "Confiesa algo vergonzoso que hiciste bajo los efectos del alcohol 🍸 #MomentoViral"
}

import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function GET() {
  try {
    // Verificar si tenemos la API key de OpenAI
    if (!process.env.OPENAI_KEY) {
      return NextResponse.json({
        success: false,
        error: "API key de OpenAI no configurada",
        apiKeyConfigured: false,
      })
    }

    // Inicializar OpenAI con la API key DENTRO de la función del servidor
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_KEY,
      // No necesitamos dangerouslyAllowBrowser aquí porque estamos en el servidor
    })

    // Intentar hacer una llamada simple a la API
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: "Hola, ¿cómo estás?" }],
        max_tokens: 10,
      })

      return NextResponse.json({
        success: true,
        apiKeyConfigured: true,
        response: completion.choices[0].message,
        model: completion.model,
      })
    } catch (openaiError) {
      console.error("Error llamando a OpenAI:", openaiError)

      return NextResponse.json({
        success: false,
        apiKeyConfigured: true,
        error: openaiError instanceof Error ? openaiError.message : "Error desconocido al llamar a OpenAI",
        details: openaiError,
      })
    }
  } catch (error) {
    console.error("Error general:", error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}

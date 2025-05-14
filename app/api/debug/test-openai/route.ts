import { NextResponse } from "next/server"

// Asegurar que este código solo se ejecuta en el servidor
export const runtime = "nodejs"

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

    // Intentar hacer una llamada simple a la API usando fetch directamente
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: "Hola, ¿cómo estás?" }],
          max_tokens: 10,
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

      return NextResponse.json({
        success: true,
        apiKeyConfigured: true,
        response: data.choices[0].message,
        model: data.model,
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

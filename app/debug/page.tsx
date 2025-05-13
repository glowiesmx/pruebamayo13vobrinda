"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function DebugPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testOpenAI = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/debug/test-openai")

      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      console.error("Error:", err)
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Diagnóstico de API</CardTitle>
          <CardDescription className="text-center">Verifica la configuración de la API de OpenAI</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="bg-white p-4 rounded-lg border">
              <h3 className="font-medium mb-2">Resultado de la prueba:</h3>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-40">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-lg">
            <p className="text-sm text-yellow-800">
              Esta página verifica si la API key de OpenAI está configurada correctamente y si puede generar respuestas.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={testOpenAI}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Probando...
              </>
            ) : (
              "Probar API de OpenAI"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

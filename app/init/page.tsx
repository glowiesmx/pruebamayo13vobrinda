"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useRouter } from "next/navigation"

export default function InitPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    async function initializeApp() {
      try {
        const response = await fetch("/api/init")
        const data = await response.json()

        if (data.success) {
          setSuccess(true)
          setMessage(data.message)
        } else {
          setError(data.error || "Error desconocido")
        }
      } catch (err) {
        setError("Error al inicializar la aplicación")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    initializeApp()
  }, [])

  const handleGoToApp = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Inicialización de Brinda</CardTitle>
          <CardDescription className="text-center">Configurando la aplicación para su primer uso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-6">
              <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
              <p className="mt-4 text-center">Inicializando la aplicación...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded-lg flex items-start">
              <XCircle className="h-6 w-6 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg flex items-start">
              <CheckCircle className="h-6 w-6 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">¡Éxito!</p>
                <p className="text-green-700 text-sm">{message}</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleGoToApp}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
            disabled={loading || !!error}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Espera...
              </>
            ) : error ? (
              "Reintentar"
            ) : (
              "Ir a la aplicación"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

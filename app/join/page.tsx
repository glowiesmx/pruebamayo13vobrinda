"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export default function JoinPage() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [mesaInfo, setMesaInfo] = useState<any>(null)
  const [mesaError, setMesaError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Obtener el ID de la mesa de los parámetros de búsqueda
  const mesaId = searchParams.get("mesa")

  useEffect(() => {
    // Si no hay ID de mesa, redirigir a la página de login
    if (!mesaId) {
      router.push("/login")
      return
    }

    // Verificar si la mesa existe
    const checkMesa = async () => {
      try {
        const { data, error } = await supabase.from("mesas_juego").select("*").eq("id", mesaId).single()

        if (error || !data) {
          setMesaError("La mesa no existe o ya no está activa")
          return
        }

        setMesaInfo(data)
      } catch (error) {
        console.error("Error al verificar mesa:", error)
        setMesaError("Error al verificar la mesa")
      }
    }

    checkMesa()
  }, [mesaId, router])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre",
        variant: "destructive",
      })
      return
    }

    if (!mesaId) {
      toast({
        title: "Error",
        description: "No se especificó un código de mesa",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Crear un nuevo usuario o recuperar uno existente
      const { data: existingUser, error: searchError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("nombre", nombre)
        .eq("email", email || "sin-email")
        .single()

      let userId

      if (searchError || !existingUser) {
        // Crear nuevo usuario
        const { data: newUser, error: createError } = await supabase
          .from("usuarios")
          .insert({
            nombre,
            email: email || null,
            avatar: `/placeholder.svg?height=40&width=40&text=${nombre[0].toUpperCase()}`,
          })
          .select()

        if (createError) throw createError
        userId = newUser?.[0]?.id
      } else {
        userId = existingUser.id
      }

      if (!userId) throw new Error("No se pudo obtener el ID del usuario")

      // Guardar información del usuario en localStorage
      localStorage.setItem("userId", userId)
      localStorage.setItem("userName", nombre)

      // Verificar si el jugador ya está en la mesa
      const { data: existingPlayer, error: playerError } = await supabase
        .from("jugadores_mesa")
        .select("*")
        .eq("mesa_id", mesaId)
        .eq("usuario_id", userId)
        .single()

      if (!existingPlayer) {
        // Agregar jugador a la mesa
        const { error: joinError } = await supabase.from("jugadores_mesa").insert({
          mesa_id: mesaId,
          usuario_id: userId,
          nombre,
          avatar: `/placeholder.svg?height=40&width=40&text=${nombre[0].toUpperCase()}`,
        })

        if (joinError) throw joinError
      }

      // Guardar ID de la mesa en localStorage
      localStorage.setItem("mesaId", mesaId)

      // Redirigir al juego
      router.push("/")

      toast({
        title: "¡Éxito!",
        description: `Te has unido a la mesa ${mesaId}`,
      })
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al unirse a la mesa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (mesaError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Error</CardTitle>
            <CardDescription className="text-center">{mesaError}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => router.push("/login")}>Volver al inicio</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">Unirse a la mesa</CardTitle>
          <CardDescription className="text-center">
            {mesaInfo ? `Únete a la mesa "${mesaInfo.nombre}"` : "Cargando información de la mesa..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Tu nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="bg-pink-50 p-4 rounded-lg">
              <p className="font-medium mb-2">Código de mesa:</p>
              <p className="text-xl font-bold text-pink-600 text-center">{mesaId}</p>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={loading || !mesaInfo}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Unirse a la mesa
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={() => router.push("/login")}>
            Volver al inicio
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Loader2, UserPlus, LogIn, Users } from "lucide-react"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export default function LoginPage() {
  const [nombre, setNombre] = useState("")
  const [email, setEmail] = useState("")
  const [mesaId, setMesaId] = useState("")
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "join">("login")
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!nombre.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre",
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

      // Si estamos en modo "join", unirse a una mesa existente
      if (mode === "join" && mesaId) {
        await joinMesa(userId, mesaId)
      } else {
        // Redirigir al juego
        router.push("/")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al iniciar sesión",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const joinMesa = async (userId: string, mesaId: string) => {
    try {
      // Verificar si la mesa existe
      const { data: mesa, error: mesaError } = await supabase.from("mesas_juego").select("*").eq("id", mesaId).single()

      if (mesaError || !mesa) {
        toast({
          title: "Error",
          description: "La mesa no existe o ya no está activa",
          variant: "destructive",
        })
        return
      }

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
      console.error("Error al unirse a la mesa:", error)
      toast({
        title: "Error",
        description: "No se pudo unir a la mesa",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            {mode === "login" ? "Inicia sesión en Brinda" : "Únete a una mesa"}
          </CardTitle>
          <CardDescription className="text-center">
            {mode === "login" ? "Ingresa tu nombre para comenzar a jugar" : "Ingresa el código de la mesa para unirte"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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

            {mode === "join" && (
              <div className="space-y-2">
                <Label htmlFor="mesaId">Código de la mesa</Label>
                <Input
                  id="mesaId"
                  placeholder="Ej: mesa-1234"
                  value={mesaId}
                  onChange={(e) => setMesaId(e.target.value)}
                  required={mode === "join"}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : mode === "login" ? (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar sesión
                </>
              ) : (
                <>
                  <Users className="mr-2 h-4 w-4" />
                  Unirse a la mesa
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full" onClick={() => setMode(mode === "login" ? "join" : "login")}>
            {mode === "login" ? (
              <>
                <Users className="mr-2 h-4 w-4" />
                Unirse a una mesa existente
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Crear nueva sesión
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

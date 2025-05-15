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
import { JoinMesaForm } from "@/components/join-mesa-form"

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

// Lista de palabras divertidas para generar códigos
const palabrasDivertidas = [
  "fiesta",
  "tequila",
  "baile",
  "rumba",
  "salsa",
  "mezcal",
  "mariachi",
  "tacos",
  "guacamole",
  "piñata",
  "confeti",
  "margarita",
  "karaoke",
  "cumbia",
  "reggaeton",
  "perreo",
  "antro",
  "peda",
  "chela",
  "shot",
  "brindis",
  "copa",
  "botella",
  "hielo",
  "limón",
  "sal",
  "música",
  "amigos",
  "noche",
  "diversión",
  "risa",
  "juego",
  "carta",
]

// Función para generar un código amigable
function generarCodigoAmigable() {
  const palabra1 = palabrasDivertidas[Math.floor(Math.random() * palabrasDivertidas.length)]
  const palabra2 = palabrasDivertidas[Math.floor(Math.random() * palabrasDivertidas.length)]
  const numero = Math.floor(Math.random() * 100)
  return `${palabra1}-${palabra2}-${numero}`
}

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
        // Crear una nueva mesa con código amigable
        await createMesa(userId, nombre)
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

  const createMesa = async (userId: string, userName: string) => {
    try {
      // Generar un código amigable para la mesa
      const mesaId = generarCodigoAmigable()

      const response = await fetch("/api/mesas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userName,
          mesaId, // Pasar el código amigable generado
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear mesa")
      }

      const data = await response.json()
      localStorage.setItem("mesaId", data.mesaId)

      // Redirigir al juego
      router.push("/")

      toast({
        title: "¡Mesa creada!",
        description: `Tu código de mesa es: ${data.mesaId}`,
      })
    } catch (error) {
      console.error("Error al crear mesa:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la mesa de juego",
        variant: "destructive",
      })
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

  const handleJoinMesa = (mesaId: string) => {
    setMesaId(mesaId)
  }

  const handleCreateNewMesa = () => {
    // Simplemente cambiamos al modo login para crear una nueva mesa
    setMode("login")
    setMesaId("")
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

            {mode === "join" && <JoinMesaForm onJoin={handleJoinMesa} onCreateNew={handleCreateNewMesa} />}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
              disabled={loading || (mode === "join" && !mesaId)}
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

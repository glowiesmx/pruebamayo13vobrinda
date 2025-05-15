"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { QrCode, Copy, RefreshCw, Users, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@supabase/supabase-js"
import QRCode from "qrcode"
import { ShareButtons } from "./share-buttons"

interface JoinMesaFormProps {
  mesaId?: string
  onJoin: (mesaId: string) => void
  onCreateNew: () => void
}

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

export function JoinMesaForm({ mesaId, onJoin, onCreateNew }: JoinMesaFormProps) {
  const [inputMesaId, setInputMesaId] = useState("")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [mesasRecientes, setMesasRecientes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [joinUrl, setJoinUrl] = useState<string>("")
  const { toast } = useToast()

  // Generar QR para la mesa actual
  useEffect(() => {
    if (mesaId) {
      const generateQR = async () => {
        try {
          // Crear URL completa para unirse a la mesa
          const url = `${window.location.origin}/join?mesa=${mesaId}`
          setJoinUrl(url)
          const qrDataUrl = await QRCode.toDataURL(url)
          setQrCodeUrl(qrDataUrl)
        } catch (error) {
          console.error("Error generando QR:", error)
        }
      }

      generateQR()
    }
  }, [mesaId])

  // Cargar mesas recientes del localStorage
  useEffect(() => {
    const storedMesas = localStorage.getItem("mesasRecientes")
    if (storedMesas) {
      try {
        const mesas = JSON.parse(storedMesas)
        if (Array.isArray(mesas)) {
          setMesasRecientes(mesas)
        }
      } catch (error) {
        console.error("Error parsing mesas recientes:", error)
      }
    }
  }, [])

  const handleJoin = async () => {
    if (!inputMesaId.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa un código de mesa",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // Verificar si la mesa existe
      const { data, error } = await supabase.from("mesas_juego").select("id").eq("id", inputMesaId).single()

      if (error || !data) {
        toast({
          title: "Mesa no encontrada",
          description: "El código de mesa no existe o ya no está activo",
          variant: "destructive",
        })
        return
      }

      // Guardar en mesas recientes
      const updatedMesas = [inputMesaId, ...mesasRecientes.filter((m) => m !== inputMesaId)].slice(0, 5)
      localStorage.setItem("mesasRecientes", JSON.stringify(updatedMesas))
      setMesasRecientes(updatedMesas)

      // Llamar a la función de unión
      onJoin(inputMesaId)

      toast({
        title: "¡Éxito!",
        description: `Te has unido a la mesa ${inputMesaId}`,
      })
    } catch (error) {
      console.error("Error al unirse a la mesa:", error)
      toast({
        title: "Error",
        description: "No se pudo unir a la mesa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateNew = async () => {
    setLoading(true)
    try {
      // Generar un código amigable
      const nuevoCodigoMesa = generarCodigoAmigable()

      // Llamar a la función para crear nueva mesa
      onCreateNew()

      toast({
        title: "Nueva mesa creada",
        description: `Se ha creado la mesa con código: ${nuevoCodigoMesa}`,
      })
    } catch (error) {
      console.error("Error al crear nueva mesa:", error)
      toast({
        title: "Error",
        description: "No se pudo crear una nueva mesa",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copiado",
      description: "Código de mesa copiado al portapapeles",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Unirse a una mesa</CardTitle>
        <CardDescription>Ingresa el código de la mesa o escanea el QR</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {mesaId ? (
          <div className="space-y-4">
            <div className="bg-pink-50 p-4 rounded-lg text-center">
              <p className="font-medium mb-2">Tu código de mesa:</p>
              <div className="flex items-center justify-center gap-2 bg-white p-2 rounded border">
                <span className="text-xl font-bold text-pink-600">{mesaId}</span>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => copyToClipboard(mesaId)}>
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-sm mt-2">Comparte este código con tus amigos para que se unan</p>
            </div>

            {qrCodeUrl && (
              <div className="flex flex-col items-center">
                <p className="font-medium mb-2">O escanea este código QR:</p>
                <div className="bg-white p-3 rounded-lg border">
                  <img src={qrCodeUrl || "/placeholder.svg"} alt="QR Code" className="w-48 h-48" />
                </div>
              </div>
            )}

            {/* Botones para compartir */}
            <div className="space-y-2">
              <p className="font-medium text-center">Compartir en redes sociales:</p>
              <ShareButtons
                url={joinUrl}
                title="¡Únete a mi mesa en Brinda!"
                message={`¡Únete a mi mesa en Brinda! Usa el código: ${mesaId}`}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mesaId">Código de la mesa</Label>
              <div className="flex gap-2">
                <Input
                  id="mesaId"
                  placeholder="Ej: fiesta-tequila-42"
                  value={inputMesaId}
                  onChange={(e) => setInputMesaId(e.target.value)}
                />
                <Button onClick={handleJoin} disabled={loading}>
                  <Users className="mr-2 h-4 w-4" />
                  Unirse
                </Button>
              </div>
            </div>

            {mesasRecientes.length > 0 && (
              <div className="space-y-2">
                <Label>Mesas recientes</Label>
                <div className="flex flex-wrap gap-2">
                  {mesasRecientes.map((mesa) => (
                    <Button
                      key={mesa}
                      variant="outline"
                      size="sm"
                      onClick={() => setInputMesaId(mesa)}
                      className="flex items-center gap-1"
                    >
                      <QrCode className="h-3 w-3" />
                      {mesa}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          variant={mesaId ? "outline" : "default"}
          onClick={handleCreateNew}
          disabled={loading}
          className={mesaId ? "border-pink-300 hover:bg-pink-100" : ""}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          {mesaId ? "Crear nueva mesa" : "Generar código aleatorio"}
        </Button>
      </CardFooter>
    </Card>
  )
}

"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, StopCircle, Send, Loader2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { GameMechanics } from "./game-mechanics"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@supabase/supabase-js"

interface ResponseInputProps {
  onSubmit: (text: string, audio: Blob | null) => void
  loading: boolean
  cardType?: string
  mesaId?: string
  initialResponse?: string
  jugadores?: any[]
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function ResponseInput({
  onSubmit,
  loading,
  cardType = "individual",
  mesaId = "mesa-default",
  initialResponse = "",
  jugadores = [],
}: ResponseInputProps) {
  const [text, setText] = useState<string>(initialResponse)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [showMechanics, setShowMechanics] = useState<boolean>(false)
  const [selectedPartner, setSelectedPartner] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const { toast } = useToast()
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null

  // Actualizar el texto cuando cambia initialResponse
  useEffect(() => {
    if (initialResponse) {
      setText(initialResponse)

      // Mostrar un toast para confirmar que se cargó la respuesta del chat
      toast({
        title: "Respuesta cargada",
        description: "Tu respuesta del chat ha sido cargada. Puedes editarla antes de enviar.",
      })
    }
  }, [initialResponse, toast])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/mp3" })
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioBlob(audioBlob)
        setAudioUrl(audioUrl)
        setIsRecording(false)

        // Detener todas las pistas en el stream
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)

      toast({
        title: "Grabando audio",
        description: "Habla claramente y con tu mejor voz de influencer tóxico.",
      })
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Error",
        description: "No pudimos acceder al micrófono. Verifica los permisos.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  // Manejar la selección de pareja para duetos
  const handlePartnerSelect = async (partnerId: string) => {
    setSelectedPartner(partnerId)

    // Actualizar la mesa con la información del dueto
    if (mesaId && userId) {
      try {
        await fetch("/api/mesas/modo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mesaId,
            modo: "dueto",
            jugadorActivo: userId,
            jugadorPareja: partnerId,
          }),
        })

        toast({
          title: "Pareja seleccionada",
          description: "Se ha seleccionado un compañero para el dueto",
        })
      } catch (error) {
        console.error("Error al actualizar modo de juego:", error)
      }
    }
  }

  // Manejar la finalización de la mecánica de juego
  const handleMechanicsComplete = (score: number) => {
    toast({
      title: "¡Puntuación registrada!",
      description: `Has obtenido ${score} puntos en este desafío.`,
    })
    setShowMechanics(false)

    // Continuar con el flujo normal
    onSubmit(text, audioBlob)
  }

  // Manejar el envío del formulario
  const handleSubmit = () => {
    if ((!text || text.trim() === "") && !audioBlob) {
      toast({
        title: "Error",
        description: "Debes escribir una respuesta o grabar un audio.",
        variant: "destructive",
      })
      return
    }

    // Para duetos, verificar que se haya seleccionado una pareja
    if (cardType === "dueto" && !selectedPartner) {
      toast({
        title: "Selecciona una pareja",
        description: "Debes seleccionar un compañero para el dueto.",
        variant: "destructive",
      })
      return
    }

    // Mostrar mecánicas de juego
    setShowMechanics(true)
  }

  // Renderizar componente de mecánicas de juego
  if (showMechanics) {
    return (
      <GameMechanics
        type={cardType as "individual" | "dueto" | "grupal"}
        onComplete={handleMechanicsComplete}
        mesaId={mesaId}
        players={jugadores.map((j) => ({ id: j.usuario_id, name: j.nombre }))}
        activePlayer={userId || undefined}
        partnerPlayer={selectedPartner || undefined}
      />
    )
  }

  return (
    <Card className="w-full border-dashed border-pink-400 border-2 bg-white/90">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Tu respuesta ✨aesthetic✨</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de pareja para duetos */}
        {cardType === "dueto" && jugadores.length > 1 && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <p className="font-medium mb-3">Selecciona tu pareja para el dueto:</p>
            <Select onValueChange={handlePartnerSelect} value={selectedPartner || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un compañero" />
              </SelectTrigger>
              <SelectContent>
                {jugadores
                  .filter((j) => j.usuario_id !== userId)
                  .map((jugador) => (
                    <SelectItem key={jugador.usuario_id} value={jugador.usuario_id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">{jugador.nombre[0]}</AvatarFallback>
                        </Avatar>
                        <span>{jugador.nombre}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>

            {selectedPartner && (
              <div className="mt-3 bg-white p-3 rounded-lg flex items-center gap-3">
                <UserPlus className="h-5 w-5 text-purple-500" />
                <p className="text-sm">
                  Has seleccionado a{" "}
                  <span className="font-medium">{jugadores.find((j) => j.usuario_id === selectedPartner)?.nombre}</span>{" "}
                  como tu pareja para este dueto.
                </p>
              </div>
            )}
          </div>
        )}

        <Textarea
          placeholder="Escribe como si nadie fuera a juzgarte (spoiler: todos lo harán)"
          className="min-h-[120px] border-pink-200 focus:border-pink-500 text-sm sm:text-base"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={loading}
        />

        <div className="flex justify-center">
          {!isRecording ? (
            <Button
              variant="outline"
              className="border-pink-300 hover:bg-pink-100 hover:text-pink-700 w-full sm:w-auto"
              onClick={startRecording}
              disabled={loading}
            >
              <Mic className="mr-2 h-4 w-4" />
              Grabar audio
            </Button>
          ) : (
            <Button
              variant="outline"
              className="border-red-300 hover:bg-red-100 hover:text-red-700 animate-pulse w-full sm:w-auto"
              onClick={stopRecording}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              Detener grabación
            </Button>
          )}
        </div>

        {audioUrl && (
          <div className="bg-pink-50 p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">Audio grabado:</p>
            <audio controls src={audioUrl} className="w-full" />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button
          onClick={handleSubmit}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white w-full sm:w-auto"
          disabled={loading || (cardType === "dueto" && !selectedPartner)}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Subir a mi ✨finsta✨
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

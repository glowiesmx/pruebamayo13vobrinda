"use client"

import { useState, useEffect } from "react"
import { CardSelector } from "./card-selector"
import { ChallengeDisplay } from "./challenge-display"
import { ResponseInput } from "./response-input"
import { RewardDisplay } from "./reward-display"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ContextualChat } from "./contextual-chat"

// Definir los pasos del juego
enum GameSteps {
  START = "start",
  CHALLENGE = "challenge",
  CHAT = "chat", // Nuevo paso para la interacción de chat
  RESPONSE = "response",
  REWARD = "reward",
}

// Crear cliente de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export function GameContainer() {
  const [gameStep, setGameStep] = useState<GameSteps>(GameSteps.START)
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [challenge, setChallenge] = useState<string>("")
  const [challengeSource, setChallengeSource] = useState<string>("")
  const [response, setResponse] = useState<string>("")
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [reward, setReward] = useState<any>(null)
  const [mesaId, setMesaId] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    // Generar un ID de mesa aleatorio cuando se monta el componente
    setMesaId(`mesa-${Math.floor(Math.random() * 10000)}`)
  }, [])

  const handleCardSelect = async (card: any) => {
    setSelectedCard(card)
    setLoading(true)
    setApiError(null)

    try {
      // Verificar que la carta tenga los datos necesarios
      if (!card || !card.nombre) {
        throw new Error("Datos de carta inválidos")
      }

      console.log("Enviando solicitud para carta:", card.nombre)

      const response = await fetch("/api/generate-challenge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carta: card,
          userVibe: "delulu", // Vibe predeterminado
        }),
      })

      // Verificar si la respuesta es OK
      if (!response.ok) {
        const errorText = await response.text()
        console.error("Error en la respuesta:", response.status, errorText)
        throw new Error(`Error en la respuesta: ${response.status} ${response.statusText}`)
      }

      // Intentar parsear la respuesta como JSON
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      // Verificar si hay un desafío en la respuesta
      if (!data || !data.desafio) {
        throw new Error("Respuesta de API inválida")
      }

      console.log("Respuesta recibida:", data)

      setChallenge(data.desafio)
      setChallengeSource(data.source || "unknown")

      // Mostrar un mensaje si estamos usando un desafío predeterminado
      if (data.source === "fallback" || data.source === "error") {
        setApiError(data.error || "No se pudo conectar con OpenAI")
        toast({
          title: "Usando desafío predeterminado",
          description: "No pudimos generar un desafío personalizado. Usando uno predeterminado.",
          variant: "default",
        })
      }

      setGameStep(GameSteps.CHALLENGE)
    } catch (error) {
      console.error("Error:", error)

      // Usar un desafío predeterminado en caso de error
      const defaultChallenge = `Confiesa algo vergonzoso relacionado con ${card?.nombre || "tu vida"} 🍸 #MomentoViral`
      setChallenge(defaultChallenge)
      setChallengeSource("error")
      setApiError(error instanceof Error ? error.message : "Error desconocido")

      toast({
        title: "Error",
        description: "No pudimos generar un desafío. Usando uno predeterminado.",
        variant: "destructive",
      })

      // Continuar el juego a pesar del error
      setGameStep(GameSteps.CHALLENGE)
    } finally {
      setLoading(false)
    }
  }

  const handleChatSubmit = (message: string) => {
    console.log("Mensaje recibido del chat:", message)
    setResponse(message)

    // Mostrar un toast para confirmar que se recibió el mensaje
    toast({
      title: "Respuesta guardada",
      description: "Tu respuesta ha sido guardada. Continuando automáticamente...",
    })

    // Cambiar automáticamente al siguiente paso después de un breve retraso
    setTimeout(() => {
      setGameStep(GameSteps.RESPONSE)
    }, 2000)
  }

  const handleResponseSubmit = async (text: string, audio: Blob | null) => {
    setResponse(text)
    if (audio) {
      setAudioBlob(audio)
    }

    setLoading(true)

    try {
      // Si hay audio, intentar subirlo a Supabase Storage
      let audioUrl = ""
      if (audio) {
        try {
          const fileName = `audio-${Date.now()}.mp3`
          const { data, error } = await supabase.storage.from("responses").upload(fileName, audio)

          if (error) throw error

          // Obtener la URL pública
          const { data: urlData } = supabase.storage.from("responses").getPublicUrl(fileName)

          audioUrl = urlData.publicUrl
        } catch (storageError) {
          console.error("Error al subir audio:", storageError)
          // Continuar sin el audio si hay error
        }
      }

      // Intentar guardar la respuesta en la base de datos
      try {
        await supabase.from("respuestas").insert({
          carta_id: selectedCard.id,
          contenido: text,
          audio_url: audioUrl,
          mesa_id: mesaId,
        })
      } catch (dbError) {
        console.error("Error al guardar respuesta:", dbError)
        // Continuar incluso si hay error en la base de datos
      }

      // Validar la respuesta
      const validateResponse = await fetch("/api/validate-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          respuesta: text,
          audioUrl,
          carta: selectedCard,
        }),
      })

      // Verificar si la respuesta es OK
      if (!validateResponse.ok) {
        const errorText = await validateResponse.text()
        console.error("Error en la respuesta:", validateResponse.status, errorText)
        throw new Error(`Error en la respuesta: ${validateResponse.status} ${validateResponse.statusText}`)
      }

      // Intentar parsear la respuesta como JSON
      let data
      try {
        data = await validateResponse.json()
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError)
        throw new Error("Error al procesar la respuesta del servidor")
      }

      // Verificar si hay un resultado en la respuesta
      if (!data || (!data.resultado && !data.recompensas)) {
        throw new Error("Respuesta de validación inválida")
      }

      setReward(data)
      setGameStep(GameSteps.REWARD)
    } catch (error) {
      console.error("Error:", error)

      // Crear una recompensa predeterminada en caso de error
      const defaultReward = {
        resultado: "¡Eso fue tan delulu que hasta Taylor Swift te daría un like! 💅",
        recompensas: [
          {
            tipo: "playlist",
            nombre: "Playlist Spotify",
            descripcion: "Canciones para llorar en el Oxxo mientras stalkeas a tu ex",
          },
          {
            tipo: "filtro",
            nombre: "Filtro Instagram",
            descripcion: "Golden Hour Falso para tus stories de peda casera",
          },
        ],
      }

      setReward(defaultReward)

      toast({
        title: "Aviso",
        description: "Estamos usando una recompensa predeterminada. ¡Sigue jugando!",
        variant: "default",
      })

      // Continuar el juego a pesar del error
      setGameStep(GameSteps.REWARD)
    } finally {
      setLoading(false)
    }
  }

  const resetGame = () => {
    setSelectedCard(null)
    setChallenge("")
    setChallengeSource("")
    setResponse("")
    setAudioBlob(null)
    setReward(null)
    setApiError(null)
    setGameStep(GameSteps.START)
  }

  const renderGameStep = () => {
    switch (gameStep) {
      case GameSteps.START:
        return <CardSelector onSelectCard={handleCardSelect} loading={loading} />
      case GameSteps.CHALLENGE:
        return (
          <>
            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de API</AlertTitle>
                <AlertDescription>
                  {apiError}
                  <div className="mt-2 text-xs">
                    Fuente del desafío: {challengeSource === "openai" ? "OpenAI" : "Predeterminado"}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <ChallengeDisplay
              card={selectedCard}
              challenge={challenge}
              source={challengeSource}
              onNext={() => setGameStep(GameSteps.CHAT)}
            />
          </>
        )
      case GameSteps.CHAT:
        return (
          <>
            {apiError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error de API</AlertTitle>
                <AlertDescription>
                  {apiError}
                  <div className="mt-2 text-xs">
                    Fuente del desafío: {challengeSource === "openai" ? "OpenAI" : "Predeterminado"}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <ContextualChat
                cardType={selectedCard?.tipo || "individual"}
                cardName={selectedCard?.nombre || ""}
                challenge={challenge}
                onSubmit={handleChatSubmit}
              />
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setGameStep(GameSteps.RESPONSE)}
                  className="border-pink-300 hover:bg-pink-100"
                >
                  Saltar chat y responder directamente
                </Button>
              </div>
            </div>
          </>
        )
      case GameSteps.RESPONSE:
        return (
          <ResponseInput
            onSubmit={handleResponseSubmit}
            loading={loading}
            cardType={selectedCard?.tipo || "individual"}
            mesaId={mesaId}
            initialResponse={response} // Pasar la respuesta del chat como valor inicial
          />
        )
      case GameSteps.REWARD:
        return <RewardDisplay reward={reward} onReset={resetGame} />
      default:
        return <CardSelector onSelectCard={handleCardSelect} loading={loading} />
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white/80 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded">Mesa: {mesaId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {gameStep === GameSteps.START
              ? "Selecciona una carta"
              : gameStep === GameSteps.CHALLENGE
                ? "Desafío"
                : gameStep === GameSteps.CHAT
                  ? "Chat"
                  : gameStep === GameSteps.RESPONSE
                    ? "Tu respuesta"
                    : "Recompensa"}
          </span>
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
            <p className="mt-2">Cargando...</p>
          </div>
        </div>
      )}

      {gameStep === GameSteps.START && (
        <Card className="p-6 text-center bg-white/90 border-dashed border-pink-400 border-2">
          <h2 className="text-2xl font-bold mb-4 text-pink-600">
            ¿Listo para ser el main character de tu propia comedia de errores? 💃
          </h2>
          <p className="text-lg mb-6">Selecciona una carta y prepárate para el desmadre con tus amigos</p>
        </Card>
      )}

      {renderGameStep()}
    </div>
  )
}

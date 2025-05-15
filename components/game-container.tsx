"use client"

import { useState, useEffect } from "react"
import { CardSelector } from "./card-selector"
import { ChallengeDisplay } from "./challenge-display"
import { ResponseInput } from "./response-input"
import { RewardDisplay } from "./reward-display"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"
import { Card } from "@/components/ui/card"
import { Loader2, AlertCircle, Users } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ContextualChat } from "./contextual-chat"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { MesaStats } from "./mesa-stats"

// Definir los pasos del juego
enum GameSteps {
  START = "start",
  CHALLENGE = "challenge",
  CHAT = "chat",
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
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [jugadores, setJugadores] = useState<any[]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Verificar si el usuario está autenticado
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId")
    const storedUserName = localStorage.getItem("userName")
    const storedMesaId = localStorage.getItem("mesaId")

    if (!storedUserId || !storedUserName) {
      // Redirigir a la página de login si no hay usuario
      router.push("/login")
      return
    }

    setUserId(storedUserId)
    setUserName(storedUserName)

    // Si hay una mesa guardada, usarla
    if (storedMesaId) {
      setMesaId(storedMesaId)
      fetchMesaInfo(storedMesaId)
    } else {
      // Si no hay mesa, crear una nueva
      createMesa(storedUserId, storedUserName)
    }
  }, [router])

  // Crear una nueva mesa
  const createMesa = async (userId: string, userName: string) => {
    try {
      setLoading(true)
      const response = await fetch("/api/mesas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          userName,
        }),
      })

      if (!response.ok) {
        throw new Error("Error al crear mesa")
      }

      const data = await response.json()
      setMesaId(data.mesaId)
      localStorage.setItem("mesaId", data.mesaId)

      toast({
        title: "Mesa creada",
        description: `ID de la mesa: ${data.mesaId}`,
      })

      // Obtener información de la mesa
      fetchMesaInfo(data.mesaId)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la mesa de juego",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Obtener información de la mesa
  const fetchMesaInfo = async (id: string) => {
    try {
      const response = await fetch(`/api/mesas?id=${id}`)
      if (!response.ok) {
        throw new Error("Error al obtener información de la mesa")
      }

      const data = await response.json()
      setJugadores(data.jugadores || [])

      // Si hay una carta activa, cargarla
      if (data.mesa?.carta_actual) {
        // Aquí cargaríamos la carta y el estado del juego
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "No se pudo obtener información de la mesa",
        variant: "destructive",
      })
    }
  }

  // Configurar canal de tiempo real para actualizaciones de la mesa
  useEffect(() => {
    if (!mesaId) return

    // Suscribirse a cambios en la mesa
    const channel = supabase
      .channel(`mesa-${mesaId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "jugadores_mesa", filter: `mesa_id=eq.${mesaId}` },
        (payload) => {
          // Actualizar lista de jugadores cuando se une uno nuevo
          fetchMesaInfo(mesaId)
          toast({
            title: "Nuevo jugador",
            description: `${payload.new.nombre} se ha unido a la mesa`,
          })
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "votaciones_respuestas", filter: `mesa_id=eq.${mesaId}` },
        () => {
          // Actualizar cuando hay nuevos votos
          toast({
            title: "Nuevo voto",
            description: "Alguien ha votado por una respuesta",
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [mesaId, toast])

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

      // Actualizar la carta actual en la mesa
      if (mesaId && userId) {
        await fetch("/api/mesas/modo", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            mesaId,
            modo: card.tipo || "individual",
            jugadorActivo: userId,
            cartaId: card.id,
          }),
        })
      }

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
      let respuestaId
      try {
        const { data, error } = await supabase
          .from("respuestas")
          .insert({
            carta_id: selectedCard.id,
            usuario_id: userId,
            contenido: text,
            audio_url: audioUrl,
            mesa_id: mesaId,
          })
          .select()

        if (error) throw error
        respuestaId = data?.[0]?.id
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
          respuestaId,
          mesaId,
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

      // Obtener recompensas personalizadas
      try {
        const recompensasResponse = await fetch(
          `/api/recompensas?carta=${encodeURIComponent(selectedCard.nombre)}&tipo=playlist`,
        )
        const recompensasData = await recompensasResponse.json()

        if (recompensasData.success && recompensasData.data && recompensasData.data.length > 0) {
          // Usar recompensas personalizadas si están disponibles
          data.recompensas = recompensasData.data.map((r: any) => ({
            tipo: r.tipo,
            nombre: r.nombre,
            descripcion: r.descripcion,
            url: r.url,
          }))
        }
      } catch (recompensasError) {
        console.error("Error al obtener recompensas personalizadas:", recompensasError)
        // Continuar con las recompensas predeterminadas
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
            url: "https://open.spotify.com/playlist/37i9dQZF1DX6xOPeSOGone",
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
            jugadores={jugadores}
          />
        )
      case GameSteps.REWARD:
        return <RewardDisplay reward={reward} onReset={resetGame} />
      default:
        return <CardSelector onSelectCard={handleCardSelect} loading={loading} />
    }
  }

  // Si no hay usuario, mostrar pantalla de carga
  if (!userId || !userName) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center bg-white/80 p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="bg-pink-100 text-pink-800 text-xs font-medium px-2.5 py-0.5 rounded">Mesa: {mesaId}</span>
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 flex items-center">
            <Users className="h-3 w-3 mr-1" /> {jugadores.length} jugadores
          </Badge>
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

      {mesaId && <MesaStats mesaId={mesaId} />}

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
          {jugadores.length > 0 && (
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Jugadores en esta mesa:</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                {jugadores.map((jugador) => (
                  <Badge key={jugador.id} variant="outline" className="bg-white">
                    {jugador.nombre}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {renderGameStep()}
    </div>
  )
}

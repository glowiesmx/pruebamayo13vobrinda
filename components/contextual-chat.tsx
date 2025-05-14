"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Send, Paperclip, Mic, ImageIcon, Check, CheckCheck, HelpCircle, Lock } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

interface ContextualChatProps {
  cardType: string
  cardName: string
  challenge: string
  onSubmit: (message: string) => void
}

// Definir los diferentes contextos de chat según el tipo de carta
const chatContexts: Record<
  string,
  {
    name: string
    avatar: string
    initialMessage: string
    placeholder: string
    background: string
  }
> = {
  "El Delulu": {
    name: "Crush Imaginario",
    avatar: "/placeholder.svg?height=40&width=40&text=💭",
    initialMessage: "¿Qué teoría delulu tienes sobre nosotros?",
    placeholder: "Escribe tu confesión delulu...",
    background: "bg-gradient-to-r from-pink-100 to-purple-100",
  },
  "El Ghosteador VIP": {
    name: "Ex Ghosteado",
    avatar: "/placeholder.svg?height=40&width=40&text=👻",
    initialMessage: "Hace 3 meses que no me contestas... ¿Sigues vivo?",
    placeholder: "Escribe tu excusa de ghosteador...",
    background: "bg-gradient-to-r from-blue-100 to-purple-100",
  },
  "El Storytoxic": {
    name: "Followers",
    avatar: "/placeholder.svg?height=40&width=40&text=📸",
    initialMessage: "¡Wow! ¿Dónde estás? ¡Se ve increíble!",
    placeholder: "Escribe tu caption de influencer...",
    background: "bg-gradient-to-r from-yellow-100 to-orange-100",
  },
  "El Add to Cart": {
    name: "Amazon",
    avatar: "/placeholder.svg?height=40&width=40&text=🛒",
    initialMessage: "Tu pedido ha sido entregado. ¿Qué compraste a las 3 AM?",
    placeholder: "Confiesa tu compra impulsiva...",
    background: "bg-gradient-to-r from-blue-100 to-teal-100",
  },
  "El Situationship": {
    name: "Situationship",
    avatar: "/placeholder.svg?height=40&width=40&text=🚩",
    initialMessage: "Hey... ¿qué somos? 👉👈",
    placeholder: "Escribe tu respuesta ambigua...",
    background: "bg-gradient-to-r from-red-100 to-pink-100",
  },
  "El Soft Launch": {
    name: "Instagram",
    avatar: "/placeholder.svg?height=40&width=40&text=📱",
    initialMessage: "¡Nueva publicación! ¿Quién es esa mano misteriosa en tu foto?",
    placeholder: "Escribe tu caption ambiguo...",
    background: "bg-gradient-to-r from-purple-100 to-blue-100",
  },
  "El Rizz Master": {
    name: "Match de Tinder",
    avatar: "/placeholder.svg?height=40&width=40&text=💘",
    initialMessage: "Hola, acabo de hacer match contigo. Sorpréndeme.",
    placeholder: "Escribe tu línea de ligue...",
    background: "bg-gradient-to-r from-pink-100 to-red-100",
  },
  "El Main Character": {
    name: "Director de Netflix",
    avatar: "/placeholder.svg?height=40&width=40&text=🎬",
    initialMessage: "Cuéntame sobre tu día como si fuera una serie de Netflix",
    placeholder: "Escribe tu monólogo principal...",
    background: "bg-gradient-to-r from-indigo-100 to-purple-100",
  },
}

// Sugerencias de AI para cada tipo de carta
const aiSuggestions: Record<string, string[]> = {
  "El Delulu": [
    "Cuando me miró por 0.5 segundos supe que estábamos destinados 💫",
    "Seguro canceló su cita porque secretamente quería verme a mí",
    "Cuando no me contesta es porque está pensando la respuesta perfecta 🌈",
  ],
  "El Ghosteador VIP": [
    "Perdón, es que mi teléfono cayó en un portal dimensional 👽",
    "Estaba en una misión secreta con Bad Bunny, ya sabes cómo es esto",
    "Mi terapeuta me dijo que contestar mensajes causa ansiedad cósmica 🌌",
  ],
  "El Storytoxic": [
    "Living my best life en las paradisíacas playas de... el Oxxo 🏝️ #NoFilter",
    "Mi outfit de 5000 dólares para ir a comprar chicles #LuxuryLifestyle",
    "Cuando el universo te regala un atardecer perfecto (desde el estacionamiento) ✨",
  ],
  "El Add to Cart": [
    "Un telescopio profesional aunque vivo en la ciudad con contaminación lumínica 🔭",
    "17 plantas aunque no sé cuidar ni un cactus #PlantParent",
    "Un curso de idioma alienígena porque el español ya me aburre 👽",
  ],
  "El Situationship": [
    "No estamos en una relación pero si hablas con alguien más me muero 🙃",
    "Somos amigos que se besan y duermen juntos pero sin compromiso ✨",
    "No quiero etiquetas pero te presento como 'alguien especial' a mi familia 🚩",
  ],
  "El Soft Launch": [
    "A veces el universo te sorprende con personas que llegan para quedarse... 👀✨",
    "Nueva era, nueva energía y tal vez alguien nuevo también... 🤫",
    "Dicen que las mejores historias empiezan cuando menos lo esperas 💫",
  ],
  "El Rizz Master": [
    "¿Eres WiFi? Porque siento una conexión instantánea 📶",
    "Si fueras una canción de Bad Bunny, serías 'La Noche de Anoche' porque eres fuego 🔥",
    "¿Te dolió cuando caíste del cielo? Porque tienes cara de que no usaste paracaídas 💀",
  ],
  "El Main Character": [
    "Mientras caminaba bajo la lluvia, el universo me susurró que el café de hoy cambiaría mi destino ☕",
    "Tres personas me miraron hoy en el metro. Claramente soy el protagonista de sus historias 💅",
    "Mi soundtrack mental sonaba a Taylor Swift mientras ignoraba las red flags de mi jefe 🚩",
  ],
}

// Respuestas finales de la IA para cada tipo de carta
const finalResponses: Record<string, string[]> = {
  "El Delulu": [
    "¡Eso es tan delulu que hasta yo me sorprendo! 😮 Tu respuesta es perfecta para el desafío. ¿Listo para continuar?",
    "¡Delulu is the solulu! 💫 Tu confesión es exactamente lo que estábamos buscando. ¡Vamos a continuar!",
    "¡Esa teoría delulu merece un premio! 🏆 Has completado perfectamente el desafío. ¡Sigamos adelante!",
  ],
  "El Ghosteador VIP": [
    "¡La excusa perfecta para un ghosteador profesional! 👻 Has completado el desafío. ¿Continuamos?",
    "¡Esa excusa es digna del Salón de la Fama del Ghosting! 🏆 Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Ni mi ex tenía excusas tan creativas! 💀 Tu respuesta es perfecta. ¡Continuemos!",
  ],
  "El Storytoxic": [
    "¡Esa story merece mil likes! 📸✨ Has completado el desafío perfectamente. ¿Listo para seguir?",
    "¡Mis followers están obsesionados con tu aesthetic! 🔥 Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Eso es tan aesthetic que hasta los filtros de Instagram están celosos! 💅 Tu respuesta es perfecta. ¡Continuemos!",
  ],
  "El Add to Cart": [
    "¡Amazon debería darte un premio por cliente impulsivo del año! 🛒 Has completado el desafío. ¿Continuamos?",
    "¡Esa compra es tan random que hasta el algoritmo está confundido! 💸 Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Mi carrito de compras se siente aburrido comparado con el tuyo! 🛍️ Tu respuesta es perfecta. ¡Continuemos!",
  ],
  "El Situationship": [
    "¡Esa respuesta tiene más red flags que mi ex! 🚩 Has completado el desafío perfectamente. ¿Listo para seguir?",
    "¡El rey/reina de la ambigüedad emocional! 👑 Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Ni los terapeutas podrían descifrar esa respuesta! 💭 Tu respuesta es perfecta. ¡Continuemos!",
  ],
  "El Soft Launch": [
    "¡Ese soft launch es tan sutil que ni Sherlock Holmes lo descifraría! 🔍 Has completado el desafío. ¿Continuamos?",
    "¡Instagram va a explotar con ese caption tan misterioso! 📱✨ Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Mis seguidores están obsesionados con tu soft launch! 👀 Tu respuesta es perfecta. ¡Continuemos!",
  ],
  "El Rizz Master": [
    "¡Con ese rizz hasta yo caería! 💘 Has completado el desafío perfectamente. ¿Listo para seguir?",
    "¡El CEO del rizz ha hablado! 👑 Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Esa línea debería estar en el manual del rizz! 📚 Tu respuesta es perfecta. ¡Continuemos!",
  ],
  "El Main Character": [
    "¡Netflix quiere comprar los derechos de tu historia! 🎬 Has completado el desafío. ¿Continuamos?",
    "¡El main character energy está fuera de control! ✨ Desafío completado con éxito. ¡Vamos al siguiente paso!",
    "¡Tu vida merece una serie de 10 temporadas! 🍿 Tu respuesta es perfecta. ¡Continuemos!",
  ],
}

export function ContextualChat({ cardType, cardName, challenge, onSubmit }: ContextualChatProps) {
  const [messages, setMessages] = useState<
    Array<{
      id: number
      text: string
      sender: "user" | "other"
      time: string
      status: "sent" | "delivered" | "read"
    }>
  >([])
  const [newMessage, setNewMessage] = useState("")
  const [userMessageCount, setUserMessageCount] = useState(0)
  const [chatCompleted, setChatCompleted] = useState(false)
  const [finalResponse, setFinalResponse] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Máximo de mensajes que el usuario puede enviar
  const MAX_USER_MESSAGES = 1

  // Obtener el contexto adecuado según la carta
  const context = chatContexts[cardName] || {
    name: "Chat",
    avatar: "/placeholder.svg?height=40&width=40",
    initialMessage: "¿Qué quieres compartir?",
    placeholder: "Escribe un mensaje...",
    background: "bg-white",
  }

  // Inicializar el chat con el mensaje inicial
  useEffect(() => {
    setMessages([
      {
        id: 1,
        text: context.initialMessage,
        sender: "other",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      },
    ])
    setUserMessageCount(0)
    setChatCompleted(false)
    setFinalResponse("")
  }, [cardName, context.initialMessage])

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Efecto para enviar automáticamente la respuesta final después de un tiempo
  useEffect(() => {
    if (chatCompleted && finalResponse) {
      const timer = setTimeout(() => {
        console.log("Enviando respuesta final al componente padre:", finalResponse)
        onSubmit(finalResponse)
      }, 3000) // Esperar 3 segundos antes de enviar la respuesta final

      return () => clearTimeout(timer)
    }
  }, [chatCompleted, finalResponse, onSubmit])

  const handleSendMessage = () => {
    if (!newMessage.trim() || chatCompleted) return

    const newMsg = {
      id: messages.length + 1,
      text: newMessage,
      sender: "user" as const,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent" as const,
    }

    setMessages([...messages, newMsg])
    setNewMessage("")

    // Incrementar el contador de mensajes del usuario
    const newCount = userMessageCount + 1
    setUserMessageCount(newCount)

    // Simular una respuesta después de un breve retraso
    setTimeout(() => {
      // Si el usuario ha alcanzado el límite de mensajes, enviar la respuesta final
      if (newCount >= MAX_USER_MESSAGES) {
        const finalResponseText = getFinalResponse(cardName)
        setFinalResponse(newMessage) // Guardar el último mensaje del usuario como respuesta final

        const finalMsg = {
          id: messages.length + 1,
          text: finalResponseText,
          sender: "other" as const,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read" as const,
        }

        setMessages((prevMessages) => [...prevMessages, finalMsg])
        setChatCompleted(true)

        toast({
          title: "Chat completado",
          description: "Tu respuesta ha sido registrada. Continuando automáticamente...",
        })
      } else {
        // Si no ha alcanzado el límite, enviar una respuesta normal
        const responseMsg = {
          id: messages.length + 1,
          text: getRandomResponse(cardName),
          sender: "other" as const,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          status: "read" as const,
        }

        setMessages((prevMessages) => [...prevMessages, responseMsg])
      }
    }, 1000)
  }

  const getRandomResponse = (cardName: string): string => {
    const responses: Record<string, string[]> = {
      "El Delulu": [
        "Wow, eso es tan delulu que hasta yo me sorprendo 😮",
        "Esa teoría es más delulu que mi ex pensando que lo extraño 💅",
        "Delulu is the solulu, pero esto ya es otro nivel 🌈",
      ],
      "El Ghosteador VIP": [
        "Esa excusa es tan creativa que casi te creo... casi 👻",
        "¿En serio? ¿Esa es tu excusa después de 3 meses? 💀",
        "Ghosteador nivel: experto. Al menos eres honesto 🏆",
      ],
      "El Storytoxic": [
        "Esa story merece un Oscar a mejor ficción 🏆",
        "¡OMG! ¿Es el Oxxo de la esquina? ¡Se ve tan aesthetic! ✨",
        "Necesito ese filtro para mis fotos del supermercado 📸",
      ],
      "El Add to Cart": [
        "Esa compra es más random que mi algoritmo de TikTok a las 3 AM 🛒",
        "¿Y lo usaste al menos una vez? Porque yo tengo un cementerio de compras impulsivas 💸",
        "Amazon debería darte un premio por cliente del mes 🏆",
      ],
      "El Situationship": [
        "Eso es tan situationship que hasta duele 💔",
        "¿Entonces somos algo pero nada? Entendido... creo 🚩",
        "Red flag tan grande que parece desfile comunista 🚩🚩🚩",
      ],
      "El Soft Launch": [
        "Ese soft launch es tan sutil que ni yo me di cuenta 👀",
        "Instagram va a explotar con ese caption tan misterioso ✨",
        "¿Quién es? ¿Quién es? ¡Dinos! 📱",
      ],
      "El Rizz Master": [
        "Con ese rizz hasta yo caería 😍",
        "Smooth operator detected 🕶️",
        "¿Esa línea te funcionó? Necesito tomar notas 📝",
      ],
      "El Main Character": [
        "Eres el main character que Netflix necesita 🎬",
        "Quiero la temporada 2 de tu vida, por favor 🍿",
        "Tu soundtrack es perfecto para ese plot twist 🎵",
      ],
    }

    const defaultResponses = ["¡Eso es tan aesthetic! ✨", "Literalmente yo 💅", "No puedo con esto 💀"]

    const cardResponses = responses[cardName] || defaultResponses
    return cardResponses[Math.floor(Math.random() * cardResponses.length)]
  }

  const getFinalResponse = (cardName: string): string => {
    const cardFinalResponses = finalResponses[cardName] || [
      "¡Respuesta perfecta! 🌟 Has completado el desafío. ¡Continuemos!",
      "¡Increíble! ✨ Tu respuesta es justo lo que buscábamos. ¡Vamos al siguiente paso!",
      "¡Excelente trabajo! 🏆 Has completado el desafío con éxito. ¡Sigamos adelante!",
    ]
    return cardFinalResponses[Math.floor(Math.random() * cardFinalResponses.length)]
  }

  const insertSuggestion = (suggestion: string) => {
    setNewMessage(suggestion)
    toast({
      title: "Sugerencia aplicada",
      description: "Puedes editar el texto antes de enviarlo",
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />
      case "delivered":
        return <Check className="h-3 w-3 text-gray-400" />
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />
      default:
        return null
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto overflow-hidden border-0 shadow-lg">
      {/* Chat header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={context.avatar || "/placeholder.svg"} alt={context.name} />
            <AvatarFallback className="bg-pink-300 text-pink-800">{context.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-white">{context.name}</h3>
            <p className="text-xs text-white/70">Desafío: {challenge.substring(0, 30)}...</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-white bg-white/20 px-2 py-1 rounded-full">
            {userMessageCount}/{MAX_USER_MESSAGES} mensajes
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <HelpCircle className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Sugerencias de AI</h4>
                <p className="text-sm text-gray-500">¿No sabes qué escribir? Prueba estas ideas:</p>
                <div className="space-y-2 mt-2">
                  {(aiSuggestions[cardName] || []).map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto py-2 px-3 text-left"
                      onClick={() => insertSuggestion(suggestion)}
                    >
                      <span className="truncate">{suggestion}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Chat messages */}
      <CardContent className="p-0">
        <div className={`${context.background} min-h-[350px] p-4 flex flex-col gap-3 overflow-y-auto max-h-[350px]`}>
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  message.sender === "user"
                    ? "bg-purple-100 text-purple-900 rounded-tr-none"
                    : "bg-white text-gray-800 rounded-tl-none"
                }`}
              >
                <p className="break-words">{message.text}</p>
                <div className="flex justify-end items-center gap-1 mt-1">
                  <span className="text-xs text-gray-500">{message.time}</span>
                  {message.sender === "user" && getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))}
          {chatCompleted && (
            <div className="flex justify-center my-2">
              <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                <Lock className="h-3 w-3 mr-1" /> Chat completado - Continuando automáticamente...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-2 bg-gray-50 border-t flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-gray-500" disabled={chatCompleted}>
            <Paperclip className="h-5 w-5" />
          </Button>
          <Input
            placeholder={chatCompleted ? "Chat completado..." : context.placeholder}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
            disabled={chatCompleted}
          />
          <Button variant="ghost" size="icon" className="text-gray-500" disabled={chatCompleted}>
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-500" disabled={chatCompleted}>
            <Mic className="h-5 w-5" />
          </Button>
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || chatCompleted}
            size="icon"
            className={`${chatCompleted ? "bg-gray-300 text-gray-500" : "bg-pink-500 hover:bg-pink-600 text-white"}`}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, MessageCircle, Facebook, Twitter, Instagram, Copy, Check, Smartphone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ShareButtonsProps {
  url: string
  title: string
  message: string
}

export function ShareButtons({ url, title, message }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // Función para usar la Web Share API
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: message,
          url,
        })
        toast({
          title: "Compartido",
          description: "Contenido compartido exitosamente",
        })
      } catch (error) {
        console.error("Error al compartir:", error)
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      copyToClipboard(url)
    }
  }

  // Función para copiar al portapapeles
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({
      title: "Copiado",
      description: "Enlace copiado al portapapeles",
    })
  }

  // Función para compartir en WhatsApp
  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`
    window.open(whatsappUrl, "_blank")
  }

  // Función para compartir en Facebook
  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`
    window.open(facebookUrl, "_blank")
  }

  // Función para compartir en Twitter
  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, "_blank")
  }

  // Función para compartir en Instagram (nota: Instagram no tiene API de compartir directa)
  const shareOnInstagram = () => {
    // Crear un mensaje combinado que incluya tanto el texto como la URL
    const combinedMessage = `${message} ${url}`
    copyToClipboard(combinedMessage)

    // Mostrar instrucciones más claras
    toast({
      title: "Listo para subir a tu finsta",
      description:
        "Mensaje copiado al portapapeles. Abre Instagram, crea una nueva publicación o historia y pega el texto.",
    })

    // Intentar abrir Instagram si es posible
    try {
      // En móviles, intentar abrir la app de Instagram
      if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = "instagram://"

        // Dar tiempo para que se abra Instagram y luego mostrar otro toast
        setTimeout(() => {
          toast({
            title: "¡Pega el texto en Instagram!",
            description: "Crea una nueva publicación o historia y pega el texto que copiamos.",
          })
        }, 1500)
      }
    } catch (error) {
      console.error("Error al intentar abrir Instagram:", error)
    }
  }

  // Función para compartir por SMS
  const shareViaSMS = () => {
    const smsUrl = `sms:?body=${encodeURIComponent(`${message} ${url}`)}`
    window.location.href = smsUrl
  }

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {/* Botón de compartir general (usa Web Share API) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        className="bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200"
      >
        <Share2 className="mr-2 h-4 w-4" />
        Compartir
      </Button>

      {/* WhatsApp */}
      <Button
        variant="outline"
        size="sm"
        onClick={shareOnWhatsApp}
        className="bg-green-100 hover:bg-green-200 text-green-700"
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        WhatsApp
      </Button>

      {/* Facebook */}
      <Button
        variant="outline"
        size="sm"
        onClick={shareOnFacebook}
        className="bg-blue-100 hover:bg-blue-200 text-blue-700"
      >
        <Facebook className="mr-2 h-4 w-4" />
        Facebook
      </Button>

      {/* Twitter */}
      <Button variant="outline" size="sm" onClick={shareOnTwitter} className="bg-sky-100 hover:bg-sky-200 text-sky-700">
        <Twitter className="mr-2 h-4 w-4" />
        Twitter
      </Button>

      {/* Instagram */}
      <Button
        variant="outline"
        size="sm"
        onClick={shareOnInstagram}
        className="bg-purple-100 hover:bg-purple-200 text-purple-700"
      >
        <Instagram className="mr-2 h-4 w-4" />
        Subir a finsta
      </Button>

      {/* SMS */}
      <Button
        variant="outline"
        size="sm"
        onClick={shareViaSMS}
        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
      >
        <Smartphone className="mr-2 h-4 w-4" />
        SMS
      </Button>

      {/* Copiar enlace */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(url)}
        className="bg-gray-100 hover:bg-gray-200"
      >
        {copied ? (
          <>
            <Check className="mr-2 h-4 w-4 text-green-500" />
            Copiado
          </>
        ) : (
          <>
            <Copy className="mr-2 h-4 w-4" />
            Copiar enlace
          </>
        )}
      </Button>
    </div>
  )
}

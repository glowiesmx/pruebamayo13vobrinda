"use client"

import { useState, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mic, StopCircle, Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ResponseInputProps {
  onSubmit: (text: string, audio: Blob | null) => void
  loading: boolean
}

export function ResponseInput({ onSubmit, loading }: ResponseInputProps) {
  const [text, setText] = useState<string>("")
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<BlobPart[]>([])
  const { toast } = useToast()

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

  const handleSubmit = () => {
    if ((!text || text.trim() === "") && !audioBlob) {
      toast({
        title: "Error",
        description: "Debes escribir una respuesta o grabar un audio.",
        variant: "destructive",
      })
      return
    }

    onSubmit(text, audioBlob)
  }

  return (
    <Card className="w-full border-dashed border-pink-400 border-2 bg-white/90">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Tu respuesta ✨aesthetic✨</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Subir a mi ✨insta✨
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

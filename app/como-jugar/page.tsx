"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Users, MessageSquare, Vote, Trophy, ArrowLeft } from "lucide-react"

export default function ComoJugarPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-400 to-teal-400 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" className="mb-6 bg-white/80 hover:bg-white" onClick={() => router.push("/")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al juego
        </Button>

        <Card className="mb-6 border-dashed border-pink-400 border-2 bg-white/90">
          <CardHeader>
            <CardTitle className="text-2xl sm:text-3xl text-center">Cómo jugar a Brinda</CardTitle>
            <CardDescription className="text-center text-base">
              Guía completa para jugar 100 Borrachxs Dijieron: Edición Delulu
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="bg-pink-100 p-3 rounded-full">
                  <Users className="h-6 w-6 text-pink-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">1. Crea una mesa de juego</h3>
                  <p className="text-gray-600">
                    Cuando inicias el juego, se crea automáticamente una "mesa" con un ID único. Este ID es lo que
                    permite a otros jugadores unirse a tu partida.
                  </p>
                  <div className="mt-2 bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Tip:</strong> Comparte el ID de tu mesa con tus amigos para que puedan unirse a tu partida
                      desde sus dispositivos.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">2. Responde a los desafíos</h3>
                  <p className="text-gray-600">
                    Selecciona una carta y responde al desafío. Puedes usar el chat para interactuar con un personaje
                    relacionado con la carta, o responder directamente.
                  </p>
                  <div className="mt-2 bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Nota:</strong> En el chat, solo puedes enviar hasta 2 mensajes. Después, el chat se
                      completará automáticamente y tu última respuesta se guardará.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-green-100 p-3 rounded-full">
                  <Vote className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">3. Sistema de votación</h3>
                  <p className="text-gray-600">
                    Después de responder, los demás jugadores en tu mesa pueden votar tu respuesta. Las votaciones
                    determinan quién gana cada ronda.
                  </p>
                  <div className="mt-2 bg-pink-50 p-3 rounded-lg">
                    <p className="text-sm text-pink-800">
                      <strong>Cómo funciona:</strong> Cada jugador en la mesa puede ver las respuestas de los demás y
                      votar usando los botones de "Me gusta" o "No me gusta". Los votos se contabilizan en tiempo real.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-orange-100 p-3 rounded-full">
                  <Trophy className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-medium mb-2">4. Recompensas y puntuación</h3>
                  <p className="text-gray-600">
                    Basado en los votos, recibirás recompensas digitales como playlists, filtros o PDFs temáticos. ¡Las
                    respuestas más creativas obtienen las mejores recompensas!
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-pink-100 to-purple-100 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">¿Cómo se unen otros jugadores a mi mesa?</h3>
              <p className="text-gray-700 mb-3">Para que otros jugadores se unan a tu mesa, deben:</p>
              <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                <li>Acceder a la aplicación desde su dispositivo</li>
                <li>Hacer clic en "Unirse a una mesa" en la pantalla principal</li>
                <li>Introducir el ID de tu mesa (visible en la parte superior de tu pantalla)</li>
                <li>Una vez unidos, podrán ver tus respuestas y votar por ellas</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed border-pink-400 border-2 bg-white/90">
          <CardHeader>
            <CardTitle className="text-xl">Preguntas frecuentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium mb-1">¿Cómo veo las respuestas de otros jugadores?</h3>
              <p className="text-gray-600 text-sm">
                En la sección de votación, podrás ver las respuestas de todos los jugadores en tu mesa. Selecciona una
                respuesta para verla en detalle y votar.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">¿Puedo jugar solo?</h3>
              <p className="text-gray-600 text-sm">
                ¡Sí! Puedes jugar solo y disfrutar de los desafíos y recompensas. Sin embargo, la experiencia es más
                divertida con amigos que puedan votar tus respuestas.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">¿Cómo funcionan los diferentes tipos de cartas?</h3>
              <p className="text-gray-600 text-sm">
                <strong>Individual:</strong> Solo tú respondes al desafío.
                <br />
                <strong>Dueto:</strong> Tú y otro jugador colaboran en la respuesta.
                <br />
                <strong>Grupal:</strong> Todos los jugadores responden al mismo desafío y compiten entre sí.
              </p>
            </div>

            <div>
              <h3 className="font-medium mb-1">¿Las recompensas son reales?</h3>
              <p className="text-gray-600 text-sm">
                Las recompensas son contenido digital temático como playlists, filtros o PDFs. Puedes acceder a ellas
                después de completar los desafíos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

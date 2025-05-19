"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShareButtons } from "./share-buttons"
import {
  Music,
  ImageIcon,
  FileText,
  Award,
  Star,
  Sparkles,
  Trophy,
  Crown,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

interface RewardDisplayProps {
  reward: {
    resultado: string
    recompensas: Array<{
      tipo: string
      nombre: string
      descripcion: string
      url?: string
      nivel?: number
      imagen_url?: string
    }>
    analisis?: {
      creatividad: number
      humor: number
      autenticidad: number
      viral: number
      categoria: string
    }
  }
  onReset: () => void
}

export function RewardDisplay({ reward, onReset }: RewardDisplayProps) {
  const [showAnalisis, setShowAnalisis] = useState(false)

  if (!reward) {
    return null
  }

  const getIconForRewardType = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "playlist":
        return <Music className="h-5 w-5 text-green-500" />
      case "filtro":
        return <ImageIcon className="h-5 w-5 text-purple-500" />
      case "pdf":
        return <FileText className="h-5 w-5 text-blue-500" />
      case "sticker":
        return <ImageIcon className="h-5 w-5 text-yellow-500" />
      case "meme":
        return <ImageIcon className="h-5 w-5 text-pink-500" />
      case "fondo":
        return <ImageIcon className="h-5 w-5 text-indigo-500" />
      default:
        return <Award className="h-5 w-5 text-amber-500" />
    }
  }

  const getNivelBadge = (nivel?: number) => {
    if (!nivel) return null

    switch (nivel) {
      case 1:
        return (
          <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-800">
            <Star className="h-3 w-3 mr-1 text-gray-500" /> Común
          </Badge>
        )
      case 2:
        return (
          <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800">
            <Sparkles className="h-3 w-3 mr-1 text-blue-500" /> Raro
          </Badge>
        )
      case 3:
        return (
          <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-800">
            <Trophy className="h-3 w-3 mr-1 text-purple-500" /> Épico
          </Badge>
        )
      case 4:
        return (
          <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800">
            <Crown className="h-3 w-3 mr-1 text-amber-500" /> Legendario
          </Badge>
        )
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-pink-600 mb-2">¡Recompensa desbloqueada!</h2>
          <p className="text-lg">{reward.resultado}</p>
        </div>

        {reward.analisis && (
          <div className="mt-4 mb-4">
            <Button
              variant="outline"
              onClick={() => setShowAnalisis(!showAnalisis)}
              className="w-full flex items-center justify-center gap-2 text-sm"
            >
              <BarChart2 className="h-4 w-4" />
              {showAnalisis ? "Ocultar análisis" : "Ver análisis de tu respuesta"}
              {showAnalisis ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {showAnalisis && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <h3 className="font-medium mb-3 text-center">
                  Análisis de tu respuesta
                  <Badge className="ml-2 bg-pink-100 text-pink-800">{reward.analisis.categoria}</Badge>
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Creatividad</span>
                      <span>{reward.analisis.creatividad}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${reward.analisis.creatividad}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Humor</span>
                      <span>{reward.analisis.humor}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${reward.analisis.humor}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Autenticidad</span>
                      <span>{reward.analisis.autenticidad}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full"
                        style={{ width: `${reward.analisis.autenticidad}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Potencial viral</span>
                      <span>{reward.analisis.viral}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-pink-500 h-2 rounded-full"
                        style={{ width: `${reward.analisis.viral}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4 mt-6">
          {reward.recompensas.map((recompensa, index) => (
            <div
              key={index}
              className="bg-white p-4 rounded-lg border border-pink-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start">
                <div className="p-2 bg-pink-50 rounded-full mr-3">{getIconForRewardType(recompensa.tipo)}</div>
                <div className="flex-1">
                  <div className="flex items-center">
                    <h3 className="font-medium">{recompensa.nombre}</h3>
                    {getNivelBadge(recompensa.nivel)}
                  </div>
                  <p className="text-gray-600 text-sm mt-1">{recompensa.descripcion}</p>

                  {recompensa.url && (
                    <div className="mt-2">
                      <a
                        href={recompensa.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-pink-600 hover:text-pink-800 inline-flex items-center"
                      >
                        Ver{" "}
                        {recompensa.tipo === "playlist"
                          ? "playlist"
                          : recompensa.tipo === "filtro"
                            ? "filtro"
                            : "contenido"}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 ml-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Button onClick={onReset} className="w-full bg-pink-600 hover:bg-pink-700 text-white">
            Jugar otra ronda
          </Button>

          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <p className="text-sm text-center mb-2">Comparte tu recompensa</p>
            <ShareButtons
              url={window.location.href}
              title="¡Mira la recompensa que obtuve en Brinda!"
              message={`¡Acabo de ganar "${reward.recompensas[0]?.descripcion}"! ${reward.resultado} #BrindaApp #GenZ`}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}

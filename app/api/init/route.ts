import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Verificar si hay cartas en la base de datos
    const { data: existingCards, error: countError } = await supabase.from("cartas_genz").select("id")

    if (countError) {
      throw countError
    }

    // Si no hay cartas, insertar las predeterminadas
    if (!existingCards || existingCards.length === 0) {
      const defaultCards = [
        {
          nombre: "El Delulu",
          descripcion: "Confiesa tu teoría más 'delulu' que creíste borracho/a",
          variables: { hashtag: "#DeluluIsTheSolulu", emoji: "🌈" },
          tipo: "individual",
        },
        {
          nombre: "El Ghosteador VIP",
          descripcion: "Recrea el mensaje que enviaste a las 3 AM y luego borraste",
          variables: { formato: "audio de WhatsApp temblando" },
          tipo: "dueto",
        },
        {
          nombre: "El Storytoxic",
          descripcion: "Crea una story fingiendo que estás en un viaje épico... pero es el Oxxo de tu colonia",
          variables: { filtro: "Golden Hour Falso" },
          tipo: "grupal",
        },
        {
          nombre: "El Add to Cart",
          descripcion: "Confiesa la compra más random que hiciste ebrio/a en Amazon",
          variables: { emoji: "🛒🔥" },
          tipo: "individual",
        },
      ]

      const { error: insertError } = await supabase.from("cartas_genz").insert(defaultCards)

      if (insertError) {
        throw insertError
      }

      return NextResponse.json({
        message: "Cartas predeterminadas insertadas correctamente",
        success: true,
      })
    }

    // Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw listError
    }

    const responsesBucketExists = buckets?.some((bucket) => bucket.name === "responses")

    if (!responsesBucketExists) {
      // Crear el bucket si no existe
      const { error } = await supabase.storage.createBucket("responses", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        throw error
      }
    }

    return NextResponse.json({
      message: "Aplicación inicializada correctamente",
      cardsExist: existingCards.length > 0,
      bucketExists: responsesBucketExists,
      success: true,
    })
  } catch (error) {
    console.error("Error al inicializar la aplicación:", error)
    return NextResponse.json(
      {
        error: "Error al inicializar la aplicación",
        details: error,
        success: false,
      },
      { status: 500 },
    )
  }
}

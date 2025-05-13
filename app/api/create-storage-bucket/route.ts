import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET() {
  try {
    // Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      throw listError
    }

    const responsesBucketExists = buckets?.some((bucket) => bucket.name === "responses")

    if (!responsesBucketExists) {
      // Crear el bucket si no existe
      const { data, error } = await supabase.storage.createBucket("responses", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        throw error
      }

      // Configurar políticas de acceso público
      const { error: policyError } = await supabase.storage.from("responses").createSignedUrl("dummy.txt", 1)

      if (policyError && !policyError.message.includes("not found")) {
        console.error("Error al configurar políticas:", policyError)
      }

      return NextResponse.json({
        message: "Bucket 'responses' creado correctamente",
        success: true,
      })
    }

    return NextResponse.json({
      message: "El bucket 'responses' ya existe",
      success: true,
    })
  } catch (error) {
    console.error("Error al crear bucket:", error)
    return NextResponse.json(
      {
        error: "Error al crear bucket de almacenamiento",
        success: false,
      },
      { status: 500 },
    )
  }
}

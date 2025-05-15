import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function ensureStorageBucket(bucketName = "responses") {
  try {
    // Verificar si el bucket ya existe
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error("Error al listar buckets:", listError)
      return false
    }

    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      // Crear el bucket si no existe
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      })

      if (error) {
        console.error("Error al crear bucket:", error)
        return false
      }

      console.log(`Bucket '${bucketName}' creado correctamente`)
      return true
    }

    console.log(`El bucket '${bucketName}' ya existe`)
    return true
  } catch (error) {
    console.error("Error al verificar/crear bucket:", error)
    return false
  }
}

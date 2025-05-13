import { createClient } from "@supabase/supabase-js"

// Crear un singleton para el cliente de Supabase
let supabaseClient: ReturnType<typeof createClient> | null = null

export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

// Cliente para el servidor (con clave de servicio)
export function getServerSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ""

  return createClient(supabaseUrl, supabaseKey)
}

import { createClient } from "@supabase/supabase-js"

// Inicializar Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

interface AnalisisRespuesta {
  puntuacion_creatividad: number
  puntuacion_humor: number
  puntuacion_autenticidad: number
  puntuacion_viral: number
  tono: string[]
  temas: string[]
  palabras_clave: string[]
  analisis_completo: any
}

export async function obtenerRecompensasPersonalizadas(analisis: AnalisisRespuesta, cartaNombre: string) {
  try {
    // Verificar si el análisis es válido
    if (!analisis || typeof analisis !== "object") {
      console.error("Análisis inválido:", analisis)
      return generarRecompensasAleatorias()
    }

    // Obtener la categoría principal del análisis con manejo de errores
    let categoriaPrincipal = "Humor" // Valor predeterminado
    try {
      if (analisis.analisis_completo && analisis.analisis_completo.categoria_principal) {
        categoriaPrincipal = analisis.analisis_completo.categoria_principal
      }
    } catch (error) {
      console.error("Error al obtener categoría principal:", error)
      // Continuar con el valor predeterminado
    }

    console.log("Buscando recompensas para categoría:", categoriaPrincipal)

    // Buscar el ID de la categoría
    const { data: categorias, error: errorCategoria } = await supabase
      .from("categorias_recompensas")
      .select("id")
      .eq("nombre", categoriaPrincipal)
      .limit(1)

    if (errorCategoria) {
      console.error("Error al obtener categoría:", errorCategoria)
      return generarRecompensasAleatorias()
    }

    if (!categorias || categorias.length === 0) {
      console.log("No se encontró la categoría:", categoriaPrincipal)
      // Intentar obtener cualquier categoría
      const { data: todasCategorias, error: errorTodasCategorias } = await supabase
        .from("categorias_recompensas")
        .select("id")
        .limit(1)

      if (errorTodasCategorias || !todasCategorias || todasCategorias.length === 0) {
        console.error("No se encontraron categorías:", errorTodasCategorias)
        return generarRecompensasAleatorias()
      }

      // Usar la primera categoría disponible
      const categoriaId = todasCategorias[0].id
      console.log("Usando categoría alternativa con ID:", categoriaId)

      // Obtener recompensas aleatorias de cualquier categoría
      const { data: recompensasAleatorias, error: errorRecompensasAleatorias } = await supabase
        .from("recompensas_personalizadas")
        .select("*")
        .limit(10)

      if (errorRecompensasAleatorias || !recompensasAleatorias || recompensasAleatorias.length === 0) {
        console.error("Error al obtener recompensas aleatorias:", errorRecompensasAleatorias)
        return generarRecompensasAleatorias()
      }

      // Seleccionar 3 recompensas aleatorias
      const recompensasSeleccionadas = seleccionarRecompensasAleatorias(recompensasAleatorias, 3)

      return recompensasSeleccionadas.map((recompensa) => ({
        tipo: recompensa.tipo || "playlist",
        nombre: recompensa.nombre || "Recompensa",
        descripcion: recompensa.descripcion || "Descripción de la recompensa",
        url: recompensa.url || "",
        nivel: recompensa.nivel || 1,
        imagen_url: recompensa.imagen_url || "",
      }))
    }

    const categoriaId = categorias[0].id
    console.log("Categoría encontrada con ID:", categoriaId)

    // Buscar recompensas personalizadas basadas en la categoría
    // Simplificamos la consulta para evitar errores
    const { data: recompensas, error } = await supabase.from("recompensas_personalizadas").select("*").limit(10)

    if (error) {
      console.error("Error al obtener recompensas personalizadas:", error)
      return generarRecompensasAleatorias()
    }

    if (!recompensas || recompensas.length === 0) {
      console.log("No se encontraron recompensas personalizadas")
      return generarRecompensasAleatorias()
    }

    console.log(`Se encontraron ${recompensas.length} recompensas personalizadas`)

    // Filtrar recompensas por categoría (hacemos el filtrado en memoria para evitar errores en la consulta)
    let recompensasFiltradas = recompensas.filter((r) => r.categoria_id === categoriaId)

    // Si no hay recompensas para esta categoría, usar todas las disponibles
    if (recompensasFiltradas.length === 0) {
      console.log("No hay recompensas para esta categoría, usando todas las disponibles")
      recompensasFiltradas = recompensas
    }

    // Seleccionar 3 recompensas aleatorias de las obtenidas
    const recompensasSeleccionadas = seleccionarRecompensasAleatorias(recompensasFiltradas, 3)

    return recompensasSeleccionadas.map((recompensa) => ({
      tipo: recompensa.tipo || "playlist",
      nombre: recompensa.nombre || "Recompensa",
      descripcion: recompensa.descripcion || "Descripción de la recompensa",
      url: recompensa.url || "",
      nivel: recompensa.nivel || 1,
      imagen_url: recompensa.imagen_url || "",
    }))
  } catch (error) {
    console.error("Error detallado al obtener recompensas personalizadas:", error)
    return generarRecompensasAleatorias()
  }
}

function seleccionarRecompensasAleatorias(recompensas: any[], cantidad: number) {
  // Si hay menos recompensas que la cantidad solicitada, devolver todas
  if (!recompensas || recompensas.length === 0) {
    return []
  }

  if (recompensas.length <= cantidad) {
    return recompensas
  }

  // Mezclar el array de recompensas
  const recompensasMezcladas = [...recompensas].sort(() => Math.random() - 0.5)

  // Devolver la cantidad solicitada
  return recompensasMezcladas.slice(0, cantidad)
}

function generarRecompensasAleatorias() {
  const playlists = [
    "Canciones para llorar en el Oxxo mientras stalkeas a tu ex",
    "Éxitos para fingir que superaste tu tusa",
    "Lo que escuchas cuando te ghostean por 5ta vez",
    "Soundtrack para tu era villain después de un situationship",
    "Canciones para fingir que estás en Tulum pero estás en tu cuarto",
  ]

  const filtros = [
    "Golden Hour Falso para tus stories de peda casera",
    "Filtro 'Soy un catch pero estoy traumado/a'",
    "Aesthetic Oxxo: Haz que cualquier tienda parezca Tulum",
    "Filtro 'Me ghostearon pero estoy mejor que nunca'",
    "Preset 'Soft Launch de relación que durará 2 semanas'",
  ]

  const pdfs = [
    "Cómo fingir viajes en el Oxxo: Guía para millennials quebrados",
    "10 captions para fotos de perfil que gritan 'Soy un catch pero estoy traumado/a'",
    "Guía de Ghosteo Épico: Técnicas avanzadas",
    "Manual del Situationship: Cómo estar en una relación sin compromiso",
    "Diccionario Gen Z: Para que no te digan Cheugy en 2023",
  ]

  return [
    {
      tipo: "playlist",
      nombre: "Playlist Spotify",
      descripcion: playlists[Math.floor(Math.random() * playlists.length)],
      nivel: 1,
    },
    {
      tipo: "filtro",
      nombre: "Filtro Instagram",
      descripcion: filtros[Math.floor(Math.random() * filtros.length)],
      nivel: 1,
    },
    {
      tipo: "pdf",
      nombre: "PDF Exclusivo",
      descripcion: pdfs[Math.floor(Math.random() * pdfs.length)],
      nivel: 1,
    },
  ]
}

export async function guardarRecompensaUsuario(
  usuarioId: string,
  recompensaId: number,
  respuestaId: number,
  mesaId: string,
  feedback: string,
) {
  try {
    const { data, error } = await supabase
      .from("recompensas_usuarios")
      .insert({
        usuario_id: usuarioId,
        recompensa_id: recompensaId,
        respuesta_id: respuestaId,
        mesa_id: mesaId,
        feedback: feedback,
      })
      .select()

    if (error) {
      console.error("Error al guardar recompensa de usuario:", error)
      return null
    }

    return data[0]
  } catch (error) {
    console.error("Error al guardar recompensa de usuario:", error)
    return null
  }
}

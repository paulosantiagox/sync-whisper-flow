import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Credenciais do Supabase PESSOAL do usuário (onde estão os dados)
const PERSONAL_SUPABASE_URL = 'https://dfrfeirfllwmdkenylwk.supabase.co'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Usa a service key do Supabase pessoal
    const personalServiceKey = Deno.env.get('PERSONAL_SUPABASE_SERVICE_KEY') ?? ''
    
    console.log('[AUTO_UPDATE] Iniciando verificação -', new Date().toISOString())
    console.log('[AUTO_UPDATE] Service Key presente:', !!personalServiceKey)
    console.log('[AUTO_UPDATE] Service Key length:', personalServiceKey?.length || 0)
    console.log('[AUTO_UPDATE] Primeiros 30 chars:', personalServiceKey?.substring(0, 30) + '...')
    
    if (!personalServiceKey) {
      console.error('[AUTO_UPDATE] PERSONAL_SUPABASE_SERVICE_KEY não configurada!')
      return new Response(
        JSON.stringify({ success: false, error: 'Service key não configurada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    const supabase = createClient(PERSONAL_SUPABASE_URL, personalServiceKey, {
      auth: { persistSession: false }
    })

    // Obter hora atual em Brasília (UTC-3)
    const now = new Date()
    const brasiliaFormatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
    const brasiliaTime = brasiliaFormatter.format(now)
    const [currentHour, currentMinute] = brasiliaTime.split(':').map(Number)
    const currentTotalMinutes = currentHour * 60 + currentMinute

    console.log(`[AUTO_UPDATE] Hora de Brasília: ${brasiliaTime}`)

    // Busca todos os schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('project_update_schedules')
      .select('*')

    if (scheduleError) {
      console.error('[AUTO_UPDATE] Erro ao buscar schedules:', scheduleError)
      return new Response(
        JSON.stringify({ success: false, error: scheduleError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log(`[AUTO_UPDATE] Schedules encontrados: ${schedules?.length || 0}`)
    console.log('[AUTO_UPDATE] Dados brutos:', JSON.stringify(schedules))

    // Filtra schedules que estão dentro da janela de 2 minutos
    const matchingSchedules = (schedules || []).filter(s => {
      const [h, m] = s.time.split(':').map(Number)
      const scheduledMinutes = h * 60 + m
      const diff = Math.abs(scheduledMinutes - currentTotalMinutes)
      return diff <= 2
    })

    const projectIds = [...new Set(matchingSchedules.map(s => s.project_id))]
    
    console.log(`[AUTO_UPDATE] Schedules que correspondem à hora atual: ${matchingSchedules.length}`)
    console.log(`[AUTO_UPDATE] Projetos para atualizar: ${projectIds.length}`)

    let totalUpdated = 0
    let totalErrors = 0

    // Processar cada projeto
    for (const projectId of projectIds) {
      console.log(`[AUTO_UPDATE] Processando projeto: ${projectId}`)

      // Busca business managers do projeto
      const { data: bms, error: bmsError } = await supabase
        .from('business_managers')
        .select('id, access_token')
        .eq('project_id', projectId)

      if (bmsError) {
        console.error(`[AUTO_UPDATE] Erro ao buscar BMs do projeto ${projectId}:`, bmsError)
        totalErrors++
        continue
      }

      console.log(`[AUTO_UPDATE] BMs encontrados: ${bms?.length || 0}`)

      // Para cada BM, buscar números ativos
      for (const bm of bms || []) {
        const { data: numbers, error: numbersError } = await supabase
          .from('whatsapp_numbers')
          .select('*')
          .eq('bm_id', bm.id)
          .eq('is_active', true)

        if (numbersError) {
          console.error(`[AUTO_UPDATE] Erro ao buscar números do BM ${bm.id}:`, numbersError)
          totalErrors++
          continue
        }

        console.log(`[AUTO_UPDATE] Números encontrados no BM ${bm.id}: ${numbers?.length || 0}`)

        // Atualizar cada número
        for (const num of numbers || []) {
          try {
            // Chamar API do Meta
            const metaUrl = `https://graph.facebook.com/v21.0/${num.phone_number_id}?fields=quality_rating,messaging_limit_tier,verified_name,display_phone_number&access_token=${bm.access_token}`
            const metaResponse = await fetch(metaUrl)
            const metaData = await metaResponse.json()

            if (metaData.error) {
              console.error(`[AUTO_UPDATE] Erro Meta para ${num.phone_number_id}:`, metaData.error.message)
              totalErrors++
              continue
            }

            const newQuality = mapQuality(metaData.quality_rating)
            const newLimit = mapLimit(metaData.messaging_limit_tier)

            // Verificar se mudou
            const qualityChanged = num.quality_rating !== newQuality
            const limitChanged = num.messaging_limit !== newLimit
            const hasChanged = qualityChanged || limitChanged

            console.log(`[AUTO_UPDATE] Número ${num.display_phone_number}: ${num.quality_rating} -> ${newQuality}, mudou: ${hasChanged}`)

            // Atualizar número
            const { error: updateError } = await supabase
              .from('whatsapp_numbers')
              .update({
                quality_rating: newQuality,
                messaging_limit: newLimit,
                verified_name: metaData.verified_name || num.verified_name,
                display_phone_number: metaData.display_phone_number || num.display_phone_number,
                last_checked_at: new Date().toISOString(),
              })
              .eq('id', num.id)

            if (updateError) {
              console.error(`[AUTO_UPDATE] Erro ao atualizar ${num.id}:`, updateError)
              totalErrors++
              continue
            }

            // Registrar no histórico
            await supabase.from('status_history').insert({
              phone_number_id: num.id,
              quality_rating: newQuality,
              messaging_limit: newLimit,
              is_automatic: true,
              observation: hasChanged 
                ? `Status alterado de ${num.quality_rating} para ${newQuality} (automático)` 
                : 'Verificação automática',
            })

            // Se mudou, registrar notificação
            if (hasChanged) {
              const qualityValue: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
              const direction = qualityValue[newQuality] > qualityValue[num.quality_rating] ? 'up' : 'down'

              await supabase.from('status_change_notifications').insert({
                phone_number_id: num.id,
                project_id: projectId,
                previous_quality: num.quality_rating,
                new_quality: newQuality,
                direction: direction,
                is_automatic: true,
              })
              console.log(`[AUTO_UPDATE] Mudança detectada em ${num.display_phone_number}: ${num.quality_rating} -> ${newQuality}`)
            }

            totalUpdated++
          } catch (err) {
            console.error(`[AUTO_UPDATE] Erro inesperado para ${num.id}:`, err)
            totalErrors++
          }
        }
      }
    }

    // Registrar execução na tabela de logs
    try {
      await supabase.from('auto_update_logs').insert({
        executed_at: new Date().toISOString(),
        brasilia_time: brasiliaTime,
        schedules_found: matchingSchedules.length,
        projects_checked: projectIds.length,
        numbers_updated: totalUpdated,
        errors: totalErrors,
      })
      console.log('[AUTO_UPDATE] Log de execução registrado')
    } catch (logError) {
      console.log('[AUTO_UPDATE] Tabela auto_update_logs não existe ainda (ok)')
    }

    console.log(`[AUTO_UPDATE] Finalizado - ${totalUpdated} atualizados, ${totalErrors} erros`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        brasiliaTime,
        schedulesFound: matchingSchedules.length,
        projectsChecked: projectIds.length,
        numbersUpdated: totalUpdated,
        errors: totalErrors
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    console.error('[AUTO_UPDATE] Erro geral:', error)
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function mapQuality(q: string): string {
  const map: Record<string, string> = { GREEN: 'HIGH', YELLOW: 'MEDIUM', RED: 'LOW', UNKNOWN: 'UNKNOWN' }
  return map[q] || q || 'UNKNOWN'
}

function mapLimit(t: string): string {
  const map: Record<string, string> = {
    TIER_1K: '1000', 
    TIER_10K: '10000', 
    TIER_100K: '100000', 
    TIER_UNLIMITED: 'UNLIMITED',
    TIER_NOT_SET: 'NOT_SET'
  }
  return map[t] || t || 'NOT_SET'
}

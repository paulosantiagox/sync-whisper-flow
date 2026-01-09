import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()
    const currentTotalMinutes = currentHour * 60 + currentMinute

    console.log(`[AUTO_UPDATE] Iniciando verificação - ${now.toISOString()}`)
    console.log(`[AUTO_UPDATE] Hora atual: ${currentHour}:${currentMinute.toString().padStart(2, '0')}`)

    // Busca todos os schedules
    const { data: schedules, error: scheduleError } = await supabase
      .from('project_update_schedules')
      .select('project_id, time')

    if (scheduleError) {
      console.error('[AUTO_UPDATE] Erro ao buscar schedules:', scheduleError)
      throw scheduleError
    }

    console.log(`[AUTO_UPDATE] Schedules encontrados: ${schedules?.length || 0}`)

    // Filtra schedules que estão dentro da janela de 2 minutos
    const matchingSchedules = schedules?.filter(s => {
      const [h, m] = s.time.split(':').map(Number)
      const scheduledMinutes = h * 60 + m
      const diff = Math.abs(scheduledMinutes - currentTotalMinutes)
      return diff <= 2
    }) || []

    const projectIds = [...new Set(matchingSchedules.map(s => s.project_id))]
    
    console.log(`[AUTO_UPDATE] Projetos para atualizar: ${projectIds.length}`)

    if (projectIds.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum projeto agendado para este horário',
          projectsChecked: 0,
          numbersUpdated: 0 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalUpdated = 0
    let totalErrors = 0

    for (const projectId of projectIds) {
      console.log(`[AUTO_UPDATE] Processando projeto: ${projectId}`)

      // Busca business managers do projeto
      const { data: bms, error: bmsError } = await supabase
        .from('business_managers')
        .select('*')
        .eq('project_id', projectId)

      if (bmsError) {
        console.error(`[AUTO_UPDATE] Erro ao buscar BMs do projeto ${projectId}:`, bmsError)
        continue
      }

      // Busca números do projeto
      const { data: numbers, error: numbersError } = await supabase
        .from('whatsapp_numbers')
        .select('*')
        .eq('project_id', projectId)
        .eq('isActive', true)

      if (numbersError) {
        console.error(`[AUTO_UPDATE] Erro ao buscar números do projeto ${projectId}:`, numbersError)
        continue
      }

      console.log(`[AUTO_UPDATE] Números encontrados: ${numbers?.length || 0}`)

      for (const number of numbers || []) {
        const bm = bms?.find(b => b.id === number.business_manager_id)
        if (!bm || !bm.access_token || !number.phone_number_id) {
          console.log(`[AUTO_UPDATE] Número ${number.id} sem BM ou token válido`)
          continue
        }

        try {
          // Chama API do Meta
          const metaResponse = await fetch(
            `https://graph.facebook.com/v18.0/${number.phone_number_id}?fields=quality_rating,messaging_limit_tier,verified_name,display_phone_number`,
            {
              headers: { Authorization: `Bearer ${bm.access_token}` }
            }
          )

          if (!metaResponse.ok) {
            const errorText = await metaResponse.text()
            console.error(`[AUTO_UPDATE] Erro Meta API para ${number.id}:`, errorText)
            totalErrors++
            continue
          }

          const detail = await metaResponse.json()
          const newQuality = mapQuality(detail.quality_rating)
          const newLimit = mapLimit(detail.messaging_limit_tier)

          const hasChanged = number.quality_rating !== newQuality || 
                            number.messaging_limit_tier !== newLimit

          console.log(`[AUTO_UPDATE] Número ${number.display_phone_number}: ${number.quality_rating} -> ${newQuality}, mudou: ${hasChanged}`)

          // Atualiza o número
          const { error: updateError } = await supabase
            .from('whatsapp_numbers')
            .update({
              quality_rating: newQuality,
              messaging_limit_tier: newLimit,
              verified_name: detail.verified_name,
              display_phone_number: detail.display_phone_number,
              last_checked: new Date().toISOString(),
            })
            .eq('id', number.id)

          if (updateError) {
            console.error(`[AUTO_UPDATE] Erro ao atualizar número ${number.id}:`, updateError)
            totalErrors++
            continue
          }

          // Lógica de histórico diário
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          
          const { data: lastHistory, error: historyError } = await supabase
            .from('status_history')
            .select('*')
            .eq('phone_number_id', number.id)
            .order('changed_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (historyError) {
            console.error(`[AUTO_UPDATE] Erro ao buscar histórico de ${number.id}:`, historyError)
          }

        if (hasChanged) {
            // Mudança de status - cria registro com status anterior e notificação
            const qualityValue: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 }
            const direction = qualityValue[newQuality] > qualityValue[number.quality_rating] ? 'up' : 'down'

            await supabase
              .from('status_change_notifications')
              .insert({
                phone_number_id: number.id,
                project_id: projectId,
                previous_quality: number.quality_rating,
                new_quality: newQuality,
                direction: direction,
                changed_at: new Date().toISOString(),
              })

            await supabase
              .from('status_history')
              .insert({
                phone_number_id: number.id,
                quality_rating: newQuality,
                messaging_limit_tier: newLimit,
                previous_quality: number.quality_rating,
                changed_at: new Date().toISOString(),
                observation: `Status alterado de ${number.quality_rating} para ${newQuality} (automático)`,
              })

            console.log(`[AUTO_UPDATE] Histórico de mudança criado para ${number.id}`)
          } else {
            // Sem mudança - SEMPRE cria novo registro para cada verificação
            // Isso permite ver todas as verificações do dia quando expandir
            await supabase
              .from('status_history')
              .insert({
                phone_number_id: number.id,
                quality_rating: newQuality,
                messaging_limit_tier: newLimit,
                changed_at: new Date().toISOString(),
                observation: 'Verificação automática',
              })
            
            console.log(`[AUTO_UPDATE] Registro de verificação criado para ${number.id}`)
          }

          totalUpdated++
        } catch (e) {
          console.error(`[AUTO_UPDATE] Erro ao processar número ${number.id}:`, e)
          totalErrors++
        }
      }
    }

    console.log(`[AUTO_UPDATE] Finalizado - ${totalUpdated} atualizados, ${totalErrors} erros`)

    return new Response(
      JSON.stringify({ 
        success: true, 
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
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function mapQuality(q: string): string {
  const map: Record<string, string> = { GREEN: 'HIGH', YELLOW: 'MEDIUM', RED: 'LOW' }
  return map[q] || q || 'HIGH'
}

function mapLimit(t: string): string {
  const map: Record<string, string> = {
    TIER_1K: '1000', 
    TIER_10K: '10000', 
    TIER_100K: '100000', 
    TIER_UNLIMITED: 'Ilimitado'
  }
  return map[t] || t || '1000'
}

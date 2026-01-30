
# Plano: Tratamento Robusto de Erros na Consulta da API Meta

## Diagnóstico do Problema

Identifiquei **três pontos críticos** que causam o comportamento reportado:

### 1. Mapeamento de Qualidade com Fallback Errado

**`src/services/metaApi.ts` (linha 36):**
```typescript
export const mapMetaQuality = (quality: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  switch (quality) {
    case 'GREEN': return 'HIGH';
    case 'YELLOW': return 'MEDIUM';
    case 'RED': return 'LOW';
    default: return 'MEDIUM';  // ❌ PROBLEMA: força amarelo quando API retorna erro/undefined
  }
};
```

**Edge function (`auto-update-status/index.ts` linha 326-329):**
```typescript
function mapQuality(q: string): string {
  const map = { GREEN: 'HIGH', YELLOW: 'MEDIUM', RED: 'LOW', UNKNOWN: 'UNKNOWN' }
  return map[q] || q || 'UNKNOWN'  // ❌ Retorna UNKNOWN mas não é tratado depois
}
```

### 2. Erros de API Não Registrados no Histórico

Quando `metaData.error` existe, o código apenas faz `continue` sem:
- Registrar no histórico que houve erro
- Manter o status anterior do número
- Notificar o usuário visualmente

### 3. Sem Indicador Visual de Erro por Número

O componente `ErrorBadge.tsx` existe mas **não está sendo usado** na linha do número em `ProjectDetail.tsx`.

---

## Solução Proposta

### Parte 1: Modificar Edge Function para Tratar Erros Corretamente

**Quando API retornar erro:**
1. **NÃO atualizar** o `quality_rating` do número (manter anterior)
2. **Registrar no histórico** com `is_error: true` e `error_message`
3. **Atualizar** apenas `last_checked` para indicar que tentou verificar
4. Incrementar contador de erros

**Arquivo:** `supabase/functions/auto-update-status/index.ts`

```text
Mudanças:
- Adicionar bloco de tratamento de erro que registra no histórico
- Não alterar quality_rating quando há erro de API
- Incluir error_message no registro
```

### Parte 2: Modificar Atualização Manual (Frontend)

**Arquivo:** `src/pages/ProjectDetail.tsx` (função `handleUpdateAllStatus`)

```text
Mudanças:
- Capturar erros da API e registrar no histórico com is_error: true
- Manter status anterior quando há erro
- Mostrar toast mais informativo sobre erros
```

### Parte 3: Adicionar Indicador Visual de Erro na Linha

**Arquivo:** `src/pages/ProjectDetail.tsx` (função `renderNumberRow`)

```text
Mudanças:
- Importar e usar ErrorBadge ou criar indicador inline
- Buscar último registro de erro do histórico para cada número
- Exibir ícone de alerta quando número tem erro recente
```

### Parte 4: Criar Hook para Buscar Estado de Erro

**Novo arquivo:** `src/hooks/useNumberErrorState.ts`

```text
- Hook que busca os últimos registros com is_error=true da tabela waba_status_history
- Retorna Map<phoneNumberId, { hasError, errorMessage, errorAt }>
```

### Parte 5: Atualizar Tipos

**Arquivo:** `src/types/index.ts`

O tipo `StatusHistory` já tem os campos necessários:
```typescript
isError?: boolean;
errorMessage?: string;
```

---

## Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/auto-update-status/index.ts` | Tratar erros da API sem alterar status |
| `src/services/metaApi.ts` | Lançar exceção em vez de retornar fallback |
| `src/pages/ProjectDetail.tsx` | Tratar erros e mostrar indicador visual |
| `src/hooks/useNumberErrorState.ts` | **Criar** hook para buscar erros recentes |
| `src/components/dashboard/ErrorBadge.tsx` | Ajustar para usar no contexto de linha |

---

## Fluxo de Tratamento de Erro (Após Correção)

```text
┌─────────────────────────────────────────────────────────────────┐
│                    CONSULTA API META                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │  API respondeu? │
                    └─────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
      ┌───────────────┐              ┌───────────────┐
      │   SUCESSO     │              │    ERRO       │
      │ (GREEN/YELLOW │              │ (timeout,     │
      │  RED)         │              │  auth, etc)   │
      └───────────────┘              └───────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐            ┌──────────────────────┐
    │ Atualiza status │            │ MANTÉM status atual  │
    │ quality_rating  │            │ (não altera)         │
    └─────────────────┘            └──────────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐            ┌──────────────────────┐
    │ Histórico:      │            │ Histórico:           │
    │ is_error: false │            │ is_error: true       │
    │ quality_rating: │            │ quality_rating: null │
    │   novo valor    │            │ error_message: "..." │
    └─────────────────┘            └──────────────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────┐            ┌──────────────────────┐
    │ UI: Badge verde/│            │ UI: Badge atual +    │
    │ amarelo/vermelho│            │ Ícone de erro ⚠️     │
    └─────────────────┘            └──────────────────────┘
```

---

## Detalhes Técnicos

### Edge Function - Tratamento de Erro

```typescript
// Quando API retorna erro
if (metaData.error) {
  console.error(`[AUTO_UPDATE] Erro Meta:`, metaData.error.message)
  
  // Registra tentativa com erro no histórico
  await supabase.from('waba_status_history').insert({
    phone_number_id: num.id,
    quality_rating: num.quality_rating, // MANTÉM o status atual
    messaging_limit_tier: num.messaging_limit_tier,
    changed_at: new Date().toISOString(),
    is_error: true,
    error_message: metaData.error.message || 'Erro desconhecido na API Meta',
    observation: `Erro na verificação: ${metaData.error.message}`,
  })
  
  // Atualiza apenas last_checked (para saber que tentou)
  await supabase
    .from('waba_whatsapp_numbers')
    .update({ last_checked: new Date().toISOString() })
    .eq('id', num.id)
  
  totalErrors++
  projectErrors++
  continue
}

// Validar se quality_rating veio corretamente
if (!metaData.quality_rating || !['GREEN', 'YELLOW', 'RED'].includes(metaData.quality_rating)) {
  // Resposta inesperada - trata como erro
  await supabase.from('waba_status_history').insert({
    phone_number_id: num.id,
    quality_rating: num.quality_rating,
    messaging_limit_tier: num.messaging_limit_tier,
    changed_at: new Date().toISOString(),
    is_error: true,
    error_message: `Resposta inválida: quality_rating = ${metaData.quality_rating || 'undefined'}`,
  })
  
  await supabase
    .from('waba_whatsapp_numbers')
    .update({ last_checked: new Date().toISOString() })
    .eq('id', num.id)
  
  totalErrors++
  projectErrors++
  continue
}
```

### Hook de Estado de Erro

```typescript
export function useNumberErrorState(numberIds: string[]) {
  return useQuery({
    queryKey: ['number-errors', numberIds],
    queryFn: async () => {
      // Busca registros recentes com is_error = true
      const { data } = await supabase
        .from('waba_status_history')
        .select('phone_number_id, error_message, changed_at')
        .in('phone_number_id', numberIds)
        .eq('is_error', true)
        .order('changed_at', { ascending: false })
        .limit(100)
      
      // Agrupa por número (pega o erro mais recente de cada)
      const errorMap = new Map()
      data?.forEach(record => {
        if (!errorMap.has(record.phone_number_id)) {
          errorMap.set(record.phone_number_id, {
            hasError: true,
            errorMessage: record.error_message,
            errorAt: record.changed_at
          })
        }
      })
      
      return errorMap
    }
  })
}
```

### Indicador Visual na Linha (Simples)

Na função `renderNumberRow`, adicionar após o `QualityBadge`:

```tsx
{/* Indicador de erro de consulta */}
{errorInfo?.hasError && (
  <Tooltip>
    <TooltipTrigger>
      <AlertCircle className="w-4 h-4 text-destructive animate-pulse" />
    </TooltipTrigger>
    <TooltipContent>
      <p className="font-medium text-destructive">Erro na última verificação</p>
      <p className="text-xs">{errorInfo.errorMessage}</p>
      <p className="text-xs text-muted-foreground">
        {format(new Date(errorInfo.errorAt), "dd/MM HH:mm")}
      </p>
    </TooltipContent>
  </Tooltip>
)}
```

---

## Resultado Esperado

1. **Status preservado**: Quando a API falha, o número mantém seu status anterior (HIGH permanece HIGH)
2. **Histórico completo**: Cada tentativa de verificação é registrada, incluindo erros
3. **Visualização clara**: Ícone de alerta aparece na linha do número com erro
4. **Rastreabilidade**: O modal de histórico mostra os registros de erro com a mensagem

---

## Riscos e Considerações

- **Nenhum risco de perda de dados**: Apenas adiciona tratamento de erro
- **Compatibilidade**: Usa campos `is_error` e `error_message` que já existem na tabela `waba_status_history`
- **Performance**: Hook de erros usa query simples com índice em `phone_number_id`


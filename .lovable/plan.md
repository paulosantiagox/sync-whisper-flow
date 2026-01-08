# Plano: Corrigir Tipos de Acao (Action Types) nao aparecendo

## Diagnostico

O erro encontrado nos logs de rede:
```
"column action_types.created_at does not exist"
```

A tabela `action_types` no Supabase do usuario (dfrfeirfllwmdkenylwk) **nao possui a coluna `created_at`**, mas o codigo em `src/hooks/useCampaigns.ts` tenta ordenar por essa coluna.

## Solucao

### Parte 1: Corrigir o codigo (remover ordenacao por coluna inexistente)

Modificar `src/hooks/useCampaigns.ts` na funcao `useActionTypes` para nao ordenar por `created_at` ja que essa coluna nao existe na tabela.

**Arquivo:** `src/hooks/useCampaigns.ts`

**Alteracao na linha 275:**
```typescript
// DE:
.order('created_at', { ascending: false });

// PARA:
.order('name', { ascending: true });
```

Isso vai ordenar os tipos de acao alfabeticamente pelo nome, que e um comportamento aceitavel.

### Parte 2: (Opcional) Adicionar coluna created_at na tabela

Se o usuario preferir ter a ordenacao por data de criacao, pode executar o seguinte SQL no dashboard do Supabase pessoal:

```sql
-- Adicionar coluna created_at na tabela action_types
ALTER TABLE public.action_types 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useCampaigns.ts` | Remover ordenacao por `created_at` na funcao `useActionTypes` (linha 275) |

## Resultado Esperado

Apos a correcao:
1. Os tipos de acao serao carregados corretamente
2. O modal "Tipos de Acao" exibira todos os tipos cadastrados
3. O filtro de tipos na tabela de disparos funcionara
4. Criacao, edicao e exclusao de tipos de acao funcionarao

## Arquivos Criticos para Implementacao

- `src/hooks/useCampaigns.ts` - Contem o hook useActionTypes que precisa ser corrigido (linha 275)

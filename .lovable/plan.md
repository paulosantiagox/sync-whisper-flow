
# Plano: Corrigir Função has_role e Políticas RLS

## Diagnóstico

O sistema não mostra os números porque as políticas RLS estão falhando com o erro:

```
"relation public.user_roles does not exist"
```

A função `public.has_role` (usada pelas policies de TODAS as tabelas) ainda referencia a tabela `public.user_roles`, que foi removida quando você limpou as views de compatibilidade.

## Solução

Você precisa rodar o SQL abaixo no seu banco Supabase pessoal (`dfrfeirfllwmdkenylwk`) para corrigir a função `has_role`:

---

## SQL para Correção

```sql
-- 1. Remove a função antiga (se existir com assinatura antiga)
DROP FUNCTION IF EXISTS public.has_role(uuid, text);
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

-- 2. Recria a função apontando para waba_user_roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.waba_user_roles
    WHERE user_id = _user_id
      AND role::text = _role
  )
$$;

-- 3. Cria uma versão com app_role para compatibilidade (caso policies usem app_role)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.waba_user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

---

## O que acontece depois

Uma vez que a função `has_role` aponte corretamente para `waba_user_roles`, todas as policies existentes que você já criou (como a de `waba_projects` que você mostrou) passarão a funcionar automaticamente.

Não será necessário alterar nenhum código do aplicativo — o código já usa `waba_*` em todas as queries.

---

## Verificação pós-correção

Depois de rodar o SQL, recarregue a página do Dashboard e entre em um projeto para verificar se os números aparecem.

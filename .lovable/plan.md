
## Objetivo
Fazer os números voltarem a aparecer no sistema corrigindo o bloqueio de acesso causado por RLS (policies) + função `has_role`, sem “chutar” nomes de colunas e sem quebrar as policies existentes.

---

## O que eu já verifiquei no seu código (varredura)
1. O app NÃO está usando o backend “Cloud” do projeto; ele está apontando para o seu banco pessoal diretamente:
   - `src/lib/supabase.ts` usa URL/anon key fixos do seu projeto (`dfrfeirfllwmdkenylwk`).
   - Ou seja: qualquer ajuste precisa ser feito nesse mesmo banco onde você está rodando o SQL.

2. O frontend já usa o prefixo `waba_` em todas as queries relevantes:
   - `waba_projects`, `waba_whatsapp_numbers`, `waba_business_managers`, `waba_user_roles`, `waba_profiles` etc.
   - Então, “falta trocar prefixo no código” não parece ser o problema.

3. Pelo dump de colunas que você colou:
   - `waba_projects` TEM `user_id`.
   - `waba_user_roles` TEM `user_id`.
   - `waba_whatsapp_numbers` NÃO tem `user_id` (e não precisa ter).
   - `waba_business_managers` NÃO tem `user_id` (só `project_id`, e isso é normal).

Isso é importante porque explica o seu erro atual:
- O erro **`column "user_id" does not exist`** quase sempre acontece quando tentamos criar uma policy para uma tabela que **não tem** `user_id` (ex.: `waba_business_managers`) usando algo como `user_id = auth.uid()`.

---

## Diagnóstico provável do seu erro atual
Você tentou rodar um SQL “grande” (provavelmente o que eu te passei com CASCADE/recriação de policies), e em alguma parte ele tentou recriar policy para `waba_business_managers` (ou outra tabela) **como se ela tivesse** coluna `user_id`.

Como `waba_business_managers` NÃO tem `user_id`, o Postgres aborta com:
- `ERROR: 42703: column "user_id" does not exist`

---

## Estratégia de correção (sem derrubar policies à toa)
### Parte A — Corrigir `has_role` sem DROP (mais seguro)
Em vez de `DROP FUNCTION` (que dá erro de dependência e/ou te força a recriar policies), vamos fazer do jeito seguro:

1) Rodar apenas `CREATE OR REPLACE FUNCTION ...` para sobrescrever a função existente, sem CASCADE e sem apagar policies.

Isso evita:
- erro de dependência
- risco de recriar policy errada
- loop de “cai policy, recria policy”

### Parte B — Só se você já perdeu policies por CASCADE
Se você já rodou `DROP ... CASCADE` e suas policies sumiram, aí sim vamos recriar policies:
- **sem usar `user_id` em tabelas que não têm `user_id`**
- usando JOIN/EXISTS via `waba_projects.user_id` (porque BM e Numbers são “do projeto”, não “do usuário” diretamente)

---

## Passos (ordem exata)

### 1) Executar um SQL mínimo e seguro para atualizar `has_role` (sem DROP)
Vou te passar um bloco SQL limpo (sem CASCADE) que:
- mantém suas policies intactas
- apenas troca a implementação da função para apontar para `public.waba_user_roles`

Critérios desse SQL:
- Ter `SECURITY DEFINER`
- `SET search_path = public`
- Criar as duas assinaturas (`text` e `app_role`) para compatibilidade com policies antigas

### 2) Verificar se ainda existe policy chamando `has_role(...)` e se a função já aponta para `waba_user_roles`
Depois de rodar o SQL da função:
- Recarregar o sistema e tentar entrar no projeto para ver os números.
- Se ainda não aparecer, o próximo passo é confirmar se:
  - a policy de SELECT em `waba_whatsapp_numbers` existe
  - a policy está “linkando” o número ao projeto corretamente (`project_id`)
  - não existe nenhuma policy ainda referenciando tabela antiga `public.user_roles` (ou algum tipo/assinatura antiga da função)

### 3) Se você realmente precisa recriar policies: recriar do jeito certo (sem `bm.user_id`)
Se você perdeu policies, vou te passar um segundo bloco SQL (separado) que:
- habilita RLS em `waba_whatsapp_numbers` e `waba_business_managers` (se necessário)
- cria policies baseadas em:
  - `EXISTS (SELECT 1 FROM waba_projects p WHERE p.id = <tabela>.project_id AND (p.user_id = auth.uid() OR has_role(auth.uid(),'master')) )`

Isso funciona porque:
- `waba_business_managers` tem `project_id`
- `waba_projects` tem `user_id`
- logo não precisamos de `user_id` dentro de `waba_business_managers`

### 4) Checagem no app (end-to-end)
Depois do ajuste:
- Abrir `/dashboard` → entrar em um projeto → confirmar que:
  - lista de números carrega
  - lista de BMs carrega
- Se ainda vier vazio, usar os logs que já estão no código:
  - `src/hooks/useBusinessManagers.ts` já loga `Erro RLS/Supabase:` no console.
  - O próximo passo será você me mandar exatamente o erro que aparecer ali (isso nos diz se é RLS, se é “relation does not exist”, etc.)

---

## Ajustes no código (somente se necessário)
Pelo que vi, o frontend já está consistente com `waba_*`.
Então mudança no código só entraria se:
- alguma tabela no seu banco não bater com os nomes/colunas esperados pelo app (ex.: tipos diferentes, colunas faltando, etc.)
- ou se quisermos adicionar um “debug screen” para exibir erros RLS direto na UI (para não depender do console)

No momento, o foco é corrigir o SQL sem quebrar policies e sem tentar usar `user_id` onde ele não existe.

---

## Riscos / Garantias
- Atualizar a função com `CREATE OR REPLACE` NÃO apaga dados.
- Mesmo se você tivesse rodado `DROP FUNCTION ... CASCADE`, isso derruba policies (regras), não registros (dados).
- O maior risco aqui é recriar policy errada (por isso a estratégia é evitar CASCADE e corrigir só a função).

---

## O que eu preciso de você para concluir sem erro na primeira tentativa
Como você já me mandou o dump das colunas (ótimo), o próximo passo é:
- você colar aqui o bloco SQL exato que você tentou executar quando apareceu `column "user_id" does not exist` (mesmo que seja grande), OU
- me dizer se você chegou a rodar algum `DROP ... CASCADE` e se as policies “sumiram”.

Assim eu te devolvo o SQL final “certinho” (mínimo e sem tocar em nada que não precise).

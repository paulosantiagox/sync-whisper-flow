

## Corrigir Barra de Rolagem no Modal de Histórico de Status

### Problema Identificado
A barra de rolagem não aparece no modal de "Histórico de Status" porque o `ScrollArea` não tem as constraints de altura necessárias para ativar o scroll em um container flexbox.

---

### Causa Raiz
Em containers flexbox, elementos filhos tem `min-height: auto` por padrao, o que impede que o conteudo encolha abaixo do seu tamanho intrinseco. Isso faz com que o `ScrollArea` expanda para mostrar todo o conteudo ao inves de criar uma barra de rolagem.

---

### Arquivo a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/modals/StatusHistoryModal.tsx` | Adicionar constraints de altura ao ScrollArea |

---

### Alteracoes

**Linha 120 - Container principal:**
```tsx
// DE:
<div className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4">

// PARA:
<div className="flex-1 flex flex-col overflow-hidden space-y-4 mt-4 min-h-0">
```

**Linha 173 - ScrollArea:**
```tsx
// DE:
<ScrollArea className="flex-1 rounded-lg border">

// PARA:
<ScrollArea className="flex-1 rounded-lg border min-h-0 max-h-[40vh]">
```

A classe `min-h-0` permite que o elemento flex encolha, e `max-h-[40vh]` garante uma altura maxima para ativar o scroll.

---

### Resultado Esperado
Apos a correcao, a lista de dias do historico tera uma barra de rolagem visivel quando houver mais itens do que cabem na area visivel, permitindo visualizar todos os dias.


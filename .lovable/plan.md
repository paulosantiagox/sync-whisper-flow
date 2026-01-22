

## Corrigir Barra de Rolagem do Histórico de Status

### Problema
O `max-h-[40vh]` está cortando a área de rolagem em apenas 4 dias. O modal tem 85vh de altura máxima, mas a área de scroll está sendo limitada artificialmente.

---

### Solução

Modificar o **`src/components/modals/StatusHistoryModal.tsx`** para usar uma abordagem flexbox correta:

#### Alteração 1 - DialogContent (linha 100)
Adicionar `overflow-hidden` para garantir que o conteúdo interno controle o scroll:
```tsx
// DE:
<DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">

// PARA:
<DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
```
(já está correto, manter assim)

#### Alteração 2 - ScrollArea (linha 173)
Remover o `max-h-[40vh]` e usar altura fixa calculada:
```tsx
// DE:
<ScrollArea className="flex-1 rounded-lg border min-h-0 max-h-[40vh]">

// PARA:
<ScrollArea className="flex-1 rounded-lg border min-h-0 h-[300px]">
```

**OU** usar uma abordagem melhor com altura mínima e máxima mais generosa:

```tsx
// OPÇÃO MELHOR:
<ScrollArea className="rounded-lg border h-[calc(85vh-350px)] min-h-[200px]">
```

Esta fórmula calcula:
- 85vh = altura total do modal
- 350px = espaço usado pelo header, cards de estatísticas, filtros e padding
- Resultado: área de scroll usa todo o espaço restante

---

### Resultado Esperado
Todos os 14 dias de monitoramento serão visíveis através da barra de rolagem, ocupando todo o espaço disponível no modal.


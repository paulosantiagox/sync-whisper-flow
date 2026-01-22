

## Adicionar Variável {numero} no Template de Disparo

### Objetivo
Adicionar uma nova variável `{numero}` no template de cópia de disparos, exibindo o número de telefone completo abaixo da conta.

---

### Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/modals/BroadcastTemplateConfigModal.tsx` | Atualizar template padrao e lista de variaveis |
| `src/pages/Campaigns.tsx` | Adicionar substituicao da variavel {numero} |

---

### Alteracoes Detalhadas

#### 1. BroadcastTemplateConfigModal.tsx

**Template Padrao (linhas 11-26)**
Adicionar a linha do numero abaixo da conta:

```text
📱 *CONTA:* {conta}
📞 *Número:* {numero}
🔵 *Qualidade:* {qualidade}
```

**Lista de Variaveis Copiadas (linhas 62-72)**
Adicionar:
```text
{numero} - Número de telefone completo
```

**Grid de Variaveis no Modal (linhas 127-138)**
Adicionar nova linha:
```html
<span><code>{numero}</code> Número completo</span>
```

---

#### 2. Campaigns.tsx

**Funcao handleCopyBroadcast (linhas 223-233)**
Adicionar a substituicao da nova variavel:

```typescript
.replace(/{numero}/g, phoneNum?.displayPhoneNumber || 'N/A')
```

---

### Resultado Visual

**Template Padrao Atualizado:**
```
🚀 *DISPARO REALIZADO*

📅 *Data:* {data}
⏰ *Horário:* {hora}

📱 *CONTA:* {conta}
📞 *Número:* {numero}
🔵 *Qualidade:* {qualidade}

📋 *Lista:* {lista}
📝 *Template:* {template}
👥 *Contatos:* {contatos}

🏷️ *Tipo:* {tipo}
📊 *Status:* {status}

{observacoes}
```

**Exemplo de Saida:**
```
📱 *CONTA:* Loja Principal
📞 *Número:* +55 92 99999-9999
🔵 *Qualidade:* 🟢 Alta
```

---

### Observacao
Usuarios que ja salvaram um template personalizado nao verao o numero automaticamente - precisarao adicionar `{numero}` manualmente ou clicar em "Restaurar Padrao".


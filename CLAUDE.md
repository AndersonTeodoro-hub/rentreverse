# RentReverse — Development Guidelines

## REGRA ABSOLUTA
NUNCA escrever nenhuma chave, token, API key, ou credencial em NENHUM ficheiro do projecto.

## Design System
Este projecto deve ter qualidade visual ao nível de Revolut, Stripe, Airbnb. Nunca parecer genérico ou feito por IA.

### Princípios visuais
- **Espaçamento generoso**: mínimo py-6 px-6 em cards, py-16 entre secções. Nunca apertar conteúdo.
- **Tipografia hierárquica**: títulos em font-bold text-2xl ou maior, subtítulos em text-muted-foreground, corpo em text-base. Nunca tudo do mesmo tamanho.
- **Cores intencionais**: azul primário (#2563eb) apenas para CTAs e elementos interactivos. Cinzas neutros para texto e bordas. Verde apenas para sucesso/verificação. Nunca cores aleatórias.
- **Sombras subtis**: shadow-sm para cards, shadow-md para elementos elevados. Nunca shadow-lg a não ser em modais.
- **Bordas finas**: border border-border para separação. Nunca bordas grossas ou coloridas.
- **Cantos consistentes**: rounded-xl para cards grandes, rounded-lg para botões e inputs, rounded-md para badges.
- **Imagens e ícones**: usar lucide-react para ícones, tamanho consistente (h-5 w-5 para inline, h-8 w-8 para destaque). Nunca ícones gigantes.
- **Animações mínimas**: hover:shadow-md transition-shadow para cards. Nunca animações chamativas ou bouncing.
- **Fundo limpo**: bg-background para páginas, bg-card para cards. Sem gradientes coloridos excepto no hero.

### Formulários
- Labels sempre acima do input, nunca ao lado
- Inputs com h-11 para toque fácil em mobile
- Placeholder descritivo mas curto
- Validação inline com mensagem em text-sm text-destructive
- Botão submit com width auto, não full-width (excepto em mobile)
- Agrupar campos relacionados com subtítulos

### Cards de listagem (imóveis, pedidos, ofertas)
- Imagem à esquerda (ou topo em mobile), info à direita
- Preço em destaque (text-xl font-bold)
- Badges para status (Verificado, Novo, Urgente) com cores semânticas
- Máximo 3 linhas de informação antes de "Ver mais"
- Hover com shadow-md e cursor-pointer

### Páginas autenticadas
- Sidebar ou tabs para navegação interna, nunca links soltos
- Breadcrumb no topo quando há profundidade
- Empty states com ícone, título e CTA (nunca "não há dados" seco)
- Loading states com skeleton, nunca spinner sozinho

### Mobile-first
- Todas as páginas devem funcionar em 375px de largura
- Menus colapsam em hamburger abaixo de md
- Cards empilham verticalmente em mobile
- Touch targets mínimo h-11 w-11

### Nunca fazer
- Nunca usar cores de fundo fortes em grandes áreas (verde, azul, roxo)
- Nunca usar mais de 2 fontes
- Nunca usar texto branco sobre fundo claro
- Nunca usar ícones sem propósito funcional
- Nunca usar uppercase excepto em badges pequenos
- Nunca usar border-2 ou mais grosso
- Nunca empilhar mais de 3 níveis de cards/containers

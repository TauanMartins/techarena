# Navegação social com os contratos atuais

Esta mudança aproveita fluxos de `frontend.old` sem restaurar autenticação ou chat PHP. As referências principais foram `components/DetailAppointment`, `components/SearchTeamsAndSolicitations/Teams` e `pages/Social/Chat`: detalhe da partida com materiais e modalidade de participação, equipes do próprio usuário e conversas ligadas ao contexto social.

- `/ligas` apresenta um card por liga. Não escolhe nem carrega automaticamente os detalhes da primeira. `/ligas/:leagueId` abre uma competição específica, inclusive por acesso direto, com equipes, partidas, classificação e ferramentas do organizador. A criação leva à página da nova liga.
- `/equipes` começa pelas equipes e convites do usuário. O catálogo só é consultado após uma busca explícita com pelo menos dois caracteres, com páginas de 20 resultados. Isso é uma mudança de experiência e consumo da API, não uma nova restrição de autorização do endpoint.
- Detalhes de partidas reúnem foto, local, participantes e os materiais que o jogador deve providenciar (`GET /sports/material`). A participação envia `holder: true` ou `false`; vagas titulares preenchidas não impedem entrar como reserva. A API continua sendo a autoridade sobre capacidade, horário e permissão.
- Erros de ingresso aparecem no próprio detalhe. Depois de um ingresso confirmado pela API, a ação passa a abrir a conversa.
- Detalhes de equipe preservam membros, convites e solicitações, com acesso à conversa e papéis em português. Detalhes do chat de equipe consultam os membros reais, com paginação.
- Autenticação e realtime continuam no Supabase. Não foram introduzidos votos, reputação, estatísticas fictícias ou endpoints novos.

Validação: 130 testes do frontend, incluindo ausência de consulta global inicial de equipes, busca paginada, rota individual de liga, materiais e ingresso como reserva, além de membros no contexto da conversa. Lint, formatação, cobertura e build Vite foram verificados.

## Descoberta de arenas e recuperação dos fluxos do aplicativo nativo

O início apresenta Google Maps e uma lista alternativa paginada. A consulta usa as arenas do banco: não utiliza Google Places, Geocoding ou Routes. A localização é solicitada pelo botão explícito; sem permissão, o usuário pode mover o mapa e buscar no centro escolhido ou pesquisar o endereço cadastrado. O raio começa em 5 km, é ajustável e pode ser ampliado quando não há resultados. Distâncias são geográficas em linha reta, calculadas pelo PostGIS, não trajetos. O mapa representa os resultados da página atual, não todas as arenas do banco.

- Selecionar arena mostra esportes, imagem existente, distância e ações para agendar ou ver partidas naquele local. `/?arenaId=...` permite voltar ao mapa pelos detalhes e pelo formulário. O filtro por ID mantém as mesmas permissões do catálogo.
- O formulário preserva a arena escolhida mesmo fora da primeira página, tem busca e paginação próprias e permite que o organizador participe como titular ou reserva.
- Agendamentos têm modalidade, prioridade de favoritos, data crescente/decrescente, proximidade e raio. Filtros e página ficam na URL; a localização permanece em memória. Escolher ordem por data remove o raio, pois o contrato da API ordena por distância quando recebe coordenadas.
- Meus agendamentos usa `/appointments/user`, com `period=upcoming|past` opcional, filtrado no banco antes da paginação e sempre limitado às participações do usuário autenticado. Os cards preservam participantes, materiais e acesso ao chat.
- O chat consulta as participações sem excluir datas anteriores e percorre as páginas de agendamentos pessoais.
- Capitães podem editar nome e descrição das equipes, preservando a imagem existente. A disponibilidade do nome é consultada com atraso de 400 ms; a API continua responsável pela validação definitiva e pela autorização.
- Upload de fotos e sistema de confiabilidade/votos permanecem fora desta etapa.

### Ambiente local

Configurar `VITE_GOOGLE_MAPS_API_KEY` em `.env.frontend` na raiz, com restrições de site `http://localhost:4200/*` e opcionalmente `http://127.0.0.1:4200/*`, restrita à Maps JavaScript API. O projeto Google precisa de faturamento e API habilitados. O mapa usa estilo local raster e marcadores acessíveis via `OverlayView`: não é necessário configurar Map ID ou estilo no Google Cloud. A variável `VITE_GOOGLE_MAPS_MAP_ID` não é usada.

O Compose injeta `.env.frontend`; após modificar suas variáveis, executar `docker compose up -d --no-deps --force-recreate frontend`. O Vite também lê esse arquivo para execução direta via npm e usa porta 4200. Testes não carregam esse arquivo privado. Valores VITE são públicos no bundle e a chave deve ser protegida pelas restrições do Google. Em publicação, fornecer essas variáveis no ambiente de build.

Sem chave, sem conexão ou com falha de autorização do Google, a lista de arenas continua disponível. Nenhuma migration de banco é necessária para estes ajustes.

### Usabilidade e consumo do Google Maps

O mapa oculta rótulos, pontos de interesse e transporte do mapa-base; mantém a atribuição obrigatória do Google e mostra os marcadores de quadras do TechArena. Selecionar uma quadra abre imediatamente um painel lateral com modalidades, agendamento, partidas existentes e links de navegação. Google Maps e Waze recebem apenas as coordenadas da quadra através de links externos; não usamos Routes API nem enviamos a posição atual para construir esses links.

Ao agendar pela quadra, a arena fica fixa e a seleção de modalidade contém apenas esportes praticáveis ali. Para trocar de quadra, há um link para voltar ao mapa. A navegação principal concentra os destinos da aplicação, sem atalhos duplicados no início. A agenda separa exploração e participações, com filtros adicionais recolhíveis.

A instância de `google.maps.Map` e seu elemento DOM são reutilizados durante a navegação na mesma aba. A câmera é preservada quando a área/resultados não mudaram. Mudar mapa/lista, filtros ou marcadores não recria o mapa. O SDK é carregado uma única vez por documento. Um reload completo, nova aba ou reabertura do aplicativo pode gerar um novo carregamento cobrado. Os limites configurados no Google continuam sendo o controle de consumo.

O catálogo próprio de arenas fica atualizado em cache por 5 minutos (retenção de 30 minutos), esportes por 1 hora. Região, filtros e modo de visualização são guardados por usuário em memória por até 30 minutos; não persistimos a localização no armazenamento do navegador. O botão Atualizar quadras consulta o backend novamente sem recriar o mapa. Não há cache manual/offline de imagens, tiles ou conteúdo do Google.

Referências: [estilos locais](https://developers.google.com/maps/documentation/javascript/json-styling-overview), [overlays](https://developers.google.com/maps/documentation/javascript/customoverlays), [cobrança e interações](https://developers.google.com/maps/faq), [Waze](https://developers.google.com/waze/deeplinks), [Maps URLs](https://developers.google.com/maps/documentation/urls/get-started).

### Publicação do Maps

O workflow `.github/workflows/release.yml` compila o frontend no GitHub Actions e publica `dist` no Cloudflare Workers via Wrangler. Cadastrar **secret de Actions do repositório** `VITE_GOOGLE_MAPS_API_KEY` antes de publicar uma release. O workflow injeta a chave no build e verifica sua presença antes de iniciar os deploys daquela release. A variável não é necessária no Render nem como binding de runtime no Cloudflare. Se futuramente o build nativo do Cloudflare voltar a ser usado, será necessário configurá-la também naquele ambiente de build.

No Google Cloud, restringir a chave de produção à Maps JavaScript API e aos endereços efetivos do frontend, por exemplo `https://seu-worker.workers.dev/*` e seu domínio personalizado. Preferir uma chave de produção separada da chave de localhost. A chave é pública no JavaScript do navegador; cadastrá-la como secret protege sua configuração e os logs, e as restrições no Google controlam seu uso. `VITE_GOOGLE_MAPS_MAP_ID` não é necessário.

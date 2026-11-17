# Navegação social com os contratos atuais

Esta mudança aproveita fluxos de `frontend.old` sem restaurar autenticação ou chat PHP. As referências principais foram `components/DetailAppointment`, `components/SearchTeamsAndSolicitations/Teams` e `pages/Social/Chat`: detalhe da partida com materiais e modalidade de participação, equipes do próprio usuário e conversas ligadas ao contexto social.

- `/ligas` apresenta um card por liga. Não escolhe nem carrega automaticamente os detalhes da primeira. `/ligas/:leagueId` abre uma competição específica, inclusive por acesso direto, com equipes, partidas, classificação e ferramentas do organizador. A criação leva à página da nova liga.
- `/equipes` começa pelas equipes e convites do usuário. O catálogo só é consultado após uma busca explícita com pelo menos dois caracteres, com páginas de 20 resultados. Isso é uma mudança de experiência e consumo da API, não uma nova restrição de autorização do endpoint.
- Detalhes de partidas reúnem foto, local, participantes e os materiais que o jogador deve providenciar (`GET /sports/material`). A participação envia `holder: true` ou `false`; vagas titulares preenchidas não impedem entrar como reserva. A API continua sendo a autoridade sobre capacidade, horário e permissão.
- Erros de ingresso aparecem no próprio detalhe. Depois de um ingresso confirmado pela API, a ação passa a abrir a conversa.
- Detalhes de equipe preservam membros, convites e solicitações, com acesso à conversa e papéis em português. Detalhes do chat de equipe consultam os membros reais, com paginação.
- Autenticação e realtime continuam no Supabase. Não foram introduzidos votos, reputação, estatísticas fictícias ou endpoints novos.

Validação: 130 testes do frontend, incluindo ausência de consulta global inicial de equipes, busca paginada, rota individual de liga, materiais e ingresso como reserva, além de membros no contexto da conversa. Lint, formatação, cobertura e build Vite foram verificados.

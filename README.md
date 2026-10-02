# Baila Activa · área de baile

Protótipo independente do quiz. É um site estático em espanhol LATAM com 82 vídeos públicos do YouTube, 2 playlists públicas e 3 seleções de vídeos organizadas para o app.

## Abrir

Com Node.js instalado, execute `node server.js` nesta pasta e abra `http://127.0.0.1:8765/` no Chrome. Para publicar, envie o conteúdo desta pasta a uma hospedagem estática. Não precisa de chave de API ou banco de dados. A prévia dentro do Codex pode bloquear o player incorporado; nesse caso, o app mostra um link direto para assistir no YouTube.

## O que já funciona

- Busca por aula, ritmo e canal
- Filtros por estilo e tipo de sessão
- Reprodução incorporada de vídeos e playlists
- Link para abrir a fonte original no YouTube
- Favoritos e aulas vistas salvos no dispositivo
- Layout responsivo para celular e desktop

## Estrutura

- `data.js`: catálogo curado, IDs e créditos dos canais
- `app.js`: navegação, filtros, player e progresso local
- `styles.css`: identidade visual e layout
- `assets/`: logo e foto de capa

Os vídeos pertencem aos respectivos criadores. O catálogo não baixa, copia ou reenvia o conteúdo. A página não bloqueia o acesso aos vídeos públicos nem cobra para reproduzi-los. Caso a oferta paga tenha o acesso a esses vídeos como principal entrega, substitua-os por aulas próprias ou licenciadas antes de usar como produto pago. Consulte as [políticas oficiais do YouTube](https://developers.google.com/youtube/terms/developer-policies) e a [documentação do player incorporado](https://developers.google.com/youtube/player_parameters).

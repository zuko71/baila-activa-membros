# Baila Activa · área de baile

Protótipo independente do quiz. É um site estático em espanhol LATAM com 82 vídeos públicos do YouTube, 2 playlists públicas e 3 seleções de vídeos organizadas para o app.

## Abrir

Site publicado: `https://baila-activa-membros.vercel.app/`. Com Node.js instalado, também é possível executar `node server.js` nesta pasta e abrir `http://127.0.0.1:8765/` no Chrome. A reprodução incorporada funciona no endereço HTTPS publicado. A prévia local dentro do Codex pode bloquear iframes de vídeo. Não precisa de chave de API ou banco de dados.

## O que já funciona

- Busca por aula, ritmo e canal
- Filtros por estilo e tipo de sessão
- Reprodução incorporada de vídeos e playlists
- Reprodução dentro da área de membros, com tentativa de recarga caso o navegador bloqueie o player
- Favoritos e aulas vistas salvos no dispositivo
- Layout responsivo para celular e desktop

## Estrutura

- `data.js`: catálogo curado, IDs e créditos dos canais
- `app.js`: navegação, filtros, player e progresso local
- `styles.css`: identidade visual e layout
- `assets/`: logo e foto de capa

Os vídeos pertencem aos respectivos criadores. O catálogo não baixa, copia ou reenvia o conteúdo. A página não bloqueia o acesso aos vídeos públicos nem cobra para reproduzi-los. Caso a oferta paga tenha o acesso a esses vídeos como principal entrega, substitua-os por aulas próprias ou licenciadas antes de usar como produto pago. Consulte as [políticas oficiais do YouTube](https://developers.google.com/youtube/terms/developer-policies) e a [documentação do player incorporado](https://developers.google.com/youtube/player_parameters).

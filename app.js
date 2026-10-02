(() => {
  const {videos, playlists, path: starterPath} = window.BAILA_DATA;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const storageKey = "baila-activa-membros-v1";
  let saved = {favorites: [], completed: []};
  try { saved = {...saved, ...JSON.parse(localStorage.getItem(storageKey) || "{}")}; } catch {}
  const favorites = new Set(Array.isArray(saved.favorites) ? saved.favorites : []);
  const completed = new Set(Array.isArray(saved.completed) ? saved.completed : []);
  const allowedViews = new Set(["inicio", "explorar", "colecciones", "favoritos", "progreso"]);
  const batchSize = () => matchMedia("(max-width:650px)").matches ? 6 : 12;
  const state = {view: allowedViews.has(location.hash.slice(1)) ? location.hash.slice(1) : "inicio", filter: "todos", query: "", visible: batchSize(), active: null, focusBefore: null, selectedDay: Math.max(0, starterPath.findIndex(item => !completed.has(item.id)))};
  const tagLabels = {inicio:"Para empezar",cumbia:"Cumbia",salsa:"Salsa",bachata:"Bachata",merengue:"Merengue",reggaeton:"Reggaetón",zumba:"Zumba",cardio:"Cardio dance",suave:"Sin saltos",largas:"Clase larga",latinos:"Ritmos latinos",cortas:"Clase corta"};
  let playerTimer;
  let renderedPlaylistView = "";

  function store() {
    try { localStorage.setItem(storageKey, JSON.stringify({favorites:[...favorites], completed:[...completed]})); } catch {}
  }
  function esc(s) { return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }
  function thumb(id) { return "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/mqdefault.jpg"; }
  function label(video) { return tagLabels[video.tags.find(t => t !== "latinos" && t !== "cortas")] || "Baile"; }
  function setView(view, updateHash=true) {
    if (!allowedViews.has(view)) return;
    state.view = view;
    state.visible = batchSize();
    if (updateHash && location.hash.slice(1) !== view) history.replaceState(null, "", "#" + view);
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  }
  function visibleVideos() {
    let list = videos;
    if (state.view === "favoritos") list = list.filter(v => favorites.has(v.id));
    if (state.view === "progreso") list = list.filter(v => completed.has(v.id));
    if (state.filter !== "todos" && ["inicio", "explorar"].includes(state.view)) list = list.filter(v => v.tags.includes(state.filter));
    if (state.query) {
      const q = state.query.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
      list = list.filter(v => (v.title + " " + v.channel + " " + v.tags.map(t => tagLabels[t]).join(" ")).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().includes(q));
    }
    return list;
  }
  function card(video) {
    const isFavorite = favorites.has(video.id);
    const isCompleted = completed.has(video.id);
    return `<article class="video-card">
      <button type="button" class="video-open" data-video="${esc(video.id)}" aria-label="Reproducir ${esc(video.title)}">
        <span class="thumb-wrap"><img src="${thumb(video.id)}" alt="" loading="lazy" decoding="async" width="320" height="180"><span class="thumb-play">▶</span>${video.duration ? `<span class="duration">${esc(video.duration)}</span>` : ""}</span>
        <span class="video-info"><span class="video-tag">${esc(label(video))}</span><strong>${esc(video.title)}</strong><small>${esc(video.channel)}${isCompleted ? ' <span class="seen-tag">· Vista ✓</span>' : ""}</small></span>
      </button>
      <button type="button" class="favorite-button ${isFavorite ? "is-favorite" : ""}" data-favorite="${esc(video.id)}" aria-label="${isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}" title="${isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}">${isFavorite ? "♥" : "♡"}</button>
    </article>`;
  }
  function renderVideos() {
    if (state.view === "colecciones") { $("#videoGrid").replaceChildren(); $("#emptyState").hidden = true; $("#loadMore").hidden = true; return; }
    const list = visibleVideos();
    const limit = state.view === "inicio" ? (matchMedia("(max-width:650px)").matches ? 3 : 8) : state.visible;
    $("#videoGrid").innerHTML = list.slice(0,limit).map(card).join("");
    $("#resultCount").textContent = `${list.length} ${list.length === 1 ? "video" : "videos"}`;
    $("#emptyState").hidden = list.length > 0;
    if (!list.length) {
      const empty = state.view === "favoritos" ? ["Aún no guardaste clases", "Toca el corazón de una clase para encontrarla aquí."] : state.view === "progreso" ? ["Tu camino empieza con una clase", "Después de bailar, márcala como vista para verla aquí."] : ["No encontramos clases aquí", "Prueba con otro ritmo o cambia tu búsqueda."];
      $("#emptyTitle").textContent = empty[0];
      $("#emptyDescription").textContent = empty[1];
    }
    $("#loadMore").hidden = state.view === "inicio" || list.length <= state.visible;
  }
  function renderPlaylists() {
    if (!["inicio", "colecciones"].includes(state.view) || renderedPlaylistView === state.view) return;
    const list = state.view === "inicio" ? playlists.slice(0,3) : playlists;
    $("#playlistGrid").innerHTML = list.map(p => `<button type="button" class="playlist-card tone-${esc(p.tone)}" data-playlist="${esc(p.id)}" aria-label="Abrir playlist ${esc(p.title)}">
      <span class="playlist-image"><img src="${thumb(p.preview)}" alt="" loading="lazy" decoding="async" width="320" height="180"><span class="playlist-symbol">♫</span></span>
      <span class="playlist-copy"><span>${p.ids ? "SELECCIÓN DE VIDEOS" : "PLAYLIST DE YOUTUBE"}</span><strong>${esc(p.title)}</strong><small>${esc(p.channel)}</small></span><span class="playlist-arrow">↗</span>
    </button>`).join("");
    renderedPlaylistView = state.view;
  }
  function renderPath() {
    const done = starterPath.filter(item => completed.has(item.id)).length;
    const next = starterPath.findIndex(item => !completed.has(item.id));
    const selected = starterPath[state.selectedDay] || starterPath[0];
    const video = videos.find(item => item.id === selected.id);
    $("#pathCounter").textContent = `${done} de ${starterPath.length} completados`;
    $("#pathProgressBar").style.width = `${Math.round(done / starterPath.length * 100)}%`;
    $(".path-progress").setAttribute("aria-valuenow", String(done));
    $("#pathProgressSummary").textContent = done === starterPath.length ? "¡Terminaste los 7 días! Repite tus clases favoritas o descubre un ritmo nuevo." : `Llevas ${done} de ${starterPath.length} días. ${done ? "Sigue cuando te apetezca, sin perder tu avance." : "Comienza por el día 1 y avanza a tu ritmo."}`;
    if (state.view !== "inicio") return;
    $("#pathDays").innerHTML = starterPath.map((item, index) => `<button type="button" data-day="${index}" class="path-day ${state.selectedDay === index ? "is-active" : ""} ${completed.has(item.id) ? "is-complete" : ""}" aria-pressed="${state.selectedDay === index}" aria-label="Día ${index + 1}${completed.has(item.id) ? ", visto" : ""}"><span>${completed.has(item.id) ? "✓" : String(index + 1)}</span><small>Día ${index + 1}</small></button>`).join("");
    $("#pathLabel").textContent = `DÍA ${state.selectedDay + 1} · ${selected.time}`;
    $("#pathTitle").textContent = video.title;
    $("#pathDescription").textContent = selected.note;
    $("#pathChannel").textContent = video.channel;
    const image = $("#pathThumb");
    const imageUrl = thumb(selected.id);
    if (image.getAttribute("src") !== imageUrl) image.src = imageUrl;
    image.alt = `Vista previa de ${video.title}`;
    $("#playPath").dataset.video = selected.id;
    $("#startFeatured").dataset.video = starterPath[next < 0 ? 0 : next].id;
    $("#startFeatured").innerHTML = `${done ? (next < 0 ? "Volver a bailar" : `Continuar: día ${next + 1}`) : "Empezar con el día 1"} <span>▶</span>`;
  }
  function renderProgress() {
    $("#statVideos").textContent = videos.length;
    $("#statPlaylists").textContent = playlists.length;
    $("#statCompleted").textContent = completed.size;
    $("#progressNumber").textContent = completed.size;
    $("#progressBar").style.width = Math.min(100, Math.round(completed.size / videos.length * 100)) + "%";
    $("#progressMessage").textContent = completed.size ? `Ya marcaste ${completed.size} ${completed.size === 1 ? "clase como vista" : "clases como vistas"}. Elige la siguiente cuando te apetezca.` : "Empieza con una clase y marca tu avance después de verla.";
  }
  function render() {
    $$(".nav-item").forEach(b => {const active=b.dataset.view === state.view;b.classList.toggle("is-active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current");});
    $$(".home-only").forEach(el => el.hidden = state.view !== "inicio");
    $("#collectionsSection").hidden = !["inicio","colecciones"].includes(state.view);
    $("#librarySection").hidden = state.view === "colecciones";
    $("#progressSection").hidden = state.view !== "progreso";
    $("#filterRow").hidden = !["inicio","explorar"].includes(state.view);
    const headings = {
      inicio:["BIBLIOTECA","Elige tu próxima clase","Explora por ritmo o encuentra algo nuevo."],
      explorar:["TODAS LAS AULAS","Explora la biblioteca","Filtra por ritmo o escribe lo que te gustaría bailar."],
      favoritos:["GUARDADAS PARA TI","Mis favoritos","Tus clases preferidas, siempre a mano."],
      progreso:["TU RECORRIDO","Clases que ya viste","Vuelve a bailar cualquiera de ellas."],
    };
    const [kicker,title,subtitle] = headings[state.view] || headings.inicio;
    $("#libraryKicker").textContent = kicker; $("#libraryTitle").textContent = title; $("#librarySubtitle").textContent = subtitle;
    $$(".filter-chip").forEach(b => b.classList.toggle("is-active", b.dataset.filter === state.filter));
    renderProgress(); renderPath(); renderPlaylists(); renderVideos();
  }
  function openPlayer(type, id) {
    const item = type === "video" ? videos.find(v => v.id === id) : playlists.find(p => p.id === id);
    if (!item) return;
    state.active = {type,id};
    if ($("#playerModal").hidden) state.focusBefore = document.activeElement;
    $("#playerTitle").textContent = item.title;
    $("#playerChannel").textContent = item.channel + " · YouTube";
    $("#markComplete").hidden = type !== "video";
    $("#toggleFavorite").hidden = type !== "video";
    $("#markComplete").textContent = completed.has(id) ? "Vista ✓" : "Marcar como vista";
    $("#toggleFavorite").textContent = favorites.has(id) ? "Quitar de favoritos" : "Añadir a favoritos";
    const next = $("#nextPlayer");
    if (type === "video") {
      const pathIndex = starterPath.findIndex(item => item.id === id);
      const nextId = pathIndex >= 0 && pathIndex < starterPath.length - 1 ? starterPath[pathIndex + 1].id : videos[(videos.findIndex(item => item.id === id) + 1) % videos.length].id;
      next.dataset.video = nextId;
      next.hidden = false;
    } else {
      next.hidden = true;
      delete next.dataset.video;
    }
    const frame = document.createElement("iframe");
    frame.title = item.title;
    frame.src = type === "video" ? `https://www.youtube.com/embed/${encodeURIComponent(id)}?rel=0&playsinline=1&hl=es-419` : item.ids ? `https://www.youtube.com/embed/${encodeURIComponent(item.ids[0])}?playsinline=1&hl=es-419&playlist=${item.ids.slice(1).map(encodeURIComponent).join(",")}` : `https://www.youtube.com/embed?listType=playlist&list=${encodeURIComponent(id)}&playsinline=1&hl=es-419`;
    frame.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    frame.referrerPolicy = "strict-origin-when-cross-origin";
    frame.allowFullscreen = true;
    const preview = document.createElement("div");
    preview.className = "player-preview";
    preview.innerHTML = `<img src="${thumb(type === "video" ? id : item.preview)}" alt="" decoding="async"><div class="player-preview-copy"><span class="player-spinner" aria-hidden="true"></span><strong>Cargando el video…</strong><small>Un momento, por favor.</small></div>`;
    const showFallback = () => {
      if (state.active?.id !== id || !preview.isConnected) return;
      preview.classList.add("is-fallback");
      preview.querySelector(".player-preview-copy").innerHTML = `<span class="player-fallback-icon" aria-hidden="true">▶</span><strong>No se pudo abrir el reproductor aquí</strong><small>Vuelve a intentarlo o abre esta área en un navegador actualizado.</small><button type="button" data-retry-player>Intentar de nuevo ↻</button>`;
    };
    const loaded = () => {
      if (state.active?.id !== id) return;
      try {
        if (frame.contentWindow?.location.href === "about:blank") return;
      } catch {
        clearTimeout(playerTimer);
        preview.hidden = true;
        return;
      }
    };
    frame.addEventListener("load", loaded);
    frame.addEventListener("error", showFallback);
    $("#playerFrame").replaceChildren(frame, preview);
    clearTimeout(playerTimer);
    playerTimer = setTimeout(() => {
      if (!preview.hidden) showFallback();
    }, 6500);
    $("#playerModal").hidden = false;
    document.body.classList.add("modal-open");
    $("#closePlayer").focus();
  }
  function closePlayer() {
    clearTimeout(playerTimer);
    $("#playerModal").hidden = true;
    $("#playerFrame").replaceChildren();
    document.body.classList.remove("modal-open");
    state.active = null;
    state.focusBefore?.focus?.();
  }
  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-view]");
    if (nav) { setView(nav.dataset.view); return; }
    const day = e.target.closest("[data-day]");
    if (day) { state.selectedDay = Number(day.dataset.day); renderPath(); $("#pathDays").querySelector(`[data-day="${state.selectedDay}"]`)?.focus(); return; }
    const filter = e.target.closest("[data-filter]");
    if (filter) { state.filter = filter.dataset.filter; state.visible = batchSize(); renderVideos(); $$(".filter-chip").forEach(b=>b.classList.toggle("is-active",b===filter)); return; }
    const favorite = e.target.closest("[data-favorite]");
    if (favorite) { const id=favorite.dataset.favorite; favorites.has(id) ? favorites.delete(id) : favorites.add(id); store(); renderVideos(); return; }
    const video = e.target.closest("[data-video]");
    if (video) { openPlayer("video",video.dataset.video); return; }
    const playlist = e.target.closest("[data-playlist]");
    if (playlist) { openPlayer("playlist",playlist.dataset.playlist); return; }
  });
  let searchTimer;
  $("#searchInput").addEventListener("input", e => { const value = e.target.value.trim(); clearTimeout(searchTimer); searchTimer = setTimeout(() => { state.query = value; if (state.query) state.filter = "todos"; if (state.query && state.view !== "explorar") setView("explorar"); else {state.visible=batchSize();render();} }, 120); });
  $("#loadMore").addEventListener("click", () => { state.visible += batchSize(); renderVideos(); });
  $("#emptyAction").addEventListener("click", () => { state.query = ""; state.filter = "todos"; $("#searchInput").value = ""; setView("explorar"); });
  $("#closePlayer").addEventListener("click", closePlayer);
  $("#playerModal").addEventListener("click", e => { if (e.target === $("#playerModal")) closePlayer(); });
  $("#playerModal").addEventListener("click", e => { if (e.target.closest("[data-retry-player]") && state.active) { const {type,id}=state.active; const focusBefore=state.focusBefore; openPlayer(type,id); state.focusBefore=focusBefore; } });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#playerModal").hidden) closePlayer(); });
  $("#markComplete").addEventListener("click", () => { if (!state.active || state.active.type !== "video") return; const id=state.active.id; completed.has(id) ? completed.delete(id) : completed.add(id); store(); $("#markComplete").textContent=completed.has(id)?"Vista ✓":"Marcar como vista"; renderProgress(); renderPath(); renderVideos(); });
  $("#toggleFavorite").addEventListener("click", () => { if (!state.active || state.active.type !== "video") return; const id=state.active.id; favorites.has(id) ? favorites.delete(id) : favorites.add(id); store(); $("#toggleFavorite").textContent=favorites.has(id)?"Quitar de favoritos":"Añadir a favoritos"; renderVideos(); });
  window.addEventListener("hashchange", () => { const view=location.hash.slice(1); if (allowedViews.has(view)) setView(view,false); });
  render();
})();

const CACHE_NAME = "pulse-v1";

// Rotas que NAO devem ser interceptadas pelo SW
const BYPASS_ROUTES = ["/dashboard", "/atividades", "/treino", "/social", "/perfil"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Safari fix: nunca interceptar navegacao entre rotas
  // que causam redirecionamento.
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request));
    return;
  }

  if (BYPASS_ROUTES.includes(url.pathname)) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Nao interceptar requisicoes cross-origin.
  if (url.origin !== location.origin) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Nao interceptar APIs externas (clima, mapas).
  if (
    url.hostname.includes("openweathermap") ||
    url.hostname.includes("googleapis") ||
    url.hostname.includes("maps.google")
  ) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para todo o resto: tenta rede primeiro, fallback no cache.
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Safari fix: nunca cachear respostas com redirecionamento.
        if (
          !response ||
          response.status !== 200 ||
          response.type === "opaqueredirect" ||
          response.redirected
        ) {
          return response;
        }

        // Cachear apenas recursos estaticos validos.
        if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/)) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => caches.match(e.request)),
  );
});

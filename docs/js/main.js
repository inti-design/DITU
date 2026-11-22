(() => {
  "use strict";

  const formatos = {
    windows: ["Windows", "zip"],
    linux: ["Linux", "tar.gz"],
    android: ["Android", "apk"]
  };

  async function cargarDescargas() {
    const respuesta = await fetch("./downloads.json", { cache: "no-cache" });
    if (!respuesta.ok) throw new Error("Configuración no disponible");
    const { version, repositorio, descargas } = await respuesta.json();
    if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version) ||
        typeof repositorio !== "string" || !/^https:\/\/github\.com\/[\w-]+\/DITU$/.test(repositorio) ||
        !descargas) {
      throw new Error("Configuración de descargas inválida");
    }

    for (const tarjeta of document.querySelectorAll("[data-plataforma]")) {
      const plataforma = tarjeta.dataset.plataforma;
      const [nombre, extension] = formatos[plataforma];
      const archivo = `DITU-${nombre}-v${version}.${extension}`;
      const url = `${repositorio}/releases/download/v${version}/${archivo}`;
      tarjeta.querySelector(".archivo").textContent = archivo;
      if (descargas[plataforma]?.disponible !== true || descargas[plataforma].url !== url) continue;

      const boton = tarjeta.querySelector(".boton");
      const enlace = document.createElement("a");
      enlace.className = boton.className;
      enlace.href = url;
      enlace.textContent = boton.textContent;
      tarjeta.classList.add("disponible");
      tarjeta.querySelector(".estado").textContent = "Disponible";
      boton.replaceWith(enlace);
    }
  }

  const aviso = document.getElementById("aviso");
  if (location.protocol === "file:") {
    aviso.textContent = "Abre la página desde un servidor HTTP para consultar las descargas.";
  } else {
    cargarDescargas().catch(() => {
      aviso.textContent = "No se pudieron consultar las descargas. Inténtalo más tarde.";
    });
  }

  const lienzo = document.getElementById("estrellas");
  const contexto = lienzo.getContext("2d");
  if (!contexto) return;
  const reducir = window.matchMedia("(prefers-reduced-motion: reduce)");
  const estrellas = Array.from({ length: 72 }, () => ({
    x: Math.random(), y: Math.random(), luz: .14 + Math.random() * .64,
    fase: Math.random() * 6.28, radio: .38 + Math.random() * .75
  }));
  let ancho, alto, fotograma = 0, ultimo = 0;
  function dibujar(tiempo) {
    contexto.clearRect(0, 0, ancho, alto);
    for (const astro of estrellas) {
      const destello = reducir.matches ? 1 : .75 + Math.sin(astro.fase + tiempo * .0011) * .25;
      contexto.fillStyle = "rgba(255,215,195," + astro.luz * destello + ")";
      contexto.beginPath();
      contexto.arc(astro.x * ancho, astro.y * alto, astro.radio, 0, Math.PI * 2);
      contexto.fill();
    }
  }
  function animar(tiempo) {
    if (document.hidden || reducir.matches) { fotograma = 0; return; }
    if (tiempo - ultimo >= 40) { ultimo = tiempo; dibujar(tiempo); }
    fotograma = requestAnimationFrame(animar);
  }
  function reiniciar() {
    cancelAnimationFrame(fotograma);
    fotograma = 0;
    ancho = lienzo.clientWidth;
    alto = lienzo.clientHeight;
    const resolucion = Math.min(window.devicePixelRatio || 1, 1.5);
    lienzo.width = Math.round(ancho * resolucion);
    lienzo.height = Math.round(alto * resolucion);
    contexto.setTransform(resolucion, 0, 0, resolucion, 0, 0);
    dibujar(0);
    if (!document.hidden && !reducir.matches) fotograma = requestAnimationFrame(animar);
  }
  window.addEventListener("resize", reiniciar);
  document.addEventListener("visibilitychange", reiniciar);
  reducir.addEventListener("change", reiniciar);
  reiniciar();
})();

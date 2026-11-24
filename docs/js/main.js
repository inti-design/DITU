(() => {
  "use strict";

  const formatos = {
    windows: ["Windows", "zip"],
    linux: ["Linux", "tar.gz"],
    android: ["Android", "apk"]
  };

  function mostrarLauncher(config, repositorio) {
    if (config?.disponible !== true || repositorio !== "https://github.com/inti-design/DITU" ||
        typeof config.version !== "string" || !/^\d+\.\d+\.\d+$/.test(config.version) ||
        config.etiqueta !== "launcher-v" + config.version) return;

    const archivo = "DITU-Launcher-Windows-x64-v" + config.version + "-Setup.exe";
    const url = repositorio + "/releases/download/" + config.etiqueta + "/" + archivo;
    if (config.archivos?.windows?.disponible !== true || config.archivos.windows.url !== url) return;

    const boton = document.getElementById("launcher-cta");
    boton.href = url;
    boton.hidden = false;
  }

  async function cargarDescargas() {
    const respuesta = await fetch("./downloads.json", { cache: "no-cache" });
    if (!respuesta.ok) throw new Error("Configuración no disponible");
    const { version, repositorio, descargas, launcher } = await respuesta.json();
    if (typeof version !== "string" || !/^\d+\.\d+\.\d+$/.test(version) ||
        typeof repositorio !== "string" || !/^https:\/\/github\.com\/[\w-]+\/DITU$/.test(repositorio) ||
        !descargas) {
      throw new Error("Configuración de descargas inválida");
    }

    mostrarLauncher(launcher, repositorio);

    for (const tarjeta of document.querySelectorAll("[data-plataforma]")) {
      const plataforma = tarjeta.dataset.plataforma;
      const [nombre, extension] = formatos[plataforma];
      const descarga = descargas[plataforma];
      const pruebas = descarga?.pruebas === true;
      const base = `DITU-${nombre}-v${version}`;
      const raiz = `${repositorio}/releases/download/v${version}/`;
      const archivoPruebas = `${base}-pruebas.${extension}`;
      const archivo = pruebas && descarga.url === raiz + archivoPruebas ? archivoPruebas : `${base}.${extension}`;
      const url = raiz + archivo;
      tarjeta.querySelector(".archivo").textContent = archivo;
      if (descarga?.disponible !== true || descarga.url !== url) continue;

      const boton = tarjeta.querySelector(".boton");
      const estado = tarjeta.querySelector(".estado");
      const enlace = document.createElement("a");
      enlace.className = boton.className;
      enlace.href = url;
      enlace.textContent = boton.textContent;
      enlace.setAttribute("aria-describedby", estado.id);
      tarjeta.classList.add("disponible");
      estado.textContent = pruebas ? "Versión de prueba" : "Disponible";
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

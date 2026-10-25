# Ruta con Historia: Asturias y Cantabria

Una web app (PWA) para el móvil que, mientras viajas en coche, sigue tu posición por GPS y te cuenta en voz alta curiosidades y efemérides de cada lugar por el que pasas. Incluye 45 lugares de Asturias y Cantabria, un registro del viaje con mapa y una ruta de prueba para ensayar en casa.

## Ponerla en el móvil (Android)

El GPS solo funciona desde una dirección `https`. Este repositorio ya está listo para **GitHub Pages**: en el repositorio, Settings, Pages, Source: *Deploy from a branch*, rama `main`, carpeta `/ (root)`. En un par de minutos la app estará en `https://infanteeric03-spec.github.io/efem-rides/`.

Otras opciones:

- **Netlify Drop**: entra en app.netlify.com/drop y arrastra esta carpeta ya descomprimida. Puede pedirte crear una cuenta gratuita para que el sitio no caduque.
- **Cloudflare Pages**: crea un proyecto y sube la carpeta.

Después, en el móvil:

1. Abre la dirección en Chrome, con cobertura.
2. Menú de Chrome (los tres puntos), **Instalar app** o **Añadir a la pantalla de inicio**.
3. Abre la app instalada una vez con datos para que guarde todo. A partir de ahí abre sin cobertura.
4. Al pulsar **Empezar viaje**, concede el permiso de ubicación.

## En el coche

- Móvil en el soporte y conectado al cargador. La pantalla debe seguir encendida: si se apaga, Chrome suspende el GPS y la voz. La app pide que no se apague y tiene un modo de pantalla tenue en Ajustes.
- Configura todo antes de arrancar. Está pensada para escucharla, no para mirarla.
- Si el móvil está en el modo de ahorro de batería, puede cortar el GPS. Desactívalo para Chrome durante el viaje.

## Probar en casa

En Ajustes, bajo **Probar sin salir de casa**, hay cuatro rutas simuladas (por ejemplo, Ribadesella a Santander, que cruza de Asturias a Cantabria). La prueba no se guarda en tu viaje.

## Qué hace

- Avisa al entrar en cada lugar y cuenta un dato; si sigues dentro, cuenta más (hasta tres).
- Avisa del siguiente lugar cuando te acercas a uno que aún no has visto.
- Dice "Entrando en Cantabria" o "Entrando en Asturias" al cruzar.
- Al empezar, cuenta la efeméride del día, o una del mes si no hay del día.
- Guarda el recorrido, calcula distancia y velocidades, y lo exporta como GPX.

## Añadir o corregir lugares

Los datos están en `data-asturias.js` y `data-cantabria.js`. Cada lugar tiene este formato:

```js
add("id-unico", "Nombre", latitud, longitud, radioEnKm, [
  "Primer dato (presentación).",
  "Segundo dato.",
]);
```

Las efemérides con fecha están en `data-dias.js`. Escribe las cifras en letra cuando quieras controlar cómo las lee la voz (por ejemplo, "siglo ocho").

## Aviso sobre los datos

Los datos son una selección propia, hecha a partir de conocimiento general y sin conexión a Wikipedia, y no se han contrastado con fuentes primarias. Hay fechas que la tradición discute (por ejemplo, la batalla de Covadonga). Antes de citar alguna cifra o fecha en público, compruébala.

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
- Modo ahorro en Ajustes: atiende una posición cada 3 o 5 segundos (por defecto, todas, que suele ser una por segundo). Reduce el trabajo del móvil, pero el GPS sigue encendido, así que la batería mejora poco. Lo que más gasta es la pantalla.
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

Los datos son una selección propia. En octubre de 2026 se revisaron las fechas y cifras con más riesgo de error contrastándolas con fuentes web (Turismo de Asturias y de Cantabria, Wikipedia, RAE, prensa regional) y se corrigieron las que no cuadraban. Hay fechas que la tradición discute, como la batalla de Covadonga (718 o 722) o el lugar de nacimiento de Juan de la Cosa, y así se indica en la propia app. Antes de citar alguna cifra en público, compruébala.

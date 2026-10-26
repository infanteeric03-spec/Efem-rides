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

- En la pantalla de inicio, la señal muestra la **provincia y la localidad** donde está el móvil (por GPS y OpenStreetMap; sin conexión, el lugar conocido más cercano). La tarjeta de efemérides muestra varias de esa provincia, con **Anterior** y **Siguiente** o deslizando el dedo: primero las de hoy en Wikipedia que mencionan la provincia o la localidad, después las propias de Asturias y Cantabria más cercanas en el calendario y, si hacen falta, las de hoy en España.
- Al abrir la app con un viaje sin terminar (de menos de 12 horas), elige **Continuar** para seguirlo o **Nuevo viaje** para empezar de cero. Mientras no hay viaje en marcha, los contadores de la pestaña Ruta están a cero; el viaje guardado se ve en la pestaña Viaje.
- Al empezar el viaje se abre la **vista de conducción**, dividida en zonas de altura fija para que los botones no se muevan nunca durante el viaje: arriba la señal con el lugar, el próximo lugar y la distancia (el nombre se encoge si es largo), la radio y **Mostrar contenido**; abajo, los botones grandes. **Mostrar contenido** y **Parar viaje** piden un segundo toque. El texto se abre en una ventana sobre la señal que se cierra sola a los 30 segundos o al llegar a otro lugar. En Ajustes se puede ocultar el texto durante el viaje (la voz sigue contando los datos) o desactivar la vista de conducción.
- Avisa al entrar en cada lugar y cuenta un dato; si sigues dentro, cuenta más (hasta tres).
- Avisa del siguiente lugar cuando te acercas a uno que aún no has visto.
- Dice "Entrando en Cantabria" o "Entrando en Asturias" al cruzar.
- Al empezar, cuenta la efeméride del día, o una del mes si no hay del día.
- Modo ahorro en Ajustes: atiende una posición cada 3 o 5 segundos (por defecto, todas, que suele ser una por segundo). Reduce el trabajo del móvil, pero el GPS sigue encendido, así que la batería mejora poco. Lo que más gasta es la pantalla.
- Guarda el recorrido, calcula distancia y velocidades, y lo exporta como GPX.

## Destinos nuevos

Para viajar fuera de los lugares que trae la app (por ejemplo, Oviedo–León):

1. En la pestaña **Lugares**, debajo del buscador, pulsa **+ Viaje a un nuevo destino**, escribe el destino (y el origen si no sales de donde estás) y pulsa **Preparar viaje**. Hazlo con cobertura, mejor con wifi.
2. La app calcula la ruta con OSRM (sobre OpenStreetMap), busca en Wikipedia los pueblos y lugares a menos de unos 4 km de la carretera, se queda con los más relevantes (uno cada 3 km como mucho) y guarda su resumen en el móvil. En el coche funciona sin conexión.
3. Indica también la **fecha de salida**. La app busca efemérides de ese día (en Wikipedia y en sus datos propios) que mencionen los pueblos del camino y las muestra en el resumen. Si viajas ese día, al entrar en cada uno de esos pueblos te cuenta primero su efeméride ("Un día como hoy…"). Las efemérides propias con fecha (por ejemplo, Severo Ochoa en Luarca el 24 de septiembre) se cuentan siempre que pases por el lugar ese día, prepares ruta o no.
4. Para probarla antes de salir: **Ajustes, Probar sin salir de casa**, elige **Ruta preparada**.

Además, con **Buscar lugares sobre la marcha** activado y cobertura, la app consulta Wikipedia unos 7 km por delante cuando no tiene lugares guardados en esa dirección.

Los lugares propios de Asturias y Cantabria tienen prioridad: no se añade ningún pueblo de Wikipedia a menos de 3 km de uno de ellos. Los textos de Wikipedia se publican con licencia CC BY-SA; cada lugar enlaza a su artículo en la pestaña Lugares.

## App Android

Además de la web, el repositorio genera una **app Android** (carpeta `app/`, hecha con Capacitor a partir de la misma web). Frente a la web tiene tres ventajas:

- **La voz baja la música de otras apps** (Spotify, YouTube Music…) mientras cuenta un dato y la vuelve a subir al terminar, igual que las indicaciones de Google Maps.
- **Sigue funcionando con la pantalla apagada**: el GPS usa un servicio de Android con una notificación fija ("Siguiendo el viaje…").
- Se abre como cualquier app, sin navegador.

### Instalarla

1. En el móvil, abre la página de **Releases** del repositorio y descarga `ruta-con-historia.apk` de la última versión (o directamente: `https://github.com/infanteeric03-spec/efem-rides/releases/latest/download/ruta-con-historia.apk`).
2. Ábrelo. Android pedirá permitir **instalar apps de origen desconocido** para el navegador o el gestor de archivos: acéptalo solo para esto.
3. Al abrir la app y pulsar Empezar viaje, concede **ubicación** y **notificaciones**.

Cada vez que se suben cambios a `main`, GitHub compila una versión nueva (pestaña **Actions**). Para actualizar, descarga el APK nuevo e instálalo encima: se conservan tus ajustes y viajes.

La app está firmada con una clave de uso personal incluida en el repositorio (`app/android/app/ruta-con-historia.keystore`). Sirve para instalarla y actualizarla en tus móviles, no para publicarla en Google Play.

## Radio

La pestaña **Radio** reproduce emisoras por internet. Vienen como favoritas Europa FM, COPE, Cadena SER, LOS40 y LOS40 Classic, y con el buscador se puede añadir cualquier otra. Las emisoras se buscan en [Radio Browser](https://www.radio-browser.info), un directorio público y gratuito, así que la app usa siempre el enlace vigente de cada una.

- Mientras la app cuenta un dato, la radio baja (o se pausa, según Ajustes de la pestaña Radio) y vuelve a subir al terminar.
- Si se corta por falta de cobertura, reconecta sola cuando vuelve la señal.
- En la vista de conducción hay dos botones: **Radio** (encender o apagar) y **Otra radio**.
- Al pulsar **Parar viaje** se para también la radio.
- El buscador permite elegir país: España, República Dominicana o todos. Sin escribir nada, muestra las emisoras más escuchadas del país elegido.
- Gasta unos 60 MB de datos por hora.

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

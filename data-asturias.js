/* Lugares de Asturias: coordenadas aproximadas, radio de detección (km) y datos.
   El primer dato de cada lugar es la presentación; el resto se cuentan después. */
(function (root) {
  var L = root.LUGARES = root.LUGARES || [];
  var A = "AST";
  function add(id, n, lat, lon, rad, h) { L.push({ id: id, n: n, reg: A, lat: lat, lon: lon, rad: rad, h: h }); }

  add("oviedo", "Oviedo", 43.3614, -5.8494, 5, [
    "Oviedo, capital del Principado. La ciudad nació en el año 761 en torno a un monasterio fundado por los monjes Máximo y Fromestano, y fue sede de la corte asturiana desde finales del siglo ocho, con Alfonso Segundo el Casto.",
    "El prerrománico asturiano de Oviedo es Patrimonio Mundial de la UNESCO. Santa María del Naranco y San Miguel de Lillo, en las faldas del monte Naranco, se levantaron en el siglo nueve, en tiempos de Ramiro Primero.",
    "En la Cámara Santa de la catedral se guardan la Cruz de los Ángeles, del año 808, y la Cruz de la Victoria, del 908, que es hoy el símbolo de Asturias.",
    "Oviedo es la Vetusta de La Regenta, la novela de Leopoldo Alas Clarín publicada entre 1884 y 1885. En la calle Milicias hay una estatua de Woody Allen, colocada en 2003.",
    "La Universidad de Oviedo abrió sus aulas en 1608. Cada octubre, el Teatro Campoamor acoge la entrega de los Premios Princesa de Asturias.",
    "En octubre de 1934, la Revolución de Asturias causó graves daños en la ciudad. La Cámara Santa de la catedral quedó muy dañada por una explosión y fue reconstruida después."
  ]);

  add("gijon", "Gijón", 43.5322, -5.6611, 6, [
    "Gijón, la ciudad más poblada de Asturias, se abre a la bahía de San Lorenzo. Su barrio viejo, Cimadevilla, ocupa una pequeña península que ya habitaron los romanos.",
    "En Cimadevilla están las termas romanas de Campo Valdés. En lo alto del cerro de Santa Catalina se alza Elogio del Horizonte, la escultura de Eduardo Chillida inaugurada en 1990.",
    "Gaspar Melchor de Jovellanos, escritor, jurista y político de la Ilustración, nació en Gijón en 1744.",
    "La Laboral, cuyas obras empezaron en 1946, nació como un centro para los huérfanos de mineros. Su torre mide 117 metros, y desde 2007 es la Laboral Ciudad de la Cultura.",
    "El Real Sporting se fundó en 1905 y juega en El Molinón, un estadio que se inauguró en 1908."
  ]);

  add("aviles", "Avilés", 43.5547, -5.9248, 4, [
    "Avilés tiene un casco histórico muy bien conservado, con calles con soportales como la de Galiana y plazas de aire medieval.",
    "En Avilés nació en 1519 Pedro Menéndez de Avilés, que fundó San Agustín, en Florida, en 1565, una de las ciudades más antiguas de Estados Unidos.",
    "El Centro Niemeyer, inaugurado en 2011 junto a la ría, es la única obra en España del arquitecto brasileño Oscar Niemeyer.",
    "La siderurgia de Ensidesa, empresa creada en 1950, transformó la economía y el paisaje de toda la comarca de Avilés."
  ]);

  add("peñas", "Cabo de Peñas", 43.6556, -5.8480, 3, [
    "Cabo de Peñas, el punto más septentrional de Asturias. Su faro se encendió por primera vez en 1852, sobre acantilados que caen al Cantábrico.",
    "Es un lugar muy conocido para observar aves marinas durante sus migraciones, y también por sus temporales, que han hundido barcos a lo largo de la historia."
  ]);

  add("cudillero", "Cudillero", 43.5617, -6.1456, 3, [
    "Cudillero, un pueblo marinero con las casas colgadas en forma de anfiteatro sobre el puerto.",
    "Sus vecinos hablan el pixueto, una variedad propia de la lengua asturiana que se conserva casi solo en este pueblo y sus alrededores."
  ]);

  add("luarca", "Luarca", 43.5420, -6.5350, 3, [
    "Luarca, la Villa Blanca de la Costa Verde, con casas escalonadas a ambos lados del río Negro, justo antes de que desemboque en el mar.",
    "En Luarca nació en 1905 Severo Ochoa, Premio Nobel de Medicina en 1959.",
    "El cementerio de Luarca está sobre un acantilado, junto al faro y la ermita de la Blanca, en la Atalaya, con vistas abiertas al Cantábrico. Es uno de los rincones más fotografiados de la villa."
  ]);

  add("pravia", "Pravia", 43.4833, -6.1167, 3, [
    "Pravia fue capital del reino de Asturias entre los años 774 y 783, durante el reinado de Silo.",
    "La iglesia de Santianes, mandada construir en tiempos de Silo, es uno de los ejemplos más antiguos del prerrománico asturiano, aunque ha sido reformada a lo largo de los siglos."
  ]);

  add("salas", "Salas", 43.4130, -6.2530, 3, [
    "Salas, villa del Camino Primitivo de Santiago, con una colegiata y un palacio renacentista de los Valdés Salas.",
    "Aquí nació en 1483 Fernando de Valdés Salas, inquisidor general y fundador de la Universidad de Oviedo."
  ]);

  add("cangas-onis", "Cangas de Onís", 43.3510, -5.1290, 3.5, [
    "Cangas de Onís fue la primera capital del reino de Asturias, con Pelayo, su hijo Favila y Alfonso Primero, en el siglo ocho.",
    "El Puente Romano, de un solo arco apuntado sobre el río Sella, es en realidad de origen medieval. Bajo su arco cuelga una réplica de la Cruz de la Victoria.",
    "La capilla de Santa Cruz, en las afueras, se levantó en el año 737 sobre un dolmen de la prehistoria."
  ]);

  add("covadonga", "Covadonga", 43.3086, -4.9863, 4, [
    "Covadonga. Según la tradición, aquí venció Pelayo en el año 718, aunque muchos historiadores lo sitúan hacia el 722, un hecho considerado el inicio simbólico del reino de Asturias y de la Reconquista.",
    "La Santa Cueva guarda la imagen de la Santina, la Virgen de Covadonga, y el panteón real con los restos atribuidos a Pelayo, su esposa Gaudiosa, Alfonso Primero y Ermesinda.",
    "La basílica neorrománica se levantó a finales del siglo diecinueve. El Parque Nacional de la Montaña de Covadonga, declarado en 1918, es el primero de España.",
    "En la montaña, a unos doce kilómetros, están los lagos de Enol y de la Ercina. El ocho de septiembre es el Día de Asturias, dedicado a la Virgen de Covadonga."
  ]);

  add("arriondas", "Arriondas", 43.3833, -5.2000, 3, [
    "Arriondas, a orillas del Sella, es el punto de salida del Descenso del Sella, la fiesta de las piraguas que baja hasta Ribadesella.",
    "El Descenso del Sella se celebra desde 1930, el primer fin de semana de agosto, y es Fiesta de Interés Turístico Internacional. Lo impulsó Dionisio de la Huerta.",
    "Cerca, el mirador del Fito ofrece vistas a la costa y a los Picos de Europa."
  ]);

  add("ribadesella", "Ribadesella", 43.4636, -5.0586, 3.5, [
    "Ribadesella, en la desembocadura del Sella, es la meta del Descenso de las piraguas.",
    "La cueva de Tito Bustillo la descubrió en 1968 un grupo de jóvenes espeleólogos. Lleva el nombre de uno de ellos, Celestino Fernández Bustillo, Tito, que murió pocas semanas después. Algunas de sus pinturas tienen más de treinta mil años, y es Patrimonio Mundial desde 2008."
  ]);

  add("lastres", "Lastres", 43.5148, -5.2689, 3, [
    "Lastres, un pueblo de casas en cuesta sobre el mar, que fue escenario de la serie Doctor Mateo.",
    "Estás en la Costa de los Dinosaurios: en estos acantilados hay huellas de dinosaurios del Jurásico, de hace unos ciento cincuenta millones de años.",
    "En Colunga, muy cerca, el Museo del Jurásico de Asturias, inaugurado en 2004, tiene forma de huella de dinosaurio."
  ]);

  add("villaviciosa", "Villaviciosa", 43.4800, -5.4330, 3.5, [
    "Villaviciosa, la capital de la manzana, el corazón de la sidra natural asturiana.",
    "En Tazones, en la costa de este concejo, desembarcó en 1517 Carlos Primero, que llegó a Asturias tras una tormenta cuando iba a tomar posesión de sus reinos.",
    "El monasterio de San Salvador de Valdediós, junto a Villaviciosa, tiene una iglesia prerrománica consagrada en el año 893."
  ]);

  add("llanes", "Llanes", 43.4200, -4.7550, 4, [
    "Llanes, con restos de murallas medievales, un puerto pesquero y el paseo de San Pedro sobre el mar.",
    "En el rompeolas del puerto están los Cubos de la Memoria, bloques de hormigón que Agustín Ibarrola empezó a pintar en 2001.",
    "En agosto, Llanes celebra las fiestas de San Roque, con ramos, gaiteros y mucha sidra."
  ]);

  add("gulpiyuri", "Playa de Gulpiyuri", 43.4430, -4.8480, 1.5, [
    "Playa de Gulpiyuri, una de las playas interiores más famosas del mundo: está en un prado, a unos cien metros del mar, y el agua entra por túneles bajo la roca.",
    "Su arena y su agua cambian con las mareas, porque el mar llega hasta ella por galerías naturales."
  ]);

  add("cabrales", "Arenas de Cabrales", 43.3042, -4.8206, 4, [
    "Arenas de Cabrales, el centro del concejo del queso Cabrales, un queso azul que madura en cuevas naturales de la montaña.",
    "El Naranjo de Bulnes, o Picu Urriellu, de 2.519 metros, lo escalaron por primera vez en 1904 Pedro Pidal y Gregorio Pérez, El Cainejo.",
    "Desde Poncebos arranca la Ruta del Cares, de unos doce kilómetros, por la garganta del río Cares hasta Caín."
  ]);

  add("nava", "Nava", 43.3500, -5.5083, 3, [
    "Nava, la capital de la sidra. Aquí está el Museo de la Sidra Asturiana, que explica cómo se elabora y se sirve.",
    "La sidra asturiana se escancia: se sirve desde lo alto, con un chorro fino que rompe en el vaso para que se oxigene, y se bebe un culín, que es una pequeña cantidad."
  ]);

  add("mieres", "Mieres", 43.2500, -5.7700, 4, [
    "Mieres, el corazón de la cuenca minera del Caudal, una ciudad marcada por el carbón, el hierro y las luchas obreras.",
    "La Revolución de octubre de 1934 tuvo su principal foco en las cuencas mineras, entre ellas la del Caudal."
  ]);

  add("entrego", "El Entrego", 43.2950, -5.6150, 2.5, [
    "El Entrego, en San Martín del Rey Aurelio, donde está el Museo de la Minería y de la Industria de Asturias, con un recorrido por una mina recreada.",
    "El concejo debe su nombre al rey Aurelio, que gobernó Asturias entre los años 768 y 774."
  ]);

  add("laviana", "Pola de Laviana", 43.2430, -5.5618, 3, [
    "Pola de Laviana, en el valle del Nalón. Aquí nació, en el pueblo de Entralgo, el novelista Armando Palacio Valdés, autor de La hermana San Sulpicio.",
    "Al sur de Laviana está el Parque Natural de Redes, Reserva de la Biosfera desde 2001."
  ]);

  add("lena", "Pola de Lena", 43.1583, -5.8211, 3.5, [
    "Pola de Lena. Cerca está Santa Cristina de Lena, una iglesia prerrománica del siglo nueve, mandada construir en tiempos de Ramiro Primero, y Patrimonio Mundial de la UNESCO.",
    "Lena es la puerta del puerto de Pajares y de la Variante de Pajares, con túneles ferroviarios de casi veinticinco kilómetros."
  ]);

  add("cangas-narcea", "Cangas del Narcea", 43.1750, -6.5500, 4, [
    "Cangas del Narcea, la capital del suroccidente asturiano y del Vino de Cangas, el único vino asturiano con denominación de origen.",
    "El monasterio de Corias, fundado en 1032 y convertido hoy en Parador, está a pocos kilómetros.",
    "Cerca está la Reserva de Muniellos, un robledal muy extenso y bien conservado al que solo se puede entrar con permiso previo y cupo diario."
  ]);

  add("somiedo", "Somiedo", 43.0975, -6.2500, 6, [
    "Somiedo, Parque Natural y Reserva de la Biosfera desde el año 2000, uno de los mejores lugares de España para ver al oso pardo cantábrico.",
    "Las brañas de Somiedo eran aldeas de verano de los vaqueiros de alzada, pastores trashumantes que vivían en cabañas con cubierta de paja, llamadas teitos."
  ]);

  add("colombres", "Colombres", 43.3750, -4.5547, 3, [
    "Colombres, en Ribadedeva, el último pueblo de Asturias antes de Cantabria. Aquí está el Archivo de Indianos, en la Quinta Guadalupe, un edificio indiano.",
    "El río Deva marca el límite entre Asturias y Cantabria, y el puente de Unquera lo cruza."
  ]);
})(typeof window !== "undefined" ? window : globalThis);

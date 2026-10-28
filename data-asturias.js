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
    "Gaspar Melchor de Jovellanos nació en Gijón en 1744. Fue escritor, jurista y ministro de Gracia y Justicia, una de las grandes figuras de la Ilustración española. En 1794 fundó en Gijón el Real Instituto Asturiano de Náutica y Mineralogía, y su casa natal es hoy un museo.",
    "La Laboral, cuyas obras empezaron en 1946, nació como un centro para los huérfanos de mineros. Su torre mide 117 metros, y desde 2007 es la Laboral Ciudad de la Cultura.",
    "El Real Sporting de Gijón se fundó en 1905 y juega en El Molinón, inaugurado en 1908 y considerado el estadio en uso más antiguo de España. Por su escuela de Mareo pasaron futbolistas como Luis Enrique o David Villa."
  ]);

  add("aviles", "Avilés", 43.5547, -5.9248, 4, [
    "Avilés tiene un casco histórico muy bien conservado, con calles con soportales como la de Galiana y plazas de aire medieval.",
    "En Avilés nació en 1519 Pedro Menéndez de Avilés, que fundó San Agustín, en Florida, en 1565, una de las ciudades más antiguas de Estados Unidos.",
    "El Centro Niemeyer, inaugurado en 2011 junto a la ría, es la única obra en España del arquitecto brasileño Oscar Niemeyer.",
    "La siderurgia de Ensidesa, una empresa pública creada en 1950, transformó la comarca de Avilés. En pocos años la población se multiplicó con trabajadores llegados de toda España, y hoy la acería sigue funcionando en manos de ArcelorMittal."
  ]);

  add("peñas", "Cabo de Peñas", 43.6556, -5.8480, 3, [
    "Cabo de Peñas, el punto más septentrional de Asturias. Su faro se encendió por primera vez en 1852, sobre acantilados que caen al Cantábrico.",
    "Es un lugar muy conocido para observar aves marinas durante sus migraciones, y también por sus temporales, que han hundido barcos a lo largo de la historia."
  ]);

  add("cudillero", "Cudillero", 43.5617, -6.1456, 3, [
    "Cudillero es un pueblo marinero con las casas de colores colgadas en forma de anfiteatro sobre el puerto. Está escondido en una pequeña ensenada, así que no se ve entero hasta que llegas abajo, a la plaza junto al muelle.",
    "Sus vecinos hablan el pixueto, una variedad propia de la lengua asturiana que se conserva casi solo en este pueblo y sus alrededores."
  ]);

  add("luarca", "Luarca", 43.5420, -6.5350, 3, [
    "Luarca, la Villa Blanca de la Costa Verde, con casas escalonadas a ambos lados del río Negro, justo antes de que desemboque en el mar.",
    "En Luarca nació en 1905 Severo Ochoa. Hizo casi toda su carrera en Estados Unidos y en 1959 recibió el Premio Nobel de Medicina, compartido con Arthur Kornberg, por sus trabajos sobre la síntesis del ARN. Está enterrado en el cementerio de su villa natal.",
    "El cementerio de Luarca está sobre un acantilado, junto al faro y la ermita de la Blanca, en la Atalaya, con vistas abiertas al Cantábrico. Es uno de los rincones más fotografiados de la villa."
  ]);

  add("pravia", "Pravia", 43.4833, -6.1167, 3, [
    "Pravia fue capital del reino de Asturias entre los años 774 y 783, durante el reinado de Silo, que trasladó aquí la corte desde Cangas de Onís. Años después, Alfonso Segundo la llevaría a Oviedo.",
    "La iglesia de Santianes, mandada construir en tiempos de Silo, es uno de los ejemplos más antiguos del prerrománico asturiano, aunque ha sido reformada a lo largo de los siglos."
  ]);

  add("salas", "Salas", 43.4130, -6.2530, 3, [
    "Salas es una villa del Camino Primitivo de Santiago, la ruta que siguió Alfonso Segundo desde Oviedo hasta la tumba del apóstol. Tiene una colegiata del siglo dieciséis y el palacio y la torre de los Valdés Salas.",
    "En Salas nació en 1483 Fernando de Valdés Salas, arzobispo de Sevilla e inquisidor general en tiempos de Felipe Segundo. En su testamento dejó los fondos para fundar la Universidad de Oviedo, y su sepulcro de alabastro está en la colegiata de Salas."
  ]);

  add("cangas-onis", "Cangas de Onís", 43.3510, -5.1290, 3.5, [
    "Cangas de Onís fue la primera capital del reino de Asturias, con Pelayo, su hijo Favila y Alfonso Primero, en el siglo ocho.",
    "El Puente Romano, de un solo arco apuntado sobre el río Sella, es en realidad de origen medieval. Bajo su arco cuelga una réplica de la Cruz de la Victoria.",
    "La capilla de Santa Cruz se levantó en el año 737, por orden del rey Favila, sobre un dolmen de la prehistoria. Fue destruida en 1936 y reconstruida después, y bajo el altar todavía se puede ver la cámara del dolmen."
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
    "Cerca de Arriondas, en la sierra del Sueve, está el mirador del Fito. Desde su balcón de piedra se ve a un lado la costa del Cantábrico y al otro los Picos de Europa. La sierra es también el hogar del asturcón, el pequeño caballo autóctono de Asturias."
  ]);

  add("ribadesella", "Ribadesella", 43.4636, -5.0586, 3.5, [
    "Ribadesella está en la desembocadura del Sella y es la meta del Descenso de las piraguas, que sale de Arriondas y recorre unos veinte kilómetros río abajo. La villa se reparte entre el puerto, a un lado de la ría, y la playa de Santa Marina, con palacetes de indianos, al otro.",
    "La cueva de Tito Bustillo la descubrió en 1968 un grupo de jóvenes espeleólogos. Lleva el nombre de uno de ellos, Celestino Fernández Bustillo, Tito, que murió pocas semanas después. Algunas de sus pinturas tienen más de treinta mil años, y es Patrimonio Mundial desde 2008."
  ]);

  add("lastres", "Lastres", 43.5148, -5.2689, 3, [
    "Lastres es un pueblo de casas en cuesta que bajan hasta el puerto. Entre 2009 y 2011 fue San Martín del Sella, el pueblo ficticio de la serie Doctor Mateo, y desde entonces atrae a muchos visitantes.",
    "Estás en la Costa de los Dinosaurios: en estos acantilados hay huellas de dinosaurios del Jurásico, de hace unos ciento cincuenta millones de años.",
    "En Colunga, muy cerca, está el Museo del Jurásico de Asturias, inaugurado en 2004. El edificio tiene forma de huella de dinosaurio y expone esqueletos y huellas fósiles encontradas en esta misma costa."
  ]);

  add("villaviciosa", "Villaviciosa", 43.4800, -5.4330, 3.5, [
    "Villaviciosa es la capital de la manzana. En su concejo hay miles de manzanos y muchos llagares, que es como se llaman en Asturias las bodegas donde se hace la sidra. La sidra natural asturiana se elabora sin añadir gas ni azúcar, solo con el zumo fermentado de la manzana.",
    "En Tazones, en la costa de este concejo, desembarcó en 1517 Carlos Primero, que llegó a Asturias tras una tormenta cuando iba a tomar posesión de sus reinos.",
    "El monasterio de San Salvador de Valdediós, junto a Villaviciosa, tiene una iglesia prerrománica consagrada en el año 893."
  ]);

  add("llanes", "Llanes", 43.4200, -4.7550, 4, [
    "Llanes conserva restos de su muralla medieval, un puerto pesquero y el paseo de San Pedro, un camino de hierba sobre los acantilados. Muchas de sus casonas las levantaron indianos que volvieron ricos de América.",
    "En el rompeolas del puerto están los Cubos de la Memoria, bloques de hormigón que Agustín Ibarrola empezó a pintar en 2001.",
    "Entre julio y septiembre, Llanes celebra sus tres grandes fiestas: la Magdalena, San Roque y la Guía. Los vecinos se organizan en bandos rivales, desfilan con ramos adornados con panes y bailan con trajes tradicionales al son de las gaitas."
  ]);

  add("gulpiyuri", "Playa de Gulpiyuri", 43.4430, -4.8480, 1.5, [
    "Playa de Gulpiyuri, una de las playas interiores más famosas del mundo: está en un prado, a unos cien metros del mar, y el agua entra por túneles bajo la roca.",
    "Su arena y su agua suben y bajan con las mareas, porque el mar llega por galerías bajo la roca. La playa mide unos cuarenta metros y es Monumento Natural desde 2001."
  ]);

  add("cabrales", "Arenas de Cabrales", 43.3042, -4.8206, 4, [
    "Arenas de Cabrales, el centro del concejo del queso Cabrales, un queso azul que madura en cuevas naturales de la montaña.",
    "El Naranjo de Bulnes, o Picu Urriellu, de 2.519 metros, lo escalaron por primera vez en 1904 Pedro Pidal y Gregorio Pérez, El Cainejo.",
    "Desde Poncebos arranca la Ruta del Cares, de unos doce kilómetros, hasta Caín, ya en León. El sendero, excavado en la roca de la garganta, se construyó entre 1945 y 1950 para mantener el canal que lleva agua a la central eléctrica de Poncebos."
  ]);

  add("nava", "Nava", 43.3500, -5.5083, 3, [
    "Nava es la capital de la sidra. Aquí está el Museo de la Sidra Asturiana, que explica cómo se elabora y se sirve, y cada mes de julio el pueblo celebra el Festival de la Sidra, con concursos de escanciadores.",
    "La sidra asturiana se escancia: se sirve desde lo alto, con un chorro fino que rompe en el vaso para que se oxigene, y se bebe un culín, que es una pequeña cantidad."
  ]);

  add("mieres", "Mieres", 43.2500, -5.7700, 4, [
    "Mieres, el corazón de la cuenca minera del Caudal, una ciudad marcada por el carbón, el hierro y las luchas obreras.",
    "La Revolución de octubre de 1934 tuvo su principal foco en las cuencas mineras, entre ellas la del Caudal. Los mineros llegaron a dominar buena parte de Oviedo durante varios días, hasta que el Ejército sofocó el levantamiento, con cientos de muertos y miles de detenidos."
  ]);

  add("entrego", "El Entrego", 43.2950, -5.6150, 2.5, [
    "El Entrego, en San Martín del Rey Aurelio, donde está el Museo de la Minería y de la Industria de Asturias, con un recorrido por una mina recreada.",
    "El concejo de San Martín del Rey Aurelio debe su nombre al rey Aurelio, que gobernó Asturias entre los años 768 y 774. Según la Crónica de Alfonso Tercero, fue enterrado en la iglesia de San Martín, en este valle, donde hay una lápida con su nombre, aunque otras fuentes lo sitúan en otros lugares."
  ]);

  add("laviana", "Pola de Laviana", 43.2430, -5.5618, 3, [
    "Pola de Laviana, en el valle del Nalón. Aquí nació, en el pueblo de Entralgo, el novelista Armando Palacio Valdés, autor de La hermana San Sulpicio.",
    "Al sureste de Laviana está el Parque Natural de Redes, Reserva de la Biosfera desde 2001. Es un territorio de hayedos en la cabecera del río Nalón, con el embalse de Tanes y el pico Tiatordos entre sus paisajes más conocidos."
  ]);

  add("lena", "Pola de Lena", 43.1583, -5.8211, 3.5, [
    "Pola de Lena. Cerca está Santa Cristina de Lena, una iglesia prerrománica del siglo nueve, mandada construir en tiempos de Ramiro Primero, y Patrimonio Mundial de la UNESCO.",
    "Lena es la puerta del puerto de Pajares y de la Variante de Pajares, con túneles ferroviarios de casi veinticinco kilómetros."
  ]);

  add("cangas-narcea", "Cangas del Narcea", 43.1750, -6.5500, 4, [
    "Cangas del Narcea, la capital del suroccidente asturiano y del Vino de Cangas, el único vino asturiano con denominación de origen.",
    "El monasterio de Corias lo fundaron en 1032 los condes Piñolo y Aldonza. Por su tamaño lo llaman El Escorial de Asturias. El edificio actual se rehízo tras un incendio en el siglo dieciocho y hoy es Parador de Turismo.",
    "Cerca está la Reserva de Muniellos, un robledal muy extenso y bien conservado al que solo se puede entrar con permiso previo y cupo diario."
  ]);

  add("somiedo", "Somiedo", 43.0975, -6.2500, 6, [
    "Somiedo, Parque Natural y Reserva de la Biosfera desde el año 2000, uno de los mejores lugares de España para ver al oso pardo cantábrico.",
    "Las brañas de Somiedo eran aldeas de verano de los vaqueiros de alzada, pastores trashumantes que vivían en cabañas con cubierta de paja, llamadas teitos."
  ]);

  add("colombres", "Colombres", 43.3750, -4.5547, 3, [
    "Colombres, en Ribadedeva, el último pueblo de Asturias antes de Cantabria. Aquí está el Archivo de Indianos, en la Quinta Guadalupe, un edificio indiano.",
    "El río Deva marca el límite entre Asturias y Cantabria. Nace en Fuente Dé, atraviesa el desfiladero de La Hermida y desemboca en la ría de Tina Mayor, junto al puente de Unquera."
  ]);

  /* Añadido por el usuario desde la app (28 de octubre de 2026). */
  add("lugones", "Lugones", 43.4153, -5.7996, 2, [
    "Lugones, en asturiano Llugones, es la localidad más poblada del concejo de Siero, con más habitantes que la propia capital, la Pola. Su nombre viene de los luggones, una antigua tribu astur de raíz céltica vinculada al dios solar Lug.",
    "Conserva el Puente Viejo, de origen romano y reformado después. Formaba parte de la calzada que unía Astorga con Lugo de Llanera.",
    "Está a solo 5 kilómetros de Oviedo, en el corazón del área central de Asturias. Su gran parque es La Acebera: hasta 1982 fue terreno de la Sociedad Santa Bárbara, que probaba y almacenaba allí los explosivos de sus fábricas.",
    "Tiene una intensa vida social y sidrera, con la calle peatonal como eje. Es además un nudo de comunicaciones, con autovías y estación de tren."
  ]);
})(typeof window !== "undefined" ? window : globalThis);

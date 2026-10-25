/* Lugares de Cantabria. Mismo formato que data-asturias.js. */
(function (root) {
  var L = root.LUGARES = root.LUGARES || [];
  var C = "CAN";
  function add(id, n, lat, lon, rad, h) { L.push({ id: id, n: n, reg: C, lat: lat, lon: lon, rad: rad, h: h }); }

  add("unquera", "Unquera", 43.3833, -4.5167, 2, [
    "Unquera, el primer pueblo de Cantabria viniendo de Asturias, a orillas del río Deva, que marca el límite entre las dos comunidades.",
    "Unquera es famosa por sus corbatas, un dulce de hojaldre con forma de lazo que se vende en todas las pastelerías del pueblo."
  ]);

  add("santander", "Santander", 43.4623, -3.8100, 6, [
    "Santander, la capital de Cantabria, se construyó en torno a una bahía amplia y es el principal puerto de la región.",
    "El 15 de febrero de 1941 comenzó un incendio, avivado por el viento sur, que destruyó buena parte del casco antiguo de la ciudad.",
    "El Palacio de la Magdalena, construido a principios del siglo veinte, fue residencia de verano de Alfonso Trece. Hoy acoge los cursos de verano de la Universidad Internacional Menéndez Pelayo, creada en 1932.",
    "El Centro Botín, obra de Renzo Piano, se inauguró en 2017 sobre la bahía.",
    "Santander es la ciudad natal de Marcelino Menéndez Pelayo, nacido en 1856. Legó su biblioteca a la ciudad, que hoy puede visitarse.",
    "El Festival Internacional de Santander se celebra cada verano desde 1952."
  ]);

  add("liencres", "Liencres", 43.4540, -3.9830, 3, [
    "Liencres, con su parque natural de dunas y la Costa Quebrada, una franja de acantilados y playas muy popular entre los surfistas.",
    "Los Urros de Liencres son rocas que emergen verticales del mar, restos de la erosión de esta costa."
  ]);

  add("cabarceno", "Cabárceno", 43.3520, -3.8450, 3, [
    "Parque de la Naturaleza de Cabárceno, instalado desde 1990 en una antigua mina de hierro a cielo abierto, a los pies de Peña Cabarga.",
    "El parque alberga más de cien especies de animales en grandes recintos, sobre un paisaje de roca y galerías que dejó la minería.",
    "Peña Cabarga, de unos 570 metros, es la gran atalaya sobre la bahía de Santander."
  ]);

  add("puente-viesgo", "Puente Viesgo", 43.2550, -3.9650, 3, [
    "Puente Viesgo, en el valle del Pas, con las cuevas del monte Castillo, un conjunto de arte rupestre del Paleolítico.",
    "En la cueva de El Castillo hay un disco rojo datado en más de cuarenta mil años en un estudio de 2012, uno de los dibujos más antiguos conocidos de Europa.",
    "El pueblo tiene un balneario de aguas termales desde hace más de un siglo."
  ]);

  add("lierganes", "Liérganes", 43.3200, -3.7250, 3, [
    "Liérganes, una villa de casonas montañesas famosa por la leyenda del Hombre Pez, un joven que, según se cuenta, desapareció nadando en Bilbao y reapareció años después en Cádiz, en el siglo diecisiete.",
    "El padre Feijoo recogió la historia del Hombre Pez en su Teatro crítico universal, y desde entonces forma parte de la tradición de Cantabria.",
    "El Puente Mayor, de piedra, cruza el río Miera a su paso por la villa."
  ]);

  add("torrelavega", "Torrelavega", 43.3490, -4.0480, 5, [
    "Torrelavega, la segunda ciudad de Cantabria y un gran nudo industrial entre los ríos Besaya y Saja.",
    "La fábrica de Solvay empezó a producir en Barreda en 1908, y desde entonces la industria química marcó la vida de la ciudad.",
    "Torrelavega alberga el Mercado Nacional de Ganados, uno de los mayores de España, un reflejo de la tradición ganadera de Cantabria."
  ]);

  add("santillana", "Santillana del Mar", 43.3883, -4.1056, 3, [
    "Santillana del Mar, villa medieval de piedra y casonas con escudos. Dice el dicho que es la villa de las tres mentiras, porque ni es santa, ni es llana, ni tiene mar.",
    "La colegiata de Santa Juliana, un templo románico del siglo doce, es el corazón de la villa.",
    "A dos kilómetros está la cueva de Altamira. En 1879, la hija de Marcelino Sanz de Sautuola, de unos ocho años, descubrió los bisontes del techo. La ciencia no aceptó su autenticidad hasta principios del siglo veinte.",
    "Altamira es Patrimonio Mundial desde 1985. Para conservarla, se visita la Neocueva, una réplica abierta en 2001 en el museo."
  ]);

  add("comillas", "Comillas", 43.3920, -4.2890, 3.5, [
    "Comillas, un pueblo de indianos y de nobleza del siglo diecinueve, con tres joyas arquitectónicas.",
    "El Capricho de Gaudí, construido entre 1883 y 1885, es una de las tres obras de Gaudí fuera de Cataluña.",
    "El Palacio de Sobrellano, de estilo neogótico, lo mandó construir Antonio López, el primer marqués de Comillas, naviero y fundador de la Compañía Transatlántica.",
    "Según la tradición, Comillas fue una de las primeras poblaciones de España con alumbrado eléctrico, estrenado en 1881 con motivo de una visita de Alfonso Doce.",
    "En el cementerio, sobre las ruinas de una antigua iglesia, se alza el Ángel Exterminador, una escultura de Josep Llimona."
  ]);

  add("san-vicente", "San Vicente de la Barquera", 43.3833, -4.3917, 3.5, [
    "San Vicente de la Barquera, una villa marinera a la entrada de la ría, con su largo puente de arcos, el castillo del Rey y la iglesia gótica de Nuestra Señora de los Ángeles.",
    "Es la entrada al Parque Natural de Oyambre, con las playas de Oyambre y de Merón.",
    "Aquí se celebra La Folía, una fiesta de Interés Turístico Nacional que se celebra en primavera. Y es también una parada del Camino de Santiago del Norte."
  ]);

  add("potes", "Potes", 43.1500, -4.6167, 4, [
    "Potes, la capital de Liébana, a los pies de los Picos de Europa, con la Torre del Infantado, del siglo quince.",
    "A pocos kilómetros, el monasterio de Santo Toribio de Liébana guarda el Lignum Crucis, que según la tradición es el mayor fragmento conocido de la cruz de Cristo. Cuando el 16 de abril cae en domingo, se celebra el Año Jubilar Lebaniego.",
    "En Liébana, hacia el año 776, el monje Beato escribió su Comentario al Apocalipsis. Aquellos códices, los beatos, se copiaron durante siglos con miniaturas famosas.",
    "El orujo de Liébana tiene indicación geográfica protegida, y el cocido lebaniego es el plato típico de la comarca."
  ]);

  add("fuente-de", "Fuente Dé", 43.1520, -4.8100, 4, [
    "Fuente Dé, el final del valle, donde un teleférico salva 753 metros de desnivel hasta el Mirador del Cable, a 1.823 metros de altitud.",
    "Desde aquí se accede al macizo central de los Picos de Europa, donde está Torre Cerredo, de 2.650 metros, la cumbre más alta de todo el parque."
  ]);

  add("reinosa", "Reinosa", 43.0000, -4.1367, 4, [
    "Reinosa, la capital de Campoo, junto al embalse del Ebro, y puerta de la estación de esquí de Alto Campoo.",
    "El río Ebro nace en Fontibre, cerca de Reinosa, y recorre más de novecientos kilómetros hasta su delta, en el Mediterráneo.",
    "Reinosa tiene una larga tradición siderúrgica y ferroviaria."
  ]);

  add("laredo", "Laredo", 43.4106, -3.4281, 4, [
    "Laredo, con la playa de la Salvé, de unos cinco kilómetros, y un casco antiguo, la Puebla Vieja, de calles de pescadores.",
    "En 1556 desembarcó aquí el emperador Carlos Quinto, que volvía de Flandes para retirarse al monasterio de Yuste.",
    "A finales de agosto se celebra la Batalla de Flores, un desfile de carrozas decoradas con flores, hoy Fiesta de Interés Turístico Nacional."
  ]);

  add("santoña", "Santoña", 43.4442, -3.4586, 3.5, [
    "Santoña, una villa pesquera famosa por sus anchoas, que cuentan con indicación geográfica protegida.",
    "En Santoña nació hacia 1460 Juan de la Cosa, cartógrafo y propietario de la Santa María, la nao de Colón en 1492. Su mapamundi de 1500 es uno de los primeros que representa América.",
    "Las Marismas de Santoña, Victoria y Joyel son Parque Natural y humedal Ramsar, un lugar clave para las aves migratorias."
  ]);

  add("castro", "Castro Urdiales", 43.3835, -3.2190, 4, [
    "Castro Urdiales, en el límite con el País Vasco, de origen romano. Fue Flaviobriga, fundada en el siglo uno.",
    "Su silueta la forman la iglesia gótica de Santa María de la Asunción, del siglo trece, y el castillo faro de Santa Ana."
  ]);

  add("ramales", "Ramales de la Victoria", 43.2569, -3.4617, 3, [
    "Ramales de la Victoria añadió ese apellido tras la batalla de Ramales de 1839, en la primera guerra carlista, ganada por el general Espartero.",
    "En los alrededores está la cueva de Covalanas, con arte rupestre de ciervas dibujadas en rojo, Patrimonio Mundial desde 2008."
  ]);

  add("vega-pas", "Vega de Pas", 43.1500, -3.7700, 4, [
    "Vega de Pas, en las montañas del valle pasiego, el hogar de los pasiegos, pastores con cabañas dispersas por los prados de la montaña.",
    "De aquí vienen los sobaos y las quesadas pasiegas, dos dulces típicos de Cantabria."
  ]);

  add("soplao", "El Soplao", 43.2917, -4.4220, 4, [
    "El Soplao, una cueva con una gran concentración de estalactitas excéntricas, que crecen en todas direcciones.",
    "Se descubrió tras trabajos mineros de zinc y plomo y se abrió al público en 2005. Para visitarla se usa un tren minero."
  ]);

  add("carmona", "Carmona", 43.2000, -4.3050, 3, [
    "Carmona, un pueblo de casonas montañesas con balcones de madera y escudos, en el valle de Cabuérniga, junto al Parque Natural Saja-Besaya.",
    "En invierno, en este valle salen los zamarrones, figuras cubiertas de pieles y cencerros que recorren los pueblos."
  ]);
})(typeof window !== "undefined" ? window : globalThis);

/* Efemérides con fecha. m = mes (1-12), d = día (o null si solo se conoce el mes), y = año, r = región ("AST", "CAN" o ambas). */
(function (root) {
  root.EFEMERIDES = [
    { m: 1, d: 5, y: 1744, r: ["AST"], t: "El 5 de enero de 1744 nació en Gijón Gaspar Melchor de Jovellanos, figura de la Ilustración española." },
    { m: 2, d: 6, y: 1833, r: ["CAN"], t: "El 6 de febrero de 1833 nació en Polanco el novelista José María de Pereda, autor de Peñas arriba y Sotileza." },
    { m: 2, d: 15, y: 1941, r: ["CAN"], t: "El 15 de febrero de 1941 comenzó el gran incendio de Santander, que destruyó buena parte del casco antiguo." },
    { m: 3, d: null, y: 2011, r: ["AST"], t: "En marzo de 2011 se inauguró el Centro Niemeyer en Avilés, la única obra de Oscar Niemeyer en España." },
    { m: 6, d: 13, y: 1901, r: ["AST"], t: "El 13 de junio de 1901 murió en Oviedo Leopoldo Alas, Clarín, autor de La Regenta, la novela que retrata la ciudad como Vetusta." },
    { m: 6, d: 23, y: 2017, r: ["CAN"], t: "El 23 de junio de 2017 se inauguró el Centro Botín, de Renzo Piano, en la bahía de Santander." },
    { m: 7, d: 22, y: 1918, r: ["AST"], t: "El 22 de julio de 1918 se declaró el Parque Nacional de la Montaña de Covadonga, el primero de España." },
    { m: 7, d: 28, y: null, r: ["CAN"], t: "El 28 de julio es el Día de las Instituciones de Cantabria." },
    { m: 7, d: 29, y: 1981, r: ["AST"], t: "El 29 de julio de 1981 nació en Oviedo el piloto Fernando Alonso, doble campeón del mundo de Fórmula 1." },
    { m: 8, d: 5, y: 1904, r: ["AST"], t: "El 5 de agosto de 1904, Pedro Pidal y Gregorio Pérez, el Cainejo, hicieron la primera ascensión al Naranjo de Bulnes." },
    { m: 9, d: 8, y: null, r: ["AST"], t: "El 8 de septiembre es el Día de Asturias, dedicado a la Virgen de Covadonga." },
    { m: 9, d: 15, y: 1972, r: ["AST"], t: "El 15 de septiembre de 1972 nació en Oviedo Letizia Ortiz, hoy reina de España." },
    { m: 9, d: 19, y: 1517, r: ["AST"], t: "El 19 de septiembre de 1517 desembarcó Carlos Primero en Tazones, en la costa de Villaviciosa." },
    { m: 9, d: 24, y: 1905, r: ["AST"], t: "El 24 de septiembre de 1905 nació en Luarca Severo Ochoa, Premio Nobel de Medicina en 1959." },
    { m: 9, d: 28, y: 1556, r: ["CAN"], t: "El 28 de septiembre de 1556 desembarcó en Laredo el emperador Carlos Quinto, camino del monasterio de Yuste." },
    { m: 10, d: 3, y: 1896, r: ["CAN"], t: "El 3 de octubre de 1896 nació en Santander el poeta Gerardo Diego, de la Generación del 27." },
    { m: 10, d: 4, y: 1853, r: ["AST"], t: "El 4 de octubre de 1853 nació en Entralgo, en Laviana, el novelista Armando Palacio Valdés." },
    { m: 10, d: 5, y: 1934, r: ["AST"], t: "El 5 de octubre de 1934 comenzó la Revolución de Asturias, un levantamiento minero que sacudió toda la región durante dos semanas." },
    { m: 10, d: 19, y: 1779, r: ["CAN"], t: "El 19 de octubre de 1779 nació en Muriedas, en Camargo, Pedro Velarde, uno de los héroes del 2 de mayo de 1808 en Madrid." },
    { m: 10, d: null, y: null, r: ["AST"], t: "Cada octubre se entregan en el Teatro Campoamor de Oviedo los Premios Princesa de Asturias, que se conceden desde 1981." },
    { m: 11, d: 3, y: 1856, r: ["CAN"], t: "El 3 de noviembre de 1856 nació en Santander Marcelino Menéndez Pelayo." },
    { m: 11, d: 3, y: 1893, r: ["CAN"], t: "El 3 de noviembre de 1893 explotó en el puerto de Santander el vapor Cabo Machichaco, cargado de dinamita. Murieron cerca de 600 personas." },
    { m: 11, d: 27, y: 1811, r: ["AST"], t: "El 27 de noviembre de 1811 murió Jovellanos en Puerto de Vega, en Navia, cuando huía de las tropas francesas." },
    { m: 12, d: 30, y: 1981, r: ["AST", "CAN"], t: "El 30 de diciembre de 1981 se aprobaron los Estatutos de Autonomía de Asturias y de Cantabria." }
  ];
})(typeof window !== "undefined" ? window : globalThis);

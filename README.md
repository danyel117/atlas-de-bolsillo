# Atlas de bolsillo ✳

Un pequeño juego. Un mundo enorme.

Juego de geografía en español: elige un continente, reconoce el país resaltado en el mapa y selecciona su nombre. Al terminar, consulta tus aciertos, repasa tus respuestas y practica únicamente los países que fallaste.

## Jugar

**[Abrir Atlas de bolsillo](https://atlas-de-bolsillo.vercel.app)** — gratuito, sin registro y compatible con celular.

- Seis regiones: Europa, África, Asia, Norteamérica, Sudamérica y Oceanía.
- 195 países: 193 miembros de la ONU, Palestina y Ciudad del Vaticano.
- Viaje rápido de 10 países o continente completo, sin repeticiones.
- Cuatro respuestas posibles, corrección inmediata y resumen final.
- Marcadores visibles para países pequeños e islas.
- Diseño para celular, tableta y escritorio; navegación con teclado (1–4).
- Tu mejor puntuación se guarda en tu navegador. Sin cuentas, publicidad ni seguimiento.

Norteamérica incluye Centroamérica y el Caribe. Rusia se juega en Europa; Turquía, Chipre y Kazajistán, en Asia. Cada país pertenece a una sola región de juego. La Antártida no tiene países soberanos. El juego usa límites simplificados; los mapas no expresan una posición sobre territorios disputados.

## Desarrollo

Node.js 22.12+ o 24 y npm.

```sh
npm ci
npm run dev
```

```sh
npm test       # reglas del juego, puntuación, opciones y visibilidad de los 195 marcadores
npm run build # genera dist/
npm run preview
```

Los datos y mapas están incluidos en el repositorio: no dependemos de una API externa para jugar. Para regenerarlos desde las versiones fijadas:

```sh
npm run data
```

Las fuentes tipográficas se cargan desde Google Fonts con fuentes de respaldo. Los resultados son locales al navegador y los récords se separan por región y cantidad de preguntas.

## Despliegue

Aplicación estática con Vite. En Vercel selecciona el preset Vite, `npm run build` y el directorio de salida `dist`. No necesita variables de entorno, base de datos ni funciones. El repositorio está conectado al espacio personal del propietario en Vercel.

## Contribuir

Consulta [CONTRIBUTING.md](CONTRIBUTING.md). Son bienvenidas mejoras de accesibilidad, cartografía y aprendizaje. Ejecuta las pruebas y el build antes de enviar una contribución.

## Licencias

Código: [MIT](LICENSE). Base de países: ODbL 1.0. Cartografía: dominio público de Natural Earth. Consulta [DATA_LICENSE.md](DATA_LICENSE.md) para fuentes y atribución.

# Atlas de bolsillo ✳

Un pequeño juego. Un mundo enorme.

Juego de geografía en español: elige un continente, reconoce el país resaltado en el mapa y selecciona su nombre. Al terminar, consulta tus aciertos, repasa tus respuestas y practica los países que fallaste. Compatible con celular, tableta y escritorio.

## Jugar

[Atlas de bolsillo](https://atlas.juegos.danielsaldarriaga.com)

- Seis regiones y 195 países: 193 miembros de la ONU, Palestina y Ciudad del Vaticano.
- Viaje rápido de 10 países o continente completo, sin repeticiones.
- Cuatro respuestas, corrección inmediata, resumen y práctica de fallos.
- Marcadores para países pequeños e islas; controles de teclado (1–4).
- Historial por continente, evolución de aciertos y descarga en CSV. Viajes rápidos, completos y práctica se comparan por separado.
- Sin cuenta, las partidas quedan en este navegador. Con GitHub o un enlace por correo, se guardan en Convex y puedes consultarlas desde otro dispositivo. Las partidas locales se importan solo al solicitarlo y reciben la fecha de importación.
- Sin publicidad ni cookies de seguimiento. Better Auth mantiene la sesión en almacenamiento local para el acceso entre dominios.

Norteamérica incluye Centroamérica y el Caribe. Rusia se juega en Europa; Turquía, Chipre y Kazajistán, en Asia. Cada país pertenece a una sola región. La Antártida no tiene países soberanos. Los límites son simplificados y no expresan una posición sobre territorios disputados.

## Desarrollo

Node.js 24 y npm:

```sh
npm ci
npm run dev -- --port 5174
npm run typecheck
npm test
npm run build
```

Para desarrollar con tu propio backend:

```sh
npx convex dev
```

Convex crea `.env.local` con tus URLs públicas. Comprueba que incluya `VITE_CONVEX_URL` y `VITE_CONVEX_SITE_URL`. Configura `SITE_URL=http://localhost:5174` en el deployment de desarrollo y usa ese origen exacto para navegar. El cliente consulta el servidor bajo demanda, sin suscripciones continuas al historial.

Mapas y países están incluidos en el repositorio; jugar no requiere una API geográfica externa. `npm run data` regenera los datos desde las dependencias fijadas. Las tipografías vienen de Google Fonts, con fuentes de respaldo.

## Configurar el acceso

Los secretos pertenecen al backend de Convex. **Nunca** uses un prefijo `VITE_` para un secreto, lo incluyas en Git o lo pases como argumento del shell. `npx convex env set NOMBRE` permite introducirlo por stdin. Añade `--prod` para producción.

| Variable en Convex | Valor o finalidad |
| --- | --- |
| `SITE_URL` | Origen del frontend; producción: `https://atlas.juegos.danielsaldarriaga.com` |
| `BETTER_AUTH_SECRET` | Valor aleatorio de al menos 32 caracteres, distinto en desarrollo y producción |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | Credenciales de una GitHub App o una OAuth app personal para Atlas |
| `GITHUB_APP_MODE` | `true` para una GitHub App; omitir para una OAuth app |
| `RESEND_API_KEY` | API key de Resend con permiso `sending_access`, restringida a `danielsaldarriaga.com` |
| `EMAIL_FROM` | `Atlas de bolsillo <atlas@danielsaldarriaga.com>` tras verificar el dominio en Resend |

Producción usa la [GitHub App personal de Atlas](https://github.com/apps/atlas-de-bolsillo-daniel), con permiso de lectura del correo y sin permisos de repositorios. Para una instalación propia, registra una GitHub App con la web de Atlas como Homepage y la siguiente callback URL para este deployment de producción:

```text
https://beaming-chinchilla-93.convex.site/api/auth/callback/github
```

Configura `GITHUB_APP_MODE=true` para que Better Auth use los permisos de la GitHub App en lugar de solicitar scopes de OAuth. También se puede usar una OAuth app omitiendo esa variable. Usa otra aplicación para desarrollo, con el callback de su propio dominio `.convex.site`. Los correos de magic link pasan por Resend; el enlace caduca en 10 minutos, se usa una vez y su token se almacena mediante un hash. No se registran enlaces ni tokens en logs.

Para enviar desde un dominio propio, verifícalo en Resend publicando los registros DKIM y SPF/MX indicados. Atlas usa el dominio completo `danielsaldarriaga.com`: el DKIM corresponde a `resend._domainkey` y el Return-Path de envío a `send`, con los valores exactos que entregue Resend. Conserva los MX existentes del dominio raíz. Mantén Resend en Free y Convex en Free, sin activar planes con facturación por consumo. Las cuotas de los proveedores se aplican: al agotarlas se puede interrumpir el acceso o guardado. El juego sin cuenta sigue funcionando mientras se puedan descargar sus archivos.

## Datos y límites

Convex obtiene el usuario de la sesión verificada: cada persona solo consulta y guarda su propio historial. El servidor calcula la puntuación a partir de las respuestas y rechaza países repetidos, regiones incorrectas y rondas incompletas. Los IDs de partida evitan duplicados al reintentar una subida.

El historial admite 2.000 partidas por cuenta y hasta 100 nuevas partidas al día. La consulta devuelve resúmenes; las respuestas completas permanecen en el servidor. Si falla la conexión, se conservan las subidas pendientes en el navegador y se reintentan al volver a estar online o desde Mi progreso. Si el navegador impide guardar, la interfaz avisa y mantiene la partida solo en memoria durante esa visita. El CSV incluye todas las partidas visibles, también las pendientes.

La evolución compara la primera y última partida hasta tener diez resultados del mismo tipo y continente; a partir de diez compara la media de las primeras y últimas cinco. La gráfica muestra las últimas veinte partidas.

## Despliegue

Frontend estático Vite en Vercel Hobby: `npm run build`, salida `dist`. `.env.production` contiene únicamente las URLs **públicas** de Convex; no requiere secretos en Vercel. Para otro proyecto cambia esas URLs. `.env.local` tiene prioridad al compilar localmente: usa las URLs del destino que quieras comprobar.

Backend:

```sh
npx convex deploy
```

GitHub Actions comprueba tipos, reglas del juego, propiedad del historial, puntuación y reintentos. El despliegue de Convex se hace por separado; un build correcto del frontend no prueba que el backend esté desplegado o que GitHub/Resend estén configurados. Verifica ambos accesos con sus proveedores reales después de cambiar su configuración.

El dominio personalizado se conecta con un CNAME `atlas.juegos` al destino indicado por Vercel, sin proxy de Cloudflare. Los orígenes permitidos en producción son el dominio personalizado y el alias público de Vercel.

## Contribuir y licencias

Consulta [CONTRIBUTING.md](CONTRIBUTING.md). Código [MIT](LICENSE), datos ODbL 1.0 y cartografía de dominio público de Natural Earth: [DATA_LICENSE.md](DATA_LICENSE.md).

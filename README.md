# Bingo Barcelona

Cartón de bingo de licencias para el Manga BCN. Se usa en el navegador, sin cuenta y sin servidor: las portadas se quedan en el dispositivo y el cartón se puede exportar como imagen.

## Qué hace

- Parrilla de 5×5 con proporción de portada de manga (2:3).
- Cada casilla abre la galería (o acepta una foto arrastrada) para poner una portada.
- Corazones, estrella y casillas con reborde rojo van fijos, por encima de la foto.
- **Aleatorio** mezcla las portadas y, si las hay, sus títulos. Corazones, estrella y casillas rojas no se mueven.
- Un listado del 1 al 25 para anotar el título de cada obra. En el móvil va debajo del cartón; en escritorio, a la derecha.
- **Exportar imagen** descarga el cartón en PNG. Si hay algún título, el listado sale a la derecha; si no, la imagen es solo el cartón.
- El cartón se recuerda en este navegador.

La búsqueda en Google Imágenes no está: no hay una forma fiable de hacerlo sin una API de pago y sin romper las normas de Google.

## Arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3847](http://localhost:3847).

## Publicar en Vercel

El proyecto es un Next.js estático en la práctica (no hay base de datos ni variables de entorno). En el panel de Vercel, importa el repositorio y despliega con los valores por defecto.

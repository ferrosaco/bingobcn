# Bingo Barcelona

Cartón de bingo de licencias para el Manga BCN. Permite elegir los títulos desde AniList, importarlos desde el dispositivo y exportar el bingo final. No almacena nada en ningún servidor.

## Qué hace

- Bingo de 5×5 con proporción 2:3, que sigue las reglas del Bingo Barcelona de Onumachi.
- Cada casilla abre la galería (o acepta una foto arrastrada) para poner una portada.
- **Aleatorio** mezcla las portadas y, si las hay, sus títulos. Se mantiene la ubicación de las casillas especiales (pero no de su contenido).
- Un listado del 1 al 25 para anotar el título de cada obra. Si se elige la portada desde AniList el título se rellena automáticamente.
- Un desplegable para elegir la editorial en las casillas rojas. Se ofrecen las editoriales que presentan licencias durante el Manga Barcelona 2026.
- **Exportar imagen** descarga el cartón en PNG. Si hay algún título, el listado sale a la derecha; si no, la imagen es solo el cartón.
- El cartón se almacena en el navegador y reacciona de forma dinámica a las actualizaciones de licencias.


## Arrancar en local

```bash
npm install
npm run dev
```

Abre [http://localhost:3847](http://localhost:3847).
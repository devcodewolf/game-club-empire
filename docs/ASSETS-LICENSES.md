# Licencias de assets

Registro del origen y la licencia de los recursos externos que usa el juego. **Todo asset nuevo se registra aquí antes de usarse.**

## Recursos externos

| Recurso | Uso en el juego | Origen (paquete/URL) | Versión | Licencia | Obligaciones |
|---|---|---|---|---|---|
| Tabler Icons (SVG) | Iconos del menú de construcción y texturas en Pixi (`src/render/art/iconTextures.ts`, `src/content/icons.ts`) | `@tabler/icons` · https://tabler.io/icons | 3.48.0 | MIT (© 2020-2026 Paweł Kuna) | Conservar el aviso de copyright y el texto de la licencia MIT en las distribuciones |
| Tabler Icons para Vue | Iconos como componentes Vue en la UI (`src/ui/icons.ts`) | `@tabler/icons-vue` · https://tabler.io/icons | 3.48.0 | MIT (© 2020-2026 Paweł Kuna) | Igual que arriba |
| Patrick Hand | Fuente de títulos de la UI (clase `font-hand`, `src/style.css`) | `@fontsource/patrick-hand` · diseño de Patrick Wagesreiter | 5.3.0 | SIL OFL 1.1 (© 2010-2012 Patrick Wagesreiter) | Conservar el aviso y la licencia OFL con la fuente; no venderla por separado; si se modifica, no usar el nombre reservado |
| Trebuchet MS | Texto de etiquetas dibujadas en Pixi y de `gallery.html` (`fontFamily: 'Trebuchet MS, sans-serif'`) | Fuente del sistema | n/a | Propietaria (Microsoft), no se distribuye | Ninguna: fuente del sistema, no se empaqueta |
| `assets/src/muestras/muestra-estilo.svg` | Muestra de la guía de estilo | Generada por el proyecto con `tools/muestras/muestra-estilo.mjs` | n/a | Obra del proyecto | Ninguna |
| Prison Architect | Solo referencia de estilo y mecánicas (`docs/referencias/`) | Paradox / Introversion | n/a | No aplica: no se usa ningún asset | **Nunca se copian sus assets** (sprites, sonidos, textos, interfaz) |

No hay otras fuentes, imágenes ni sonidos externos: `index.html` y `gallery.html` no cargan recursos de terceros y no existe carpeta `public/`.

## Arte propio

Todo el arte del mapa (objetos, suelos, muros, gradas, campos, decorado y efectos) se pinta por código con `Graphics` de PixiJS en los pintores de `src/render/art/` y se comparte entre copias (caché de `artCache.ts`). No hay sprites ni imágenes externas: es obra del proyecto y no requiere licencia de terceros.

---
target: web completa
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 3
timestamp: 2026-09-25T02-40-25Z
slug: src-app-page-tsx
---
# Critique: web completa (hero, perfil CS2/FACEIT, comparación, mascota)
Method: dual-agent

## Heurísticas: 24/40 (Acceptable, subió desde 18/40)
1 Estado 2 · 2 Mundo real 3 · 3 Control 3 · 4 Consistencia 2 · 5 Prevención 2 · 6 Reconocimiento 2 · 7 Eficiencia 2 · 8 Estética 3 · 9 Errores 3 · 10 Ayuda 2

## Especificidad
Autoral y coherente hero→resultados→comparación. Detector CLI limpio; en vivo 14/16/6 hallazgos: low-contrast blanco sobre paint 4,41:1 (botón Buscar, chips P, badge Peor mapa); ai-color-palette = falso positivo (púrpura de Premier, 1 elemento x5); nested-cards en bloque de cuenta y perfil FACEIT (dudoso).

## Prioridades
- P1 Jerarquía del veredicto invertida: Trust Score 48px verde "Excelente" (solo bans/antigüedad) vs veredicto de sospecha escondido en hover de la mascota.
- P1 Comparación celebra al outlier (marcador "gana en más aspectos"), sin análisis de sospecha ni bans.
- P1 Dos reglas de "atípico" distintas (tiles 40% mejor que Nivel 10 vs suspicion.ts); verde para "mejor que Nivel 10" en herramienta anti-cheat.
- P2 Mobile: overflow 10px por "US$ 85,94" (AccountOverviewCard.tsx:154), stats fuera del primer viewport, tap targets 20px, input 15px (zoom iOS), mascota tapa valores, nombres en comparación.
- P2 A11y: gráfico Recharts sin nombre accesible; filas de comparación sin nombres de jugador para lector; H3 FACEIT bajo H2 de Steam; tabs sin flechas.
- Nota: auto-scroll fallido observado probablemente por panel oculto (rAF bloqueado), no verificado en real.

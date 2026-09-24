---
target: sección de resultados
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 3
timestamp: 2026-09-24T15-52-42Z
slug: src-components-playerresults-tsx
---
# Critique: resultados de jugador (PlayerResults)
Method: dual-agent

## Heurísticas: 18/40 (Poor)
1 Estado 3 · 2 Mundo real 2 · 3 Control 2 · 4 Consistencia 1 · 5 Prevención 2 · 6 Reconocimiento 2 · 7 Eficiencia 1 · 8 Estética 2 · 9 Errores 2 · 10 Ayuda 1

## Especificidad
Dashboard oscuro genérico; no comparte nada del mundo del hero (stencil, sand, paint). Detector en vivo: 36 hallazgos (10 undersized-ui-text, 8 low-contrast, 12 ai-color-palette [falso positivo: colores de rango Premier], 6 nested-cards [~4 falsos: grillas gap-px], 3 tiny-text, 1 cramped-padding). CLI limpio.

## Prioridades
- P0 Recuadro con backdrop-blur-xl se renderiza negro en mobile (contenedor ~4400px). page.tsx:99
- P1 Tipografía chica y plana, sin fuentes del hero, sin tabular-nums (0/77), dos h1.
- P1 Color: 16 colores de texto, semáforo que contradice benchmarks, rosa Leetify, púrpura Premier en todo.
- P1 Recuadro negro + cards anidadas (profundidad 3-4), TrustScoreCard desborda en mobile.
- P2 Gráfico Premier: labels en badge ocupan 40% en mobile, sin eje X; tabla esconde Score en mobile.

## Datos sospechosos
País "FK" crudo; "Matchmaking_competitive" crudo; Win Rate 69% vs Record 64% sin ventana; salto Premier sin anotar; reglas de color distintas para rating; TTD amarillo pero "mejor que Nivel 10"; mezcla inglés/español.

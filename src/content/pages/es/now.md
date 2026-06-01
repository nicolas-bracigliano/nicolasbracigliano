---
title: 'Ahora'
slug: 'now'
lang: es
translationId: now
date: 2026-05-23
status: published
lede: 'Lo que hay sobre la mesa ahora.'
# El detalle completo de "lo que hay sobre la mesa". Los ítems con un
# bloque `teaser:` también aparecen en la grilla del home — ver
# `benchItemsFrom()` en src/lib/now-items.ts (ADR 0014). now.md es la
# única fuente para ambos.
items:
  - kind: code
    where: 'sobre la mesa · código'
    title: 'Reescribiendo mi sitio en Astro'
    prose: 'Mi sitio anterior usaba WordPress, lo construí en 2022 y no lo toqué más. Dejó de representarme bastante antes de que lo admitiera. Hacía rato que tenía ganas de tocar Astro, así que rehacerlo fue la excusa perfecta. De cero esta vez.'
    detail:
      - dt: 'stack'
        dd: 'Astro · Cloudflare Workers'
      - dt: 'peso'
        dd: '100 Lighthouse · ~11 KB / página'
      - dt: 'aprendí'
        dd: 'lo poco que necesita de JS'
    teaser:
      label: 'código'
      line: 'Entra markdown, sale Lighthouse 100. Día cinco reescribiéndolo en Astro, más que nada para probar algo diferente.'
  - kind: guitar
    where: 'entre las manos · guitarra'
    title: 'Un año, tocando fuerte'
    prose: 'Un año adentro. Primero acordes abiertos, después riffs (Sunshine of Your Love, Come As You Are), y ahora temas enteros (505, Black). Últimamente practico parado, con la correa bien baja. Cambia el alcance, y sobre todo me dan ganas de tocar fuerte.'
    detail:
      - dt: 'riffs'
        dd: 'Sunshine of Your Love · Come As You Are'
      - dt: 'temas'
        dd: '505 · Black'
      - dt: 'ahora'
        dd: 'aprendiendo a tocar parado'
    teaser:
      label: 'guitarra'
      line: 'Un año adentro: acordes, después riffs, ahora un par de temas. Últimamente parado, correa baja.'
      guitarLabel: '· Come As You Are · 505 · Black ·'
  # - kind: garden
  #   where: 'en la huerta · jardín'
  #   title: 'Rotación de primavera, plantada'
  #   prose: 'Black Russian, San Marzano, un plantín de albahaca genovesa, manzanilla, dos tipos de ají. Las abejas nativas aparecieron dos semanas antes que el año pasado. La borraja está haciendo lo suyo.'
  #   detail:
  #     - dt: 'cantero'
  #       dd: '1.4 × 3 m elevado'
  #     - dt: 'compañeras'
  #       dd: 'tom + albahaca + manzanilla'
  #     - dt: 'esperando'
  #       dd: 'primer fruto en ~5 semanas'
  #   teaser:
  #     label: 'huerta'
  #     line: 'Black Russian, San Marzano, un cajoncito de albahaca. Los polinizadores llegaron dos semanas antes.'
  #     seedlingTag: 'tomate'
  - kind: print
    where: 'en el slicer · 3D'
    title: 'Bins Gridfinity para el cajón de herramientas'
    prose: 'Bins de 42 mm a medida, modelados en CAD según la herramienta: uno para el calibre, otro para las boquillas, cajitas con etiqueta para tuercas y bulones. Seis hasta ahora, faltan más. PLA Matte en la Bambu.'
    detail:
      - dt: 'grilla'
        dd: '42 mm estándar'
      - dt: 'filamento'
        dd: 'PLA Matte · Bambu Lab P2S'
      - dt: 'hasta ahora'
        dd: '6 bins a medida, cajón sin terminar'
    teaser:
      label: '3d'
      line: 'Bins Gridfinity a medida, modelados según la herramienta. Empezando por el cajón de impresión 3D.'
  - kind: home
    where: 'en la pared · casa'
    title: 'Piedra & Madera'
    prose: 'La mesa de la TV no es el mueble adecuado para una chiquita que trepa. La solución no es cambiar la mesa; es decidir que la pantalla forma parte de la pared, no algo apoyado en un mueble. Una carcasa de nogal anclada a la estructura de la pared, con el panel de 75″ encastrado adentro en lugar de apoyado encima.'
    detail:
      - dt: 'madera'
        dd: 'nogal'
      - dt: 'piedra'
        dd: 'tbd'
      - dt: 'medidas'
        dd: '3 × 2.7 × 0.46 m'
    teaser:
      label: 'casa'
      line: 'Carcasa de madera alrededor del TV, con un hogar apaisado y una repisa de piedra.'
  - kind: coffee
    where: 'en la taza · café + mate'
    title: 'Brimstone, y La Merced'
    prose: 'A la mañana: 22 g entran, 38 g salen, 28-30 segundos. Brimstone, CommonFolks Mornington, mucho cuerpo con notas de chocolate, y tambien algo de frutos rojos y ciruela. Cerca de las 10:30, mate. La Merced Campo, amargo. Últimamente el cuello de botella es la máquina, no los granos.'
    detail:
      - dt: 'granos'
        dd: 'Brimstone · Uganda / Kenia'
      - dt: 'mate'
        dd: 'La Merced Campo · amargo'
      - dt: 'ritual'
        dd: 'todas las mañanas · ~7:20'
  # - kind: read
  #   where: 'en los oídos · leyendo y escuchando'
  #   title: 'Borges en un oído, Ousterhout en el otro'
  #   prose: 'Leyendo A Philosophy of Software Design despacio, sobre todo en el tranvía. Borges (El jardín de senderos que se bifurcan) en audiolibro mientras podo. The Mom Test los sábados a la tarde, al sol.'
  #   detail:
  #     - dt: 'papel'
  #       dd: 'Borges · El jardín…'
  #     - dt: 'audio'
  #       dd: 'Ousterhout · A Philosophy of Software Design'
  #     - dt: 'podcast'
  #       dd: 'Ezra Klein, a veces'
---

<!--
  La página /es/sobre/ahora/ renderiza el recorrido numerado
  desde estos ítems como frontmatter; ver
  src/pages/es/sobre/ahora/index.astro. Una actualización
  semanal es un cambio en este archivo, no en código.
-->

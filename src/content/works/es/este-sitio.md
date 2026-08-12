---
title: 'Este sitio'
slug: 'este-sitio'
lang: es
translationId: this-site
date: 2026-05-21
status: published
tags: [code]
kind: code
lifecycle: ongoing
number: '01'
lede: 'El sitio que estás leyendo.'
specs:
  framework: 'astro 7'
  hosting: 'cloudflare workers'
  lenguaje: 'typescript (estricto)'
  tipos: 'newsreader · jetbrains mono'
iterations:
  - rev: 'v1.26'
    date: '2026-08-12'
    status: ongoing
    note: 'La página sobre la implementación pasa a llamarse Cómo está hecho, se muda a /como-esta-hecho y deja atrás la vieja metáfora editorial en todo el texto visible en inglés y español.'
  - rev: 'v1.24'
    date: '2026-07-07'
    note: 'Migración a Astro 7: compilador Rust, Vite 8/Rolldown, endpoints JSON estáticos para la paleta de comandos y rutas OG ajustadas para prerender con trailing slash.'
  - rev: 'v1.19'
    date: '2026-06-02'
    note: 'La página de obra pasa a ser una columna editorial: volanta, bajada, hero, ficha técnica y esta bitácora de iteraciones.'
  - rev: 'v1.16'
    date: '2026-06-02'
    note: 'Las viñetas por tipo, redibujadas como ilustraciones hechas a mano y animadas.'
  - rev: 'v1.14'
    date: '2026-06-01'
    note: 'Llega la paleta de comandos ⌘K como buscador del sitio; el banco de inicio y el recorrido de Ahora toman de una sola fuente.'
  - rev: 'v1.12'
    date: '2026-05-28'
    note: 'Inicio, banco y Ahora pasan a las colecciones de contenido; el arte SVG por entrada llega vía el campo hero.'
  - rev: 'v1.9'
    date: '2026-05-26'
    note: 'Llega el formato largo: la maqueta editorial de los ensayos, diagramas SVG reutilizables y el sistema de diseño escrito como guía del autor.'
  - rev: 'v1.7'
    date: '2026-05-24'
    note: 'Migración de Cloudflare Pages a Workers Static Assets; después se externaliza cada script inline para sostener una CSP estricta del mismo origen.'
  - rev: 'v1.3'
    date: '2026-05-23'
    note: 'Las primeras rutas de contenido alcanzan paridad con el prototipo: Cómo está hecho, Sobre, el recorrido numerado del banco y el 404 de la Carta Extraviada.'
  - rev: 'v1.0'
    date: '2026-05-22'
    status: shipping
    note: 'Cimientos: el armazón en Astro, ruteo bilingüe es/en, el tema Día/Noche sin parpadeo y View Transitions nativas.'
elsewhere:
  - label: 'github / código'
    href: 'https://github.com/nicolas-bracigliano/nicolasbracigliano'
    note: 'el repositorio de esta página'
---

Cada una de las otras entradas es algo que hice. Esta es la estantería donde se apoyan las demás. No es un portfolio; el portfolio es el trabajo mismo. Este sitio es donde guardo el trabajo, los borradores y los recibos, con las herramientas a la vista a propósito.

Estático al desplegar, casi sin JS; sin framework en la página. El contenido es markdown tipado con Zod, compilado por Astro y servido desde un único Worker de Cloudflare. Las restricciones son la parte divertida. Una política estricta que sólo permite scripts de este origen hace que nada corra inline, así que cada pedacito de comportamiento se publica como su propio archivo; sin cookies, sin analítica del lado del cliente, sin nada de terceros.

Todo está escrito dos veces, en inglés y en español, compuesto en paralelo y no traducido. Es algo en curso a propósito: la página sobre cómo está hecho se actualiza cada vez que cambia el stack, y el stack sigue cambiando.

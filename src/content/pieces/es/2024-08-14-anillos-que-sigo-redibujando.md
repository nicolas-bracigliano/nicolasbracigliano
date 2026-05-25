---
title: 'Los anillos que sigo redibujando'
slug: 'anillos-que-sigo-redibujando'
lang: es
translationKey: clean-architecture-2024-08-14
date: 2024-08-14
status: published
tags: [arquitectura, código]
lede: 'Cinco redibujos, y los anillos todavía quieren irse para afuera.'
marginNotes:
  - section: 'por-qué-anillos-no-cajitas'
    text: 'El intento más reciente lo tengo arriba del escritorio. Los cuatro anteriores quedaron en un cuaderno que no abro.'
  - section: 'casos-de-uso-o-adaptadores'
    text: 'En un rearmado de un fintech en 2022 puse toda la pasarela de pagos en "caso de uso" durante seis meses. Funcionaba. También estaba mal.'
diagrams:
  - key: 'clean-arch-rings'
    place: 'top'
    caption: 'Cuatro capas, un sentido. Cada anillo depende sólo del que tiene adentro.'
---

He dibujado estos anillos al menos cinco veces. Entidades en el centro, frameworks en el borde, las flechas apuntando hacia adentro. La Regla de Dependencias en sí está bien; las dependencias del código tienen que fluir hacia el núcleo estable. Lo difícil, cada vez, es el límite entre los casos de uso y los adaptadores de interfaz. Cada proyecto me enseña una manera distinta de dibujar esa línea.

## Por qué anillos, no cajitas

La mayoría de los diagramas de arquitectura son cajas conectadas por líneas. Las líneas significan cosas distintas en partes distintas del diagrama (a veces flujo de datos, a veces "es dueño de", a veces "llama a"), y después de un par de meses nadie se acuerda cuál era cuál. Los anillos esquivan eso. La geometría dice una sola cosa: capas, con las dependencias yendo en un solo sentido.

No podés dibujar sin querer una línea desde el centro hacia afuera. La forma no te deja. Esa es la regla hecha visible.

## Lo que evita la Regla de Dependencias

Un test para saber si tu arquitectura tiene un problema con la Regla: tratá de sacar el framework. No "reemplazar Express por Fastify"; sacarlo del todo. Hacé correr tu lógica de negocio en un script, una CLI, o un test que no importe ninguna librería HTTP.

Si lo hacés en una tarde, tus dependencias fluyen hacia adentro. Si tarda una semana y aparece que tu objeto de "dominio" sabe sobre cuerpos de request, la regla se está rompiendo en algún lado.

La primera vez que probé esto contra código de producción que había escrito yo, la estimación de "una tarde" se transformó en tres semanas. Había estado embarrando el framework por toda la app sin darme cuenta.

## Casos de uso o adaptadores

Los dos anillos de adentro (entidades, casos de uso) son obvios la mayoría de las veces. El anillo de afuera (frameworks) también: es lo que te da el runtime. La línea difícil es la tercera, "adaptadores de interfaz", y la pregunta de qué entra ahí.

Una clase de repositorio. Es un adaptador; traduce entre entidades del dominio y filas de una base de datos.

Un mailer. Probablemente sea un adaptador, si estás cruzando un límite del sistema.

Una regla de pricing con configuración por inquilino que viene de la base. Esa es la que me sigo equivocando. La mitad de mis proyectos la pusieron en "caso de uso". La otra mitad en "adaptador". Ninguna de las dos me cierra del todo.

La respuesta honesta, me parece, es: si la regla sobrevive al cambio de base de datos, es entidad o caso de uso. Si se muere, es un adaptador disfrazado. La mayoría de las reglas de pricing se mueren.

## Lo que le diría a mi yo de antes

La Regla de Dependencias es la idea que aguanta todo el peso. La torta de cuatro capas es una ayuda didáctica. Si tu proyecto termina con tres capas, o con cinco, o con otro nombre para lo que Martin llama "adaptadores", está bien. Lo que importa es que las flechas sigan apuntando hacia adentro.

La otra cosa que le diría: no trates de dibujar los anillos antes de haber entregado dos versiones de la cosa. La forma sólo aparece bajo el peso de código real. Dibujarla en un pizarrón antes del primer commit es una forma de sentirse productivo sin producir nada.

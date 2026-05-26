---
title: 'Los anillos que sigo redibujando'
slug: 'anillos-que-sigo-redibujando'
lang: es
translationKey: clean-architecture-2024-08-14
date: 2024-08-14
written: 'Melbourne, en invierno'
status: published
tags: [clean-architecture, diseño-de-software]
lede: 'Cinco redibujos después, los anillos todavía quieren migrar para afuera.'
marginNotes:
  - section: 'por-qué-anillos-no-cajitas'
    text: 'El intento más reciente lo tengo arriba del escritorio. Los cuatro anteriores quedaron en un cuaderno que no abro.'
  - section: 'casos-de-uso-o-adaptadores'
    text: 'La primera señal en aquel rearmado del fintech fue un test unitario que necesitaba una conexión a la base. La regla había cruzado un límite sin que nos diéramos cuenta.'
  - section: 'errores-que-sigo-cometiendo'
    text: 'Las entidades anémicas son el olor de un CRUD haciéndose pasar por un dominio.'
diagrams:
  - key: 'clean-arch-rings'
    place: 'top'
    caption: 'Cuatro capas, un sentido. Cada anillo depende sólo del que tiene adentro.'
---

Dibujé estos anillos al menos cinco veces. Entidades en el centro, frameworks en el borde, las flechas apuntando hacia adentro. La Regla de Dependencias en sí está bien; las dependencias del código tienen que fluir hacia el núcleo estable. Lo difícil, cada vez, es el límite entre los casos de uso y los adaptadores de interfaz. Cada proyecto me enseña una manera distinta de dibujar esa línea.

## Por qué anillos, no cajitas

La mayoría de los diagramas de arquitectura son cajas conectadas por líneas. Las líneas significan cosas distintas en partes distintas del diagrama (a veces flujo de datos, a veces "es dueño de", a veces "llama a"), y después de un par de meses nadie se acuerda cuál era cuál. Los anillos esquivan eso. La geometría dice una sola cosa: capas, con las dependencias yendo en un solo sentido.

No podés dibujar sin querer una línea desde el centro hacia afuera. La forma no te deja. Esa es la regla hecha visible.

Las cuatro capas de adentro hacia afuera son Entidades, Casos de Uso, Adaptadores de Interfaz, y Frameworks y Drivers; nombres del libro _Clean Architecture_ de Bob Martin, que apareció primero en su ensayo de 2012 con el mismo título y se expandió al libro de 2017, donde el patrón terminó de tomar su forma actual. Los nombres importan menos que el orden; lo que importa es que las dependencias fluyan siempre hacia adentro, nunca hacia afuera.

## La Regla de Dependencias

Toda la arquitectura descansa sobre una sola regla: las dependencias del código fuente apuntan sólo hacia adentro, hacia políticas de más alto nivel. Las entidades no saben de los casos de uso. Los casos de uso no saben de los adaptadores. Los adaptadores no saben de los frameworks. Cada anillo ignora a todos los anillos que están afuera de él.

Un test para saber si tu código respeta esto: probá sacar el framework. No "reemplazar Express por Fastify"; sacarlo del todo. Hacé correr tu lógica de negocio en un script, una CLI, o un test que no importe ninguna librería HTTP.

Si lo hacés en una tarde, tus dependencias fluyen hacia adentro. Si tarda una semana y aparece que tu objeto de dominio sabe sobre cuerpos de request, la regla se está rompiendo en algún lado.

La primera vez que lo probé contra código de producción que había escrito yo, la estimación de "una tarde" se transformó en tres semanas. Había estado embarrando el framework por todas las capas sin darme cuenta; validadores de request en entidades, tipos del ORM en casos de uso, formas de response que se filtraban de vuelta a funciones de dominio. El framework no era una dependencia. Era una neblina.

## Casos de uso o adaptadores

Los dos anillos de adentro son obvios la mayoría de las veces. Las entidades son los objetos de dominio que sobreviven a cada reescritura: `Order`, `Customer`, `Position`. Los casos de uso los orquestan: `PlaceOrder`, `ConfirmPayment`. El anillo de afuera también es obvio: es lo que te da el runtime.

La línea difícil es la tercera, "adaptadores de interfaz", y la pregunta de qué entra ahí. ¿Una clase de repositorio? Es un adaptador; traduce entre entidades del dominio y filas de una base de datos. ¿Un mailer? Probablemente sea un adaptador, si estás cruzando un límite del sistema. ¿Un logger? Adaptador, cruza fuera del sistema hacia el sumidero de logs.

Una regla de pricing con configuración por inquilino que viene de la base. Esa es la que me sigo equivocando.

En un rearmado de un fintech en 2010, años antes de haber leído a Martin o de pensar en estas capas; las llamábamos "service" y "data access" en aquel entonces. Puse todo el pricing de la pasarela de pagos en lo que hoy llamaría la capa de casos de uso. Funcionaba. También se desarmó cuando entró un inquilino cuya lógica de pricing dependía de la jurisdicción; la regla tenía que leer la base para saber qué jurisdicción aplicaba, lo que significaba que el caso de uso sabía del schema de la base. Habíamos roto la regla despacito, párrafo por párrafo, durante esos seis meses. Cuando el test suite necesitó una base real para correr, ya estaba perdido.

La heurística honesta: si la regla sobrevive al cambio de base de datos, es una entidad o un caso de uso. Si se muere, es un adaptador disfrazado. La mayoría de las reglas de pricing se mueren. La mayoría de las reglas de autorización sobreviven. La mayoría de las reglas de validación sobreviven, hasta que empiezan a leer tablas de lookup, momento en el que ya no.

## Errores que sigo cometiendo

Algunos patrones en los que caí más de una vez.

**Límites de capa como muros de módulos.** Poner cada capa en su propio paquete con reglas estrictas de import. A veces alcanza con una llamada a función; el muro te frena sin agregar seguridad. El límite que importa es la _dirección de las dependencias_, no el namespace. Un monolito con imports disciplinados respeta la Regla de Dependencias sin problema; un proyecto de cuatro paquetes donde un caso de uso importa de la capa de adaptadores, o peor, donde una entidad referencia tipos de request HTTP, no.

**Entidades anémicas.** Objetos de dominio sin comportamiento, sólo datos. `Order { id, items, total }` con `PlaceOrder` haciendo todo el cálculo. Eso es el caso de uso absorbiendo lo que debería ser de la entidad. Si tus entidades sólo tienen getters, tenés un CRUD haciéndose pasar por un dominio.

**Confundir "service" con "caso de uso".** Los services suelen abarcar varios casos de uso ("OrderService" maneja altas, reembolsos, cancelaciones, reportes). Los casos de uso son atómicos; un verbo, un límite de transacción, una sola razón para fallar. Un service inflado son varios casos de uso que no se molestaron en dibujarse su propio anillo.

**Dibujar los anillos antes de tiempo.** Bosquejar la arquitectura en un pizarrón antes del primer commit. La forma sólo aparece bajo el peso del código real; antes de eso es una ilusión. La primera versión del diagrama siempre está mal.

## Cuándo elegir otra cosa

Clean Architecture cuesta algo. Cada caso de uso es una clase. Cada agregado lleva una interfaz de repositorio. Cada cosa del framework lleva un adaptador. Para una app de CRUD chica, un sitio de marketing con un formulario, una API personal con dos endpoints, un script que corre por la noche; eso es overhead sin payoff.

El umbral honesto para meterte con arquitectura en capas: cuando **dos o más frameworks** probablemente toquen el mismo dominio (por ejemplo, API HTTP + cola de workers + job agendado), cuando **la lógica de dominio no es trivial** (pricing, scheduling, autorización, cualquier cosa donde las reglas tienen reglas), y cuando **el sistema va a vivir años**, no meses.

Para todo lo demás, patrones más livianos funcionan mejor. Hexagonal Architecture ("ports and adapters", de Alistair Cockburn) es la misma idea con menos capas y menos vocabulario. Onion Architecture es la misma idea otra vez con otros términos. Domain-Driven Design se superpone bastante; el "domain model" de DDD y las "entidades" de Clean Architecture apuntan al mismo concepto. Para apps chicas, un Model-View-Controller plano con una capa de funciones "service" alcanza y sobra. Para prototipos, nada; dejá que el framework sea la arquitectura hasta que el prototipo se gane el derecho a una estructura.

La trampa es _aprender Clean Architecture y aplicarla en todos lados._ El framework castiga el uso excesivo.

## Lo que le diría a mi yo de antes

La Regla de Dependencias es la idea que aguanta el peso. La torta de cuatro capas es una ayuda didáctica. Si tu proyecto termina con tres capas, o cinco, o con otro nombre para lo que Martin llama "adaptadores", está bien. Lo que importa es que las flechas sigan apuntando hacia adentro.

La otra cosa que le diría a mi yo de antes: no trates de dibujar los anillos antes de haber entregado dos versiones de la cosa. La forma sólo aparece bajo el peso del código real. Dibujarla en un pizarrón antes del primer commit es una manera de sentirse productivo sin producir nada.

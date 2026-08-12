---
title: 'Los círculos que sigo redibujando'
slug: 'circulos-que-sigo-redibujando'
lang: es
translationId: clean-architecture-2024-08-14
date: 2024-08-14
written: 'Melbourne, en invierno'
status: published
tags: [clean-architecture, diseño-de-software]
lede: 'Cinco redibujos después, las capas todavía insisten en escaparse hacia afuera.'
marginNotes:
  - section: 'por-qué-círculos-y-no-cajas'
    text: 'El intento más reciente lo tengo arriba del escritorio. Los cuatro anteriores quedaron en un cuaderno que no abro.'
  - section: 'casos-de-uso-o-adaptadores'
    text: 'La primera señal durante la reescritura de aquel sistema fintech fue un test unitario que necesitaba conectarse a la base. La regla había cruzado un límite sin que lo notáramos.'
  - section: 'errores-que-sigo-cometiendo'
    text: 'Las entidades anémicas son la señal de un CRUD disfrazado de dominio.'
diagrams:
  - key: 'clean-arch-rings'
    place: 'top'
    caption: 'Cuatro capas, una sola dirección. Cada capa depende únicamente de las capas interiores.'
---

Dibujé estos círculos al menos cinco veces: entidades en el centro, frameworks en el borde y flechas apuntando hacia adentro. La Regla de Dependencias es sólida; las dependencias del código deben fluir hacia el núcleo estable. Lo que me cuesta, una y otra vez, es trazar el límite entre los casos de uso y los adaptadores de interfaz. Cada proyecto me enseña una forma distinta de dibujar esa línea.

## Por qué círculos y no cajas

La mayoría de los diagramas de arquitectura son cajas conectadas por líneas. Esas líneas significan cosas distintas según dónde aparezcan (flujo de datos, propiedad, una llamada) y, después de un par de meses, nadie recuerda cuál era cuál. Los círculos concéntricos evitan ese problema. La geometría expresa una sola idea: capas cuyas dependencias avanzan en una única dirección.

En un diagrama de círculos concéntricos, una flecha que apunta hacia afuera se nota enseguida. La propia forma vuelve visible la regla.

Las cuatro capas, de adentro hacia afuera, son Entidades, Casos de Uso, Adaptadores de Interfaz y Frameworks y Drivers. Son los nombres que usa Bob Martin en _Clean Architecture_: primero en su ensayo de 2012 y luego en el libro de 2017, donde el patrón tomó su forma actual. Los nombres importan menos que el orden. Lo esencial es que las dependencias siempre apunten hacia adentro, nunca hacia afuera.

## La Regla de Dependencias

Toda la arquitectura descansa sobre una regla: las dependencias del código fuente apuntan únicamente hacia adentro, hacia políticas de mayor nivel. Las entidades no conocen los casos de uso. Los casos de uso no conocen los adaptadores. Los adaptadores no conocen los frameworks. Cada capa ignora todo lo que queda fuera de ella.

Una prueba para saber si tu código respeta la regla: intentá quitar el framework. No reemplazar Express por Fastify, sino eliminarlo por completo. Ejecutá la lógica de negocio desde un script, una CLI o un test que no importe ninguna librería HTTP.

Si podés hacerlo en una tarde, las dependencias fluyen hacia adentro. Si una semana después descubrís que el objeto de dominio conoce el cuerpo de un request, la regla se rompió en algún punto.

La primera vez que hice la prueba sobre código de producción escrito por mí, la estimación de "una tarde" se convirtió en tres semanas. Sin darme cuenta, había dejado que el framework se filtrara por todas las capas: validadores de requests dentro de entidades, tipos del ORM en los casos de uso, estructuras de respuesta que llegaban hasta funciones de dominio. El framework no era una dependencia. Era una neblina.

## Casos de uso o adaptadores

Las dos capas interiores suelen ser fáciles de reconocer. Las entidades son los objetos de dominio que sobreviven a cada reescritura: `Order`, `Customer`, `Position`. Los casos de uso los coordinan: `PlaceOrder`, `ConfirmPayment`. La capa exterior también es clara: contiene lo que proporciona el runtime.

La frontera difícil es la tercera: los adaptadores de interfaz. ¿Qué pertenece ahí? Una clase de repositorio es un adaptador porque traduce entre entidades del dominio y filas de una base de datos. Un mailer probablemente también lo sea, si cruza un límite del sistema. Lo mismo un logger, que sale del sistema hacia el destino de los logs.

El caso que todavía me hace dudar es el de una regla de precios cuya configuración por tenant viene de la base de datos.

En 2010 participé en la reescritura de un sistema fintech, años antes de leer a Martin o pensar en estas capas; en ese momento las llamábamos "service" y "data access". Puse todas las reglas de precios de la pasarela de pagos en lo que hoy llamaría la capa de casos de uso. Funcionaba, hasta que llegó un tenant cuya lógica dependía de la jurisdicción. La regla tenía que consultar la base para saber cuál correspondía y, por lo tanto, el caso de uso conocía su esquema. Durante seis meses habíamos roto la regla de a poco, línea por línea. Cuando la suite de tests necesitó una base real para ejecutarse, ya era demasiado tarde.

La heurística más honesta es esta: si la regla sobrevive a un cambio de base de datos, pertenece a una entidad o a un caso de uso. Si no sobrevive, es un adaptador disfrazado. La mayoría de las reglas de precios no pasa la prueba. Las de autorización suelen pasarla. Las de validación también, hasta que empiezan a consultar tablas auxiliares.

## Errores que sigo cometiendo

Algunos patrones en los que caí más de una vez.

**Convertir los límites de capa en muros entre módulos.** Poner cada capa en su propio paquete y aplicar reglas estrictas de importación. A veces basta una llamada a una función; el muro agrega fricción sin aportar seguridad. Lo importante es la _dirección de las dependencias_, no el namespace. Un monolito con imports disciplinados puede respetar perfectamente la regla. Un proyecto dividido en cuatro paquetes no la respeta si un caso de uso importa la capa de adaptadores o, peor todavía, si una entidad referencia tipos de requests HTTP.

**Entidades anémicas.** Objetos de dominio sin comportamiento, compuestos solo por datos. `Order { id, items, total }`, mientras `PlaceOrder` hace todos los cálculos. El caso de uso está absorbiendo una responsabilidad de la entidad. Si tus entidades solo tienen getters, tenés un CRUD disfrazado de dominio.

**Confundir un "service" con un caso de uso.** Los services suelen abarcar varias operaciones: `OrderService` maneja altas, reembolsos, cancelaciones y reportes. Los casos de uso son atómicos: un verbo, un límite de transacción, una sola razón para fallar. Un service inflado suele ser un conjunto de casos de uso distintos escondidos bajo un mismo nombre.

**Dibujar los círculos demasiado pronto.** Bosquejar la arquitectura en un pizarrón antes del primer commit. La forma aparece recién bajo el peso del código real; antes es una ilusión. La primera versión del diagrama siempre está equivocada.

## Cuándo elegir otra cosa

Clean Architecture tiene un costo. Cada caso de uso se convierte en una clase. Cada agregado necesita una interfaz de repositorio. Cada pieza del framework requiere un adaptador. Para una aplicación CRUD pequeña, un sitio de marketing con un formulario, una API personal con dos endpoints o un script nocturno, es complejidad sin beneficio.

El umbral honesto para adoptar una arquitectura en capas aparece cuando **dos o más frameworks** probablemente toquen el mismo dominio (por ejemplo, una API HTTP, una cola de workers y un job programado), cuando **la lógica de dominio no es trivial** (precios, scheduling, autorización; cualquier área donde las reglas tengan sus propias reglas) y cuando **el sistema vaya a vivir años**, no meses.

Para todo lo demás funcionan mejor patrones más livianos. Hexagonal Architecture ("ports and adapters", de Alistair Cockburn) propone la misma idea con menos capas y vocabulario. Onion Architecture vuelve a expresarla con otros términos. Domain-Driven Design se superpone bastante: el _domain model_ de DDD y las entidades de Clean Architecture apuntan al mismo concepto. Para aplicaciones pequeñas, un Model-View-Controller sencillo con una capa de funciones de servicio alcanza de sobra. Para prototipos, nada: dejá que el framework sea la arquitectura hasta que el proyecto se gane el derecho a tener una estructura propia.

La trampa está en _aprender Clean Architecture y aplicarla en todas partes_. El enfoque se vuelve contraproducente cuando se usa de más.

## Lo que le diría a mi yo de antes

La Regla de Dependencias es la idea que realmente soporta el peso. El diagrama de cuatro capas es una ayuda didáctica. Si tu proyecto termina con tres capas, cinco o con otro nombre para lo que Martin llama adaptadores, está bien. Lo importante es que las flechas sigan apuntando hacia adentro.

También le diría esto: no dibujes los círculos antes de haber entregado dos versiones del sistema. La forma aparece bajo el peso del código real. Dibujarla en un pizarrón antes del primer commit es una forma de sentirse productivo sin haber producido nada.

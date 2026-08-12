---
title: 'C4, cuatro veces seguidas'
slug: 'c4-cuatro-veces-seguidas'
lang: es
translationId: c4-diagrams-2024-08-01
date: 2024-08-01
written: 'Melbourne, en invierno'
status: published
tags: [c4-model, arquitectura-de-software, diagramas]
lede: 'Diagramas de arquitectura donde nadie tiene que preguntar qué significa cada caja.'
marginNotes:
  - section: 'antes-de-c4'
    text: 'Creo que como industria desperdiciamos toda una generación de arquitectos en UML.'
  - section: 'los-cuatro-niveles'
    text: 'La documentación de Simon Brown en c4model.com sigue siendo la mejor referencia. Siempre la tengo abierta en una pestaña.'
  - section: 'cuándo-parar'
    text: 'El nivel 4 es el que casi nunca dibujo. El propio código ya es el diagrama y se mantiene actualizado solo.'
diagrams:
  - key: 'c4-wheel'
    place: 'top'
    caption: 'Cuatro niveles de zoom. El sistema entero en el nivel 1; un componente en el nivel 4.'
  - key: 'c4-context'
    place: 'bottom'
    caption: 'Nivel 1: Contexto del Sistema. El sistema como una sola caja rodeada de sus usuarios y dependencias externas.'
  - key: 'c4-containers'
    place: 'bottom'
    caption: 'Nivel 2: Contenedores. Un acercamiento al sistema para ver sus aplicaciones y almacenes de datos.'
  - key: 'c4-components'
    place: 'bottom'
    caption: 'Nivel 3: Componentes. Un acercamiento a un contenedor para ver sus componentes internos.'
  - key: 'c4-code'
    place: 'bottom'
    caption: 'Nivel 4: Código. Un acercamiento a un componente para ver sus clases. Suele ser opcional.'
---

Los diagramas de arquitectura que hacía antes de C4 tenían cajas, líneas, alguna flecha y, casi siempre, una pregunta posterior sobre qué significaba una de esas cajas. C4 elimina esa ambigüedad: te obliga a elegir un nivel de zoom y después a redibujar el mismo sistema cada vez más cerca. Hacerlo cuatro veces parece excesivo hasta que alguien pregunta por tercera vez "¿pero dónde va la base de datos?" y podés señalar el nivel 2 en lugar de empezar de nuevo.

## Antes de C4

Los diagramas que dibujaba en mis primeros tres trabajos eran una especie de UML. Usábamos el vocabulario visual (cajas, rombos, flechas punteadas) sin haber acordado qué significaba cada forma. En un proyecto, una línea punteada quería decir "depende de". En el siguiente, "es asíncrono". En el tercero, "no sé cómo representar esto; preguntame".

Las conversaciones terminaban siempre igual. Alguien pegaba un diagrama en la pared, tres ingenieros lo interpretaban de tres maneras distintas y la reunión se desviaba hacia "¿qué representa esta caja?". El diagrama debía quitar ambigüedad, pero sumaba un poco más.

C4 resuelve esa ambigüedad siendo deliberadamente aburrido: cuatro formas, cuatro alcances, un solo sentido de zoom.

## Los cuatro niveles

Simon Brown desarrolló C4 entre fines de los 2000 y la década siguiente, después de años de consultoría en los que vio repetirse la misma confusión de cliente en cliente. La referencia pública es c4model.com; la documentación es gratuita, breve y no teme tomar posición. Los nombres importan menos que el zoom.

**Nivel 1 (Contexto del Sistema).** Tu sistema es una sola caja. Alrededor están las personas que lo usan y los sistemas externos con los que se comunica. Nada más. Es un diagrama de cinco minutos, útil incluso para quienes no son técnicos.

**Nivel 2 (Contenedor).** Acercás el zoom a la caja y aparecen las principales unidades desplegables: aplicación web, aplicación móvil, API, base de datos, cola de mensajes. Cada contenedor puede ejecutarse por separado. Es el nivel que necesita cualquier ingeniero nuevo para entender la forma general del sistema.

Un contenedor de C4 no es un contenedor de Docker. Simon Brown eligió el término años antes de que Docker lo popularizara y lleva una década aclarando la confusión en c4model.com. En C4, un contenedor es cualquier cosa que se ejecuta como proceso independiente o dentro de su propio runtime: una aplicación web, un daemon, una función serverless o un motor de base de datos. Docker es apenas una forma de empaquetar algunos de ellos. El choque terminológico es desafortunado; el concepto es anterior.

**Nivel 3 (Componente).** Acercás el zoom a un contenedor y ves sus módulos principales: autenticación, pedidos, pagos, reportes. Sirve para discutir dónde debería vivir una funcionalidad nueva.

**Nivel 4 (Código).** Acercás el zoom a un componente y aparecen sus clases, interfaces y relaciones. A veces sirve; casi siempre se omite. El propio código ya es el diagrama y se mantiene actualizado sin trabajo extra.

La palabra clave en los cuatro niveles es "útil". Si el diagrama no le sirve a la gente que está en la sala, elegiste el nivel equivocado.

## Lo que C4 hace bien

Tres cosas, en orden de importancia:

La jerarquía de zoom es explícita. Cuando alguien dice "el componente de autenticación", no hay dudas sobre el nivel: es un componente de Nivel 3, no un contenedor de Nivel 2 ni un sistema de Nivel 1. La palabra puede repetirse; el alcance queda claro por el contexto.

Las formas conservan su significado en todos los niveles. Una caja siempre representa algo que se ejecuta. Una línea siempre representa una relación. Una línea punteada siempre indica comunicación asíncrona. Como el vocabulario está fijado, no podés introducir por accidente una notación que solo entiende tu equipo.

El modelo también sabe cuándo detenerse. No hace falta dibujar todos los pasos. La mayoría de los sistemas solo necesita los niveles 1 y 2; algunos requieren el 3 para un contenedor particular; muy pocos justifican un nivel 4. El framework te da permiso para parar.

## Lo que no arregla

C4 no te dice si la arquitectura es buena. Es una notación, no un método de diseño. Podés dibujar un sistema espantoso respetando C4 a la perfección. La notación cumple su función; el sistema sigue siendo espantoso.

Tampoco resuelve el problema del diagrama desactualizado. Los diagramas todavía requieren mantenimiento, y cada nivel adicional suma trabajo. La defensa más barata es quedarse en el nivel más alto que alcance. Los niveles 1 y 2 cambian despacio. El 3 cambia cuando un componente importante se divide o se fusiona. El 4 cambia todo el tiempo y suele estar viejo antes de que empiece la reunión.

Para un sistema que lleva tiempo en producción, la opción más barata es mantener al día los niveles 1 y 2. Dibujá el 3 solo si necesitás explicar un contenedor específico. Omití por completo el 4 y dejá que hable el código.

## Errores que sigo cometiendo

Algunos en los que caí más de una vez.

**Dibujar los cuatro niveles por defecto.** Es tratar C4 como una checklist en lugar de una herramienta de zoom. La mayoría de los sistemas solo necesita los niveles 1 y 2. El 3 se decide contenedor por contenedor; el 4 rara vez justifica su mantenimiento. Hacer cuatro diagramas cuando bastaba uno solo crea más trabajo y más oportunidades para que se contradigan.

**Mezclar niveles en un mismo diagrama.** Poner una base de datos (un contenedor de Nivel 2) junto a una clase (código de Nivel 4) vuelve ilegible la imagen porque el zoom deja de ser consistente. Todo el valor de C4 está en elegir un nivel. Mezclarlos devuelve el diagrama al desorden de cajas y líneas que intentaba resolver.

**Representar comportamiento con C4.** Intentar mostrar "el usuario envía el formulario, la API hace X y después Y" mediante cajas de C4. C4 describe estructura: dice qué existe, no qué ocurre. Para comportamiento, usá un diagrama de secuencia. Las cajas de C4 coexisten; no cuentan una secuencia.

**Dejar desactualizado un diagrama de Nivel 3.** Un diagrama de componentes que no se toca hace seis meses es peor que no tener ninguno: alguien va a confiar en él y va a equivocarse. La defensa más barata es trabajar en niveles que no cambian cada semana. El Nivel 3 es el más riesgoso; si no podés mantenerlo, no lo dibujes.

## Cuándo esto no es la herramienta indicada

C4 funciona muy bien en sistemas con una estructura interna significativa y varias personas trabajando sobre ella. En algunos casos, sobra o directamente no corresponde:

**Prototipos descartables.** Si es posible que el sistema no exista dentro de tres meses, no pierdas tiempo diagramándolo. Un README de un párrafo (o nada) describe con más honestidad lo que es ese código.

**Monolitos de un solo proceso y un único contribuidor.** La estructura es el propio código; el árbol de carpetas ya funciona como diagrama. C4 agrega notación para problemas que no existen.

**Documentación puramente de comportamiento.** Máquinas de estado, flujos de requests, lógica de scheduling. Para eso sirven los diagramas de secuencia o de estado. C4 muestra qué hay, no qué sucede.

**Como sustituto del diseño.** C4 documenta una arquitectura existente o una decisión ya tomada. Si usás sus cajas para decidir qué construir, estás convirtiendo una notación en herramienta de pensamiento. Hay opciones mejores: listas, prosa o un pizarrón con flechas que todavía no pretenden significar nada.

## Cuándo parar

Dibujé sistemas C4 con los cuatro niveles y otros con uno solo. La cantidad correcta es la que responde las preguntas que la gente realmente hace. Si todos preguntan "¿dónde vive la autenticación?", dibujá el Nivel 3 del contenedor correspondiente. Si nadie lo pregunta, no lo dibujes.

La disciplina que propone C4 no es "dibujá siempre cuatro diagramas". Es "sabé en qué nivel estás antes de empezar y no mezcles dos sin darte cuenta".

---
title: 'C4, cuatro veces seguidas'
slug: 'c4-cuatro-veces-seguidas'
lang: es
translationKey: c4-diagrams-2024-08-01
date: 2024-08-01
status: published
tags: [arquitectura, diagramas]
lede: 'Diagramas de arquitectura que nadie pregunta después qué quiere decir esa caja.'
marginNotes:
  - section: 'antes-de-c4'
    text: 'Creo que como industria desperdiciamos toda una generación de arquitectos en UML.'
  - section: 'los-cuatro-niveles'
    text: 'La doc de Simon Brown en c4model.com sigue siendo la mejor referencia. La tengo siempre en una pestaña.'
  - section: 'cuando-parar'
    text: 'El nivel 4 es el que casi nunca dibujo. El código mismo es el diagrama, y se mantiene en sincro gratis.'
diagrams:
  - key: 'c4-wheel'
    place: 'top'
    caption: 'Cuatro niveles de zoom. El sistema entero en el nivel 1; un componente en el nivel 4.'
  - key: 'c4-context'
    place: 'bottom'
    caption: 'Nivel 1: Contexto de Sistema. El sistema como una sola caja rodeado de sus usuarios y dependencias externas.'
  - key: 'c4-containers'
    place: 'bottom'
    caption: 'Nivel 2: Contenedores. El sistema con un zoom adentro para ver las aplicaciones y los almacenes de datos internos.'
  - key: 'c4-components'
    place: 'bottom'
    caption: 'Nivel 3: Componentes. Un contenedor con un zoom adentro para ver sus componentes internos.'
  - key: 'c4-code'
    place: 'bottom'
    caption: 'Nivel 4: Código. Un componente con un zoom adentro para ver sus clases. Normalmente opcional.'
---

Los diagramas de arquitectura que hacía antes de C4 tenían cajas, líneas, a veces flechas, y casi siempre una pregunta después sobre qué quería decir alguna de las cajas. C4 arregla esto obligándote a comprometerte con un nivel de zoom, y después te hace dibujar el mismo sistema en el nivel siguiente, y en el siguiente, y en el siguiente. Cuatro veces seguidas se siente excesivo hasta la tercera vez que alguien pregunta "¿pero la base dónde va?" y podés apuntar al nivel 2 en vez de redibujar.

## Antes de C4

Los diagramas que dibujaba en mis primeros tres trabajos eran UML, más o menos. Teníamos el vocabulario visual (cajas, rombos, flechas punteadas) sin que nadie se pusiera de acuerdo en qué significaba cada forma. En un proyecto, una línea punteada quería decir "depende de". En el siguiente, quería decir "asíncrono". En el tercero, quería decir "no estoy seguro cómo representar esto, preguntame".

Las conversaciones iban siempre igual. Alguien pegaba un diagrama en la pared, tres ingenieros lo interpretaban de tres maneras distintas, y la reunión se descarrilaba en "¿qué representa esta caja?". El diagrama estaba pensado para sacar ambigüedad; agregaba un poco.

C4 arregla la ambigüedad siendo aburridamente explícito. Cuatro formas, cuatro alcances, un solo sentido de zoom.

## Los cuatro niveles

Simon Brown los llama Context, Container, Component, Code. El nombre exacto no es lo importante; el zoom sí.

**Nivel 1 (Contexto de Sistema).** Tu sistema es una sola caja. Alrededor están las personas que lo usan y los sistemas externos con los que habla. Listo. Diagrama de cinco minutos, útil para cualquier persona no técnica en la sala.

**Nivel 2 (Contenedor).** Acercás el zoom a la caja. Ahora ves las unidades desplegables principales: aplicación web, mobile, API, base de datos, cola de mensajes. Cada contenedor es una cosa que se puede correr por separado. Útil para cualquier ingeniero nuevo que esté tratando de entender la forma del sistema.

**Nivel 3 (Componente).** Acercás el zoom a un contenedor. Ahora ves los módulos internos principales: autenticación, órdenes, pagos, reportes. Útil cuando se discute dónde tiene que vivir una feature nueva.

**Nivel 4 (Código).** Acercás el zoom a un componente. Ahora ves clases, interfaces, las relaciones entre ellas. Útil a veces, casi siempre se saltea. El código mismo es el diagrama, y se mantiene en sincro sin que vos tengas que mantenerlo.

La palabra clave en los cuatro es "útil". Si el diagrama no es útil para quien está en la sala, dibujaste el nivel equivocado.

## Lo que C4 hace bien

Tres cosas, en orden de importancia:

La jerarquía de zoom es explícita. Cuando alguien dice "el componente de auth", no hay ambigüedad sobre a qué nivel se refiere. Es un componente de Nivel 3, no un contenedor de Nivel 2, no un sistema de Nivel 1. Misma palabra, distinto alcance, siempre claro por el contexto.

Las mismas formas significan las mismas cosas en todos los niveles. Una caja siempre es una cosa que corre. Una línea siempre es una relación. Una línea punteada siempre es asíncrono. No podés meter sin querer vocabulario privado porque el vocabulario está fijo.

El modelo sabe cuándo parar. No tenés que dibujar todos los niveles. La mayoría de los sistemas sólo necesitan el 1 y el 2; algunos necesitan el 3 para un contenedor en particular; muy pocos necesitan el 4 en algún lado. El marco te da permiso para parar.

## Lo que no arregla

C4 no te va a decir si tu arquitectura está bien. Es una notación, no un método de diseño. Podés dibujar un diagrama perfectamente C4-conforme de un sistema horrible. La notación cumple su trabajo, el sistema sigue horrible.

Tampoco arregla el problema del "diagrama desactualizado". Los diagramas siguen necesitando mantenimiento; cuantos más niveles dibujás, más hay para mantener. La forma de limitarlo es dibujar el nivel más alto con el que puedas zafar. Los niveles 1 y 2 cambian despacio. El nivel 3 cambia cuando un componente importante se parte o se fusiona. El nivel 4 cambia todo el tiempo y normalmente ya está mal cuando empieza la reunión.

El setup más barato, para un sistema que viene corriendo hace rato: mantené el Nivel 1 y el Nivel 2 al día. Saltate el Nivel 3 a menos que estés haciendo onboarding sobre un contenedor específico. Saltate el Nivel 4 del todo; dejá hablar al código.

## Cuándo parar

He dibujado diagramas C4 para sistemas donde dibujé los cuatro niveles y para sistemas donde dibujé uno. El número correcto es el que contesta las preguntas que la gente realmente está haciendo. Si todos siguen preguntando "dónde vive la auth", dibujá el Nivel 3 del contenedor correcto. Si nadie pregunta, no lo dibujes.

La disciplina que te da C4 no es "dibujá cuatro diagramas siempre". Es "sabé en qué nivel estás cuando empezás a dibujar, y no mezcles dos sin querer".

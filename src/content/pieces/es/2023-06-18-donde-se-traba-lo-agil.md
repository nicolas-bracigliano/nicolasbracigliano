---
title: 'Dónde se traba lo ágil'
slug: 'donde-se-traba-lo-agil'
lang: es
translationKey: agile-stuck-2023-06-18
date: 2023-06-18
status: published
tags: [agile, scrum, equipo]
lede: 'Los standups se desvían. Las retros se cortan. El patrón no es ágil fallando.'
marginNotes:
  - section: 'la-deriva-del-standup'
    text: 'Si tu standup es para tu manager, el que está haciendo el standup es tu manager.'
  - section: 'lo-que-se-corta-primero'
    text: 'Nunca vi un equipo cortar la reunión de planning. Siempre la retro.'
  - section: 'errores-que-sigo-cometiendo'
    text: "Scrum es un sabor de ágil. 'Acá no hacemos ágil' suele querer decir 'acá no hacemos Scrum'. Vale chequear cuál de las dos se está diciendo."
diagrams:
  - key: 'agile-road-knot'
    place: 'top'
    caption: 'Donde suele empezar, a la izquierda; donde debería llegar, a la derecha. La mayoría se queda en el medio.'
---

En tres de los últimos cuatro trabajos que tuve, ágil era la forma en que decíamos que trabajábamos. En los cuatro, el standup diario se había desviado a una reunión de status para los managers a los seis meses. El patrón no es que lo ágil no funcione. Es que las partes que requieren paciencia (las retros, un Scrum Master de verdad, no llenar el sprint al 100%) son las primeras que se cortan cuando el equipo está bajo presión.

## La deriva del standup

La deriva siempre se ve igual. Semana uno, el standup es rápido: tres preguntas, quince minutos, el equipo se desbloquea solo. Mes tres, el standup es un check-in: cada uno reporta hacia arriba, el manager escucha, el equipo está en silencio salvo cuando le hablan. Misma reunión, función completamente distinta.

El mecanismo es simple. Sube la presión, alguien arriba del equipo necesita visibilidad, el standup es la superficie más cómoda para sacarla. Cuando la reunión empieza a contestar "qué hizo cada uno ayer" en vez de "qué nos está trabando hoy", se transformó en una reunión de status. Lo único que no cambió es el nombre en el calendario.

Si tu standup es para tu manager, el que está haciendo el standup es tu manager. Eso es una reunión de status. Las reuniones de status están bien, pero no tendrían que ser diarias, y no tendrían que disfrazarse de ceremonia ágil.

## Qué hace en concreto el Scrum Master

Todos los equipos en los que trabajé que tenían un Scrum Master de verdad tenían una persona específica cuyo trabajo era darse cuenta de la deriva antes que nadie. No un developer que también corría las ceremonias. No el manager con dos sombreros. Un rol aparte.

Lo que esa persona hacía, en concreto: decía "noté que los últimos tres standups fueron sobre reportar hacia arriba, no sobre desbloquearnos. Volvamos a las tres preguntas". O: "Salteamos la retro dos veces seguidas. La vamos a saltear de nuevo la semana que viene y lo voy a nombrar como patrón". O: "El sprint está al 130%. O sacamos tres cosas, o acordamos ahora que dos de ellas van a quedar para el siguiente".

Estas intervenciones parecen chicas. No lo son. La razón por la que existe el rol de Scrum Master es que todos los demás en el equipo tienen un interés en que el trabajo continúe; el Scrum Master tiene un interés en que el equipo continúe trabajando bien. Esas dos cosas se superponen la mayoría del tiempo y se separan bajo presión.

Los equipos que no tienen a alguien en este rol no son inmediatamente peores. Son peores al tercer mes, al sexto mes, al segundo proyecto. La deriva se acumula.

## Lo que se corta primero

Hay un orden predecible. La retro se va primero. Es la única ceremonia sin output inmediato y con la mayor incomodidad. Saltearla una vez está bien; dos veces es un patrón; cuatro veces es una cultura.

El planning se corta segundo, pero más sutilmente. La reunión sigue existiendo, pero se acorta de "qué es posible en dos semanas" a "qué dice el backlog para la próxima". La conversación sobre capacidad deja de pasar.

Después se va el colchón. Los sprints se llenan al 100% de la capacidad, después al 110%, después al 130% con la suposición de que "nos vamos a poner al día". El equipo se pone al día trabajando hasta tarde, después cortando esquinas, después metiendo el tipo de bugs que hacen que el próximo sprint sea peor.

Los standups se transforman en reuniones de status, las retros dejan de pasar, el planning se transforma en vaciado de backlog, la capacidad se infla. Ninguna de estas cosas es ágil fallando. Son ágil siendo erosionado por la presión, una ceremonia a la vez.

## Errores que sigo cometiendo

Algunos patrones en los que caí, o en los que vi caer a equipos de los que formé parte, más de una vez.

**Tratar Scrum y ágil como si fueran lo mismo.** Scrum es un framework específico: tres roles, cuatro ceremonias, tres artefactos. Ágil es más viejo y más amplio; son los valores y principios del manifiesto, más un conjunto más grande de prácticas que pueden o no incluir Scrum. "Acá no hacemos ágil" suele querer decir "acá no hacemos Scrum". Es un reclamo distinto, y la conversación que sigue es distinta. Vale chequear cuál de las dos se está diciendo.

**La velocity como objetivo.** La velocity es una descripción de cuánto hizo el equipo el sprint pasado. Sirve para planificar el siguiente. En el momento en que se convierte en objetivo ("el equipo tiene que llegar a 40 puntos este sprint"), entra la ley de Goodhart: cualquier medida que se convierte en objetivo deja de ser una buena medida. Los puntos se inflan, el valor de planificación se cae, y el número deja de decir nada sobre la realidad. La velocity es una medición, no una cuota.

**Tratar el compromiso del sprint como un contrato.** El objetivo del sprint es un pronóstico bajo incertidumbre. Si aparece algo urgente a mitad de sprint, lo correcto es renegociar, no absorber el trabajo nuevo en silencio y fallar el compromiso original. Los equipos que tratan el compromiso como contrato terminan o mintiendo sobre la finalización o trabajando hasta tarde para no mentir. Renegociar es la versión barata de la misma conversación.

**Hacer las ceremonias como teatro.** Pasar por los movimientos del planning, el standup, la review, la retro porque el framework lo dice, sin las conversaciones que las ceremonias estaban diseñadas para sacar a flote. El chequeo es si la ceremonia efectivamente cambia algo que el equipo hace después. Si la retro nunca produce un cambio de comportamiento, la retro se volvió teatro. La solución casi nunca es "más ceremonias"; suele ser "menos, y hacé la cosa".

## Cuándo esto no es la herramienta indicada

Lo ágil estilo Scrum entra bien en equipos cross-funcionales estables haciendo desarrollo incremental de producto con un product owner claro. Entra peor en algunos casos:

**Trabajo solo.** Si sos una persona, ceremonias diseñadas para un equipo de cinco son overhead. Usá las partes que te sirvan (un backlog, capaz una retro semanal con vos mismo) y saltate el resto. El framework no se gana su peso con un equipo de uno.

**Investigación o R&D pura.** Scrum asume que el trabajo se puede partir en bloques sprinteables con outputs entregables. La investigación no entra en esa forma; un sprint puede terminar en "aprendimos que X no funciona, esto es lo próximo a probar". Eso es un buen resultado para investigación y uno confuso para el reporting de Scrum. Cambiar el encuadre ayuda: timeboxes alrededor de preguntas, no alrededor de entregables.

**Contratos con alcance y deadline fijos.** La premisa de lo ágil es que el alcance y las prioridades se pueden mover ante información nueva. Los contratos que fijan los dos no dejan nada para que el equipo negocie. El trabajo puede seguir siendo incremental e iterativo; llamarlo Scrum no cambia la restricción, y pretender que sí desperdicia el tiempo de todos en el próximo planning.

**Equipos con rotación alta.** Scrum acumula valor sobre meses: la retro alimenta a la próxima retro, el equipo aprende su propia velocity, el mismo Scrum Master nota las mismas derivas y agarra cada vez más rápido. Un equipo que rota cada seis semanas no acumula. Las ceremonias siguen pasando, pero la memoria institucional sobre la que la retro se construye no sobrevive la rotación. Otro problema; otras herramientas.

## Lo que protegería

**La retro, siempre.** Es la única ceremonia cuyo trabajo explícito es mejorar la capacidad del equipo de hacer el próximo sprint. Cortá toda otra ceremonia antes que ésa.

**El rol de Scrum Master**, si lo podés tener. Si no podés tener uno dedicado, rotalo semana a semana así siempre hay alguien con la responsabilidad explícita de notar la deriva. No "todos somos dueños". Rotado específicamente, esta semana.

**El número de capacidad.** Negarse a llenar un sprint al 100% se siente como dejar valor sobre la mesa. No lo es. El 30% que dejás vacío es lo que absorbe la sorpresa inevitable. Los equipos que sostenidamente corren sprints al 100% son los equipos que sostenidamente fallan sprints.

Creo que ágil funciona. Lo que casi nunca veo es que sobreviva bajo presión. La versión que sobrevive es la versión donde alguien ya decidió cuáles partes son innegociables, y las protege cuando todos los demás están buscando qué recortar.

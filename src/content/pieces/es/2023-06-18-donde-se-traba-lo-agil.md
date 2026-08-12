---
title: 'Dónde se traba el enfoque ágil'
slug: 'donde-se-traba-lo-agil'
lang: es
translationId: agile-stuck-2023-06-18
date: 2023-06-18
written: 'Melbourne, en otoño'
status: published
tags: [agile, scrum, equipo]
lede: 'Los standups se desvían. Las retros son lo primero que se corta. El problema no es que el enfoque ágil falle.'
marginNotes:
  - section: 'la-deriva-del-standup'
    text: 'Si el standup es para tu manager, entonces es una reunión de status.'
  - section: 'lo-que-se-corta-primero'
    text: 'Nunca vi un equipo cancelar el planning. La retro, en cambio, siempre es lo primero que cae.'
  - section: 'errores-que-sigo-cometiendo'
    text: "Scrum es una forma de aplicar el enfoque ágil, no un sinónimo. 'Acá no hacemos agile' suele querer decir 'acá no hacemos Scrum'. Conviene aclarar qué quieren decir."
diagrams:
  - key: 'agile-road-knot'
    place: 'top'
    caption: 'Donde suele empezar, a la izquierda; donde debería llegar, a la derecha. La mayoría se queda en el medio.'
---

En tres de mis últimos cuatro trabajos decíamos que seguíamos el enfoque ágil. En los cuatro, antes de los seis meses el standup diario ya se había convertido en una reunión de status para los managers. El patrón no es que el enfoque ágil no funcione. Es que las partes que exigen paciencia (las retros, un Scrum Master de verdad, no llenar el sprint al 100%) son las primeras que se sacrifican cuando el equipo está bajo presión.

## La deriva del standup

La deriva siempre se parece. Primera semana: tres preguntas, quince minutos, el equipo se destraba solo. Tercer mes: cada uno reporta hacia arriba, el manager escucha y el resto habla solo cuando le toca. Misma reunión, función completamente distinta.

El mecanismo es simple. Aumenta la presión, alguien por encima del equipo necesita visibilidad y el standup es el lugar más cómodo para conseguirla. Cuando la reunión empieza a responder "qué hizo cada uno ayer" en vez de "qué nos está trabando hoy", ya se convirtió en una reunión de status. Lo único que no cambió es el nombre en el calendario.

Si el standup está pensado para tu manager, entonces es una reunión de status. No hay nada malo en esas reuniones, pero no deberían ser diarias ni disfrazarse de ceremonia ágil.

## Qué hace en concreto el Scrum Master

En todos los equipos donde trabajé con un Scrum Master de verdad había una persona dedicada a detectar la deriva antes que nadie. No un developer que además facilitaba las ceremonias. No el manager con dos sombreros. Un rol aparte.

En concreto, esa persona decía: "Noté que los últimos tres standups fueron para reportar hacia arriba, no para destrabarnos. Volvamos a las tres preguntas". O: "Salteamos la retro dos veces seguidas. Si vuelve a pasar la semana que viene, lo voy a señalar como un patrón". O: "El sprint está al 130%. Sacamos tres cosas o acordamos ahora mismo que dos pasan al siguiente".

Estas intervenciones parecen menores. No lo son. El resto del equipo tiene como prioridad que el trabajo avance; el Scrum Master, que el equipo siga trabajando bien. Casi siempre ambas cosas coinciden. Bajo presión, dejan de hacerlo.

Los equipos sin alguien en ese rol no empeoran de inmediato. Se nota al tercer mes, al sexto, en el segundo proyecto. La deriva se acumula.

## Lo que se corta primero

Hay un orden predecible. La retro cae primero: es la única ceremonia sin un resultado inmediato y la que más incomodidad genera. Saltearla una vez no pasa nada; dos veces es un patrón; cuatro veces es cultura.

Después se degrada el planning, aunque de una manera más sutil. La reunión sigue existiendo, pero la pregunta deja de ser "qué podemos hacer en dos semanas" y pasa a ser "qué sigue en el backlog". La capacidad ya no se discute.

Después desaparece el margen. Los sprints se llenan al 100% de la capacidad, luego al 110% y finalmente al 130%, con la promesa de que "nos vamos a poner al día". El equipo intenta hacerlo trabajando hasta tarde, después tomando atajos y, por último, introduciendo los bugs que vuelven todavía peor al sprint siguiente.

Los standups se vuelven reuniones de status, las retros desaparecen, el planning se reduce a despachar el backlog y la capacidad se infla. Eso no prueba que el enfoque ágil falle. Muestra cómo se erosiona bajo presión, una ceremonia a la vez.

## Errores que sigo cometiendo

Algunos patrones en los que caí, o en los que vi caer a equipos de los que formé parte, más de una vez.

**Tratar Scrum y agile como si fueran lo mismo.** Scrum es un framework específico: tres roles, cuatro ceremonias, tres artefactos. Agile es anterior y más amplio: incluye los valores y principios del manifiesto, además de muchas prácticas que pueden usar Scrum o no. "Acá no hacemos agile" suele querer decir "acá no hacemos Scrum". Es una afirmación distinta y exige otra conversación. Conviene aclarar qué quieren decir.

**Usar la velocity como objetivo.** La velocity describe cuánto completó el equipo en el sprint anterior y sirve para planificar el siguiente. En cuanto se convierte en una meta ("el equipo tiene que llegar a 40 puntos") entra en juego la ley de Goodhart: una medida deja de ser útil cuando se vuelve un objetivo. Los puntos se inflan, la planificación pierde valor y el número deja de representar la realidad. La velocity es una medida, no una cuota.

**Tratar el compromiso del sprint como un contrato.** El objetivo del sprint es un pronóstico hecho bajo incertidumbre. Si aparece algo urgente a mitad de camino, corresponde renegociar, no absorber el trabajo nuevo en silencio e incumplir el compromiso original. Los equipos que lo tratan como un contrato terminan mintiendo sobre lo que completaron o trabajando de más para no tener que mentir. Renegociar es la versión menos costosa de esa misma conversación.

**Convertir las ceremonias en teatro.** Cumplir con el planning, el standup, la review y la retro porque el framework lo pide, pero sin tener las conversaciones que deberían sacar a la luz. La prueba es sencilla: ¿la ceremonia cambia algo de lo que el equipo hace después? Si una retro nunca produce un cambio de comportamiento, se volvió teatro. La solución rara vez es sumar ceremonias; suele ser hacer menos y tomarlas en serio.

## Cuándo esto no es la herramienta indicada

Scrum funciona bien para equipos interdisciplinarios y estables, dedicados al desarrollo incremental de un producto y con un product owner claro. Encaja peor en algunos casos:

**Trabajo individual.** Si sos una sola persona, las ceremonias pensadas para un equipo de cinco son puro costo. Usá lo que te sirva (un backlog, quizás una retro semanal con vos mismo) y salteá el resto. Con un equipo de uno, el framework no justifica su peso.

**Investigación o R&D pura.** Scrum supone que el trabajo puede dividirse en bloques que entren en un sprint y produzcan resultados entregables. La investigación no tiene esa forma: un sprint puede terminar con "aprendimos que X no funciona; esto es lo próximo que vamos a probar". Es un buen resultado para investigar y uno difícil de reflejar en un reporte de Scrum. Ayuda cambiar el encuadre: poner límites de tiempo a las preguntas, no a los entregables.

**Contratos con alcance y fecha fijos.** La premisa del enfoque ágil es que el alcance y las prioridades pueden cambiar cuando aparece información nueva. Un contrato que fija ambas cosas no deja nada para negociar. El trabajo todavía puede ser incremental e iterativo, pero llamarlo Scrum no elimina la restricción. Fingir que sí solo hace perder tiempo en el próximo planning.

**Equipos con mucha rotación.** Scrum acumula valor con el paso de los meses: cada retro alimenta la siguiente, el equipo aprende su propia velocity y el mismo Scrum Master detecta las derivas cada vez antes. Un equipo que cambia cada seis semanas no llega a acumular ese aprendizaje. Las ceremonias siguen ocurriendo, pero la memoria institucional que necesitan no sobrevive a la rotación. Es otro problema y requiere otras herramientas.

## Lo que protegería

**La retro, siempre.** Es la única ceremonia cuyo trabajo explícito es mejorar la capacidad del equipo de hacer el próximo sprint. Cortá toda otra ceremonia antes que ésa.

**El rol de Scrum Master**, si podés tenerlo. Si no puede ser una persona dedicada, rotalo semana a semana para que siempre haya alguien responsable de detectar la deriva. No alcanza con decir "es responsabilidad de todos": cada semana tiene que haber un nombre concreto.

**El número de capacidad.** Negarse a llenar un sprint al 100% puede parecer una pérdida de valor. No lo es. El 30% que dejás libre absorbe los imprevistos inevitables. Los equipos que trabajan siempre al 100% son los mismos que incumplen un sprint detrás de otro.

Creo que el enfoque ágil funciona. Lo que rara vez veo es que sobreviva a la presión. La versión que lo logra es aquella donde alguien decidió de antemano qué partes son innegociables y las protege cuando todos los demás buscan qué recortar.

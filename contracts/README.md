# Contratos — Seim Interactive & Byloa

Carpeta autocontenida para emitir contratos manteniendo la estética de los presupuestos.
Cada contrato es un HTML que se abre con doble click. **No requiere `npm`, build ni servidor.**

## Cómo crear un contrato nuevo

```bash
cp _template.html nombre-cliente.html
```

Abrir el archivo con doble click y editar:

- En pantalla: todo el documento es editable (click + escribir).
- En el código: buscar los marcadores entre corchetes (`[CLIENTE]`, `[PROYECTO]`, `[NUMERO]`, `[FECHA]`, `[PLAZO]`, `[FIRMANTE-CLIENTE]`) con `Ctrl+F` y reemplazar.

El **precio total** se escribe una sola vez en el recuadro "Precio total": las tres cuotas (50% inicial, 25% contra entrega, 25% a 30 días) se calculan solas.

Ojo con `[CLIENTE]` y `[NUMERO]`: además del encabezado de la hoja 1, se repiten en la línea superior de la hoja 2.

## Estructura

El contrato está armado en **tres hojas A4**, una por cada `<section class="page">`:

**Hoja 1** — encabezado, partes y alcance
1. **Objeto y funcionalidades** — el listado de lo que se va a entregar.

**Hoja 2** — plazos y condiciones económicas
2. **Revisiones y plazos** — 3 rondas de revisión incluidas + plazo estimado.
3. **Precio y forma de pago** — 50% a la firma, 25% contra entrega, 25% a 30 días.

**Hoja 3** — cierre
4. **Condiciones generales** — materiales, terceros, propiedad, portfolio, confidencialidad y mantenimiento.
5. **Firmas** — Prestador y Cliente.

## Si agregás contenido

El contrato **no está forzado a una cantidad fija de hojas**, y cada hoja usa cerca del 70% de su alto a propósito.

Ese margen no es decorativo: las cláusulas llevan `break-inside: avoid` para no partirse al medio, así que una hoja al límite hace que la cláusula siguiente salte entera y descoloque todo el resto del documento. Si una cláusula crece y no entra, mové cláusulas de una `.page` a otra o agregá una `<section class="page">` más, en lugar de achicar tipografías o interlineados.

## Exportar a PDF

`Ctrl+P` (o el botón flotante inferior derecho) → "Guardar como PDF".
En el diálogo: **Márgenes = "Ninguno"** y destildar **"Encabezados y pies de página"**, para que el fondo negro llegue al borde.

## Archivos

- `_template.html` — plantilla base. **No editar directamente** (es la fuente para duplicar).
- `soulsbeat-picannte.html` — primer contrato emitido (referencia). Agrupa las funcionalidades en una columna por sitio, porque son dos proyectos distintos y en una grilla corrida se intercalaban.
- `assets/MARCA-14.png` — logo de Seim Interactive.
- `assets/logoByloa.png` — logo de Byloa, recortado a su contenido para que pese parejo junto al de Seim.

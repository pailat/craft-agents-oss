# Excalidraw Diagrams

Craft Agent renders `excalidraw` code blocks as interactive Excalidraw drawings.
Diagrams support zoom, pan, and are rendered with the app's current theme.

## Usage

Write Excalidraw scene JSON inside a fenced code block with the `excalidraw` language tag:

```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    {
      "type": "rectangle",
      "x": 100, "y": 100,
      "width": 200, "height": 100,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "roundness": { "type": 3 }
    },
    {
      "type": "text",
      "x": 140, "y": 135,
      "text": "Hello World",
      "fontSize": 20
    }
  ],
  "appState": {
    "viewBackgroundColor": "#ffffff"
  }
}
```

## Scene Structure

The top-level JSON object has these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `type` | No | Always `"excalidraw"` |
| `version` | No | Schema version (currently `2`) |
| `elements` | **Yes** | Array of element objects |
| `appState` | No | Canvas settings (background color, etc.) |
| `files` | No | Embedded binary files (images) |

## Element Types

| Type | Description | Key Properties |
|------|-------------|----------------|
| `rectangle` | Rectangle shape | `width`, `height`, `roundness` |
| `ellipse` | Circle/ellipse | `width`, `height` |
| `diamond` | Diamond/rhombus | `width`, `height` |
| `line` | Freeform line/polyline | `points` array of `[x, y]` |
| `arrow` | Arrow connector | `points`, `startBinding`, `endBinding` |
| `text` | Text label | `text`, `fontSize`, `fontFamily` |
| `freedraw` | Freehand drawing | `points`, `simulatePressure` |
| `image` | Embedded image | `fileId` (references `files` object) |
| `frame` | Grouping frame | `width`, `height` |

## Common Element Properties

Every element supports these properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Element type (see table above) |
| `x` | number | X position |
| `y` | number | Y position |
| `width` | number | Width (shapes only) |
| `height` | number | Height (shapes only) |
| `strokeColor` | string | Border/line color (hex) |
| `backgroundColor` | string | Fill color (hex, or `"transparent"`) |
| `fillStyle` | string | `"solid"`, `"hachure"`, `"cross-hatch"` |
| `strokeWidth` | number | Border thickness (1, 2, 4) |
| `roughness` | number | Hand-drawn effect (0=none, 1=normal, 2=heavy) |
| `opacity` | number | 0-100 |
| `roundness` | object | `{ "type": 3 }` for rounded corners |
| `id` | string | Unique element ID (auto-generated if omitted) |
| `groupIds` | string[] | Group memberships |

## Connecting Elements with Arrows

Use `startBinding` and `endBinding` to connect arrows to shapes:

```json
{
  "type": "arrow",
  "x": 300, "y": 140,
  "points": [[0, 0], [100, 0]],
  "startBinding": {
    "elementId": "rect1",
    "focus": 0,
    "gap": 5
  },
  "endBinding": {
    "elementId": "rect2",
    "focus": 0,
    "gap": 5
  }
}
```

The `elementId` must match the `id` of the target shape. The `focus` controls where on the edge the arrow connects (-1 to 1), and `gap` is the space between arrow and shape.

## Architecture Diagram Example

```excalidraw
{
  "type": "excalidraw",
  "version": 2,
  "elements": [
    {
      "id": "client",
      "type": "rectangle",
      "x": 50, "y": 100,
      "width": 150, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#b2f2bb",
      "fillStyle": "solid",
      "roundness": { "type": 3 }
    },
    {
      "type": "text",
      "x": 85, "y": 125,
      "text": "Client",
      "fontSize": 20,
      "containerId": "client"
    },
    {
      "id": "api",
      "type": "rectangle",
      "x": 300, "y": 100,
      "width": 150, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#a5d8ff",
      "fillStyle": "solid",
      "roundness": { "type": 3 }
    },
    {
      "type": "text",
      "x": 340, "y": 125,
      "text": "API",
      "fontSize": 20,
      "containerId": "api"
    },
    {
      "id": "db",
      "type": "rectangle",
      "x": 550, "y": 100,
      "width": 150, "height": 70,
      "strokeColor": "#1e1e1e",
      "backgroundColor": "#ffec99",
      "fillStyle": "solid",
      "roundness": { "type": 3 }
    },
    {
      "type": "text",
      "x": 600, "y": 125,
      "text": "DB",
      "fontSize": 20,
      "containerId": "db"
    },
    {
      "type": "arrow",
      "x": 200, "y": 135,
      "points": [[0, 0], [100, 0]],
      "startBinding": { "elementId": "client", "focus": 0, "gap": 5 },
      "endBinding": { "elementId": "api", "focus": 0, "gap": 5 }
    },
    {
      "type": "arrow",
      "x": 450, "y": 135,
      "points": [[0, 0], [100, 0]],
      "startBinding": { "elementId": "api", "focus": 0, "gap": 5 },
      "endBinding": { "elementId": "db", "focus": 0, "gap": 5 }
    }
  ]
}
```

## Color Palette

Recommended colors that work well in both light and dark themes:

| Color | Hex | Use |
|-------|-----|-----|
| Light blue | `#a5d8ff` | Primary shapes, services |
| Light green | `#b2f2bb` | Success, entry points |
| Light yellow | `#ffec99` | Data stores, warnings |
| Light red | `#ffc9c9` | Errors, destructive |
| Light purple | `#d0bfff` | Auth, middleware |
| Light gray | `#dee2e6` | Neutral, containers |

## Validation

Use `excalidraw_validate` to check scene JSON before outputting:

```
excalidraw_validate({ code: '{ "elements": [...] }' })
```

Returns `{ valid: true }` or `{ valid: false, error: "..." }`.

## Tips

- Keep element counts reasonable for inline rendering (<50 elements)
- Diagrams are interactive: users can zoom and pan in the viewer
- Theme (dark/light) is applied automatically by Craft Agent
- Click the expand button for a fullscreen view
- Use `viewBackgroundColor` in `appState` to control canvas background (or omit for transparent)
- Use `roundness: { "type": 3 }` for rounded corners on rectangles
- Set `roughness: 0` for clean, non-hand-drawn lines
- For complex diagrams, split into multiple focused excalidraw blocks
- Use meaningful `id` values on shapes you want to connect with arrows

# Browser Panel Guide

The browser panel embeds a real Chromium browser instance in the right sidebar, controllable via three tools: `browser_open`, `browser_snapshot`, and `browser_action`.

## Tools

### `browser_open`

Opens the browser panel and navigates to a URL. The user sees the page rendering in real time.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Full URL to navigate to (must include `https://`) |

Returns the page title once loaded (up to 30s timeout).

### `browser_snapshot`

Captures an accessibility tree of the current page. Returns a YAML-like structure with element refs:

```
- heading "Example Domain" [level=1] [ref=e3]
- link "More information..." [url=https://www.iana.org/help/example-domains] [ref=e6]
- form "Search" [ref=e8]:
    - textbox "Query" [value=""] [ref=e9]
    - button "Submit" [ref=e10]
```

Each `ref` (e.g. `e3`, `e6`) identifies an element for subsequent `browser_action` calls. Refs are reset on each snapshot — always take a fresh snapshot before interacting.

### `browser_action`

Interacts with an element by its ref ID from the most recent snapshot.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | enum | Yes | One of: `click`, `fill`, `select`, `scroll`, `hover` |
| `ref` | string | Yes | Element ref from `browser_snapshot` (e.g. `"e33"`) |
| `value` | string | No | Required for `fill` and `select` actions |

**Actions:**
- **click** — Click the element (buttons, links, checkboxes)
- **fill** — Type text into an input/textarea (clears existing value)
- **select** — Choose an option in a `<select>` dropdown
- **scroll** — Scroll the element into view
- **hover** — Trigger hover state on the element

## Workflow

The standard pattern for browser interaction:

1. **Open** — `browser_open({ url })` — navigates and waits for page load
2. **Snapshot** — `browser_snapshot()` — read the accessibility tree
3. **Act** — `browser_action({ action, ref, value })` — interact with elements
4. **Re-snapshot** — `browser_snapshot()` — see updated state after interaction
5. Repeat steps 3-4 as needed

## Practical Examples

### Read a web page

```
browser_open({ url: "https://example.com" })
browser_snapshot()
// Read the snapshot output to understand page content
```

### Fill and submit a form

```
browser_open({ url: "https://example.com/search" })
browser_snapshot()
// Find the search input ref (e.g. e9) and submit button (e.g. e10)
browser_action({ action: "fill", ref: "e9", value: "search query" })
browser_action({ action: "click", ref: "e10" })
browser_snapshot()
// Read results
```

### Navigate through links

```
browser_open({ url: "https://docs.example.com" })
browser_snapshot()
// Find the link ref (e.g. e15)
browser_action({ action: "click", ref: "e15" })
browser_snapshot()
// Now on the linked page
```

## Tips

- **Always snapshot before acting.** Refs are invalidated after each snapshot and after page navigations triggered by clicks.
- **Re-snapshot after actions that change the page** (clicking links, submitting forms, expanding menus).
- **Use the accessibility tree to orient**, not visual screenshots. The tree shows semantic structure, form values, and interactive elements.
- **`browser_open` and `browser_snapshot` are read-only** and work in Explore mode. `browser_action` requires Ask or Execute mode.
- **The browser session persists** across tool calls within the same session. Cookies, local storage, and login state carry over.
- **Partition isolation** — the browser panel uses a separate partition (`persist:browser-panel`) from the main app, so it won't interfere with app authentication.

## Limitations

- No file download/upload support
- No JavaScript console access
- No network request inspection
- No multi-tab support — one page at a time
- Page load timeout is 30 seconds
- Element refs expire after a new snapshot or page navigation

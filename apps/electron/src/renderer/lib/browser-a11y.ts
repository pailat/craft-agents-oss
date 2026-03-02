/**
 * Accessibility snapshot builder for browser panel webview.
 *
 * Injected into <webview> via executeJavaScript().
 * Produces YAML-like tree compatible with Playwright MCP format:
 *
 *   - heading "Example Domain" [level=1] [ref=e3]
 *   - link "Learn more" [ref=e6]:
 *       - /url: https://iana.org/domains/example
 *
 * Element refs (e1, e2, ...) are stored on window.__browserRefs
 * for subsequent browser_action calls.
 */

export const SNAPSHOT_SCRIPT = `(function() {
  'use strict';

  // Store element references for subsequent actions
  window.__browserRefs = {};
  let refCounter = 0;

  function getRef(el) {
    const ref = 'e' + (++refCounter);
    window.__browserRefs[ref] = el;
    return ref;
  }

  function getRole(el) {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;

    const tag = el.tagName.toLowerCase();
    const roleMap = {
      'a': el.href ? 'link' : null,
      'button': 'button',
      'input': getInputRole(el),
      'select': 'combobox',
      'textarea': 'textbox',
      'h1': 'heading', 'h2': 'heading', 'h3': 'heading',
      'h4': 'heading', 'h5': 'heading', 'h6': 'heading',
      'img': 'img',
      'nav': 'navigation',
      'main': 'main',
      'header': 'banner',
      'footer': 'contentinfo',
      'form': 'form',
      'table': 'table',
      'ul': 'list', 'ol': 'list',
      'li': 'listitem',
    };
    return roleMap[tag] || null;
  }

  function getInputRole(el) {
    const type = (el.type || 'text').toLowerCase();
    const map = {
      'checkbox': 'checkbox', 'radio': 'radio',
      'range': 'slider', 'button': 'button',
      'submit': 'button', 'reset': 'button',
      'search': 'searchbox',
    };
    return map[type] || 'textbox';
  }

  function getAccessibleName(el) {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;

    const labelledBy = el.getAttribute('aria-labelledby');
    if (labelledBy) {
      const label = document.getElementById(labelledBy);
      if (label) return label.textContent.trim();
    }

    if (el.tagName === 'IMG') return el.alt || '';
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
      if (el.id) {
        const label = document.querySelector('label[for="' + el.id + '"]');
        if (label) return label.textContent.trim();
      }
      return el.placeholder || '';
    }

    // For buttons and links, use text content
    if (['A', 'BUTTON'].includes(el.tagName) || el.getAttribute('role') === 'button') {
      return el.textContent.trim().substring(0, 80);
    }

    return '';
  }

  function isVisible(el) {
    if (!el.offsetParent && el.tagName !== 'BODY' && el.tagName !== 'HTML') return false;
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }

  function buildTree(el, depth) {
    if (!el || el.nodeType !== 1) return '';
    if (!isVisible(el)) return '';

    const role = getRole(el);
    const name = getAccessibleName(el);
    const indent = '  '.repeat(depth);
    let lines = [];

    if (role) {
      const ref = getRef(el);
      let line = indent + '- ' + role;
      if (name) line += ' "' + name.replace(/"/g, '\\\\"') + '"';

      // Add attributes
      const attrs = [];
      if (role === 'heading') {
        const level = el.tagName.match(/H(\\d)/);
        if (level) attrs.push('level=' + level[1]);
      }
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.value) attrs.push('value="' + el.value.substring(0, 50) + '"');
        if (el.disabled) attrs.push('disabled');
        if (el.required) attrs.push('required');
      }
      if (el.tagName === 'A' && el.href) {
        attrs.push('url=' + el.href);
      }
      if (el.getAttribute('aria-expanded')) {
        attrs.push('expanded=' + el.getAttribute('aria-expanded'));
      }
      if (el.getAttribute('aria-checked')) {
        attrs.push('checked=' + el.getAttribute('aria-checked'));
      }
      attrs.push('ref=' + ref);

      line += ' [' + attrs.join('] [') + ']';
      lines.push(line);

      // Recurse into children for container roles
      for (const child of el.children) {
        const childTree = buildTree(child, depth + 1);
        if (childTree) lines.push(childTree);
      }
    } else {
      // Not a semantic element — recurse into children at same depth
      for (const child of el.children) {
        const childTree = buildTree(child, depth);
        if (childTree) lines.push(childTree);
      }
    }

    return lines.join('\\n');
  }

  refCounter = 0;
  const tree = buildTree(document.body, 0);
  return tree || '(empty page)';
})()`;

/**
 * Build a JavaScript string to inject into the webview for performing actions.
 * Uses the __browserRefs map populated by the snapshot script.
 */
export function buildActionScript(action: string, ref: string, value?: string): string {
  const safeValue = value ? JSON.stringify(value) : 'undefined';
  return `(function() {
    'use strict';
    const refs = window.__browserRefs || {};
    const el = refs[${JSON.stringify(ref)}];
    if (!el) return 'Error: Element ref "${ref}" not found. Take a new snapshot first.';

    const action = ${JSON.stringify(action)};
    const value = ${safeValue};

    try {
      switch (action) {
        case 'click':
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          el.click();
          return 'Clicked ' + (el.textContent || '').trim().substring(0, 50);

        case 'fill':
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          el.focus();
          el.value = value || '';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
          return 'Filled with: ' + (value || '').substring(0, 50);

        case 'select':
          if (el.tagName === 'SELECT') {
            el.value = value || '';
            el.dispatchEvent(new Event('change', { bubbles: true }));
            return 'Selected: ' + value;
          }
          el.click();
          return 'Clicked select element';

        case 'scroll':
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          return 'Scrolled to element';

        case 'hover':
          el.scrollIntoView({ block: 'center', behavior: 'instant' });
          el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
          el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
          return 'Hovered over element';

        default:
          return 'Unknown action: ' + action;
      }
    } catch (err) {
      return 'Action failed: ' + (err.message || err);
    }
  })()`;
}

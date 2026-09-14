/* Tiny hyperscript for HTML and SVG. Every slide builds its DOM with these
   two functions, so slide modules stay short and readable. */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function appendChild(node, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) {
      child.forEach(function (one) { appendChild(node, one); });
      return;
    }
    if (child instanceof Node) {
      node.appendChild(child);
      return;
    }
    node.appendChild(document.createTextNode(String(child)));
  }

  function applyAttrs(node, attrs, isSvg) {
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'style' && typeof value === 'object') {
        Object.keys(value).forEach(function (prop) { node.style[prop] = value[prop]; });
        return;
      }
      if (key === 'html') { node.innerHTML = value; return; }
      if (key === 'text') { node.textContent = String(value); return; }
      if (key === 'dataset') {
        Object.keys(value).forEach(function (prop) { node.dataset[prop] = value[prop]; });
        return;
      }
      if (key.slice(0, 2) === 'on' && typeof value === 'function') {
        node.addEventListener(key.slice(2).toLowerCase(), value);
        return;
      }
      if (!isSvg && key in node && key !== 'list' && key !== 'form') {
        try { node[key] = value; return; } catch (err) { /* fall through to setAttribute */ }
      }
      node.setAttribute(key, value === true ? '' : String(value));
    });
  }

  /* h('div.cols', {…}, children) — the selector supports one tag plus
     any number of .class tokens, which covers everything this deck needs. */
  function parseSelector(selector) {
    var parts = String(selector).split('.');
    return { tag: parts[0] || 'div', classes: parts.slice(1) };
  }

  function h(selector, attrs, children) {
    var parsed = parseSelector(selector);
    var node = document.createElement(parsed.tag);
    if (parsed.classes.length) node.className = parsed.classes.join(' ');
    if (attrs && (attrs instanceof Node || Array.isArray(attrs) || typeof attrs !== 'object')) {
      appendChild(node, attrs);
      return node;
    }
    applyAttrs(node, attrs, false);
    appendChild(node, children);
    return node;
  }

  function s(selector, attrs, children) {
    var parsed = parseSelector(selector);
    var node = document.createElementNS(SVG_NS, parsed.tag);
    if (parsed.classes.length) node.setAttribute('class', parsed.classes.join(' '));
    if (attrs && (attrs instanceof Node || Array.isArray(attrs) || typeof attrs !== 'object')) {
      appendChild(node, attrs);
      return node;
    }
    applyAttrs(node, attrs, true);
    appendChild(node, children);
    return node;
  }

  function clear(node) {
    while (node && node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function setHtml(node, html) {
    if (node) node.innerHTML = html;
    return node;
  }

  global.D = global.D || {};
  global.D.dom = { h: h, s: s, clear: clear, setHtml: setHtml, SVG_NS: SVG_NS };
})(window);

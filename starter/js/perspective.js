/* Orthographic world-to-screen geometry. Angles are degrees; depth does not
   change scale. Geometry, camera and opacity updates are validated before paint. */
(function () {
  'use strict';
  const DEFAULT_CAMERA = { cx: 0, cy: 0, scale: 1, yaw: 0, pitch: 0 };
  const finite = (value, name) => { if (typeof value !== 'number' || !Number.isFinite(value)) throw new TypeError(name + ' must be finite'); return value; };
  const positive = (value, name) => { finite(value, name); if (value <= 0) throw new RangeError(name + ' must be positive'); return value; };
  const object = (value, name) => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError(name + ' must be an object'); return value; };
  const text = (value, name) => { if (typeof value !== 'string') throw new TypeError(name + ' must be a string'); return value; };
  const optional = (value, fallback) => value === undefined ? fallback : value;
  function opacity(value) { finite(value, 'opacity'); if (value < 0 || value > 1) throw new RangeError('opacity must be in [0,1]'); return value; }
  function xyz(value, name) {
    if (!Array.isArray(value) || value.length !== 3) throw new TypeError(name + ' must contain exactly three coordinates');
    return Object.freeze(Array.from(value, (v, i) => finite(v, name + '[' + i + ']')));
  }
  function camera(value = {}, base = DEFAULT_CAMERA) {
    object(value, 'camera');
    if (Object.keys(value).some(key => !Object.hasOwn(DEFAULT_CAMERA, key))) throw new TypeError('Unknown camera field');
    const next = Object.assign({}, base, value);
    Object.keys(DEFAULT_CAMERA).forEach(key => finite(next[key], 'camera.' + key)); positive(next.scale, 'camera.scale');
    return Object.freeze(next);
  }
  function projector(view) {
    // Reduce degrees first so even a very large finite angle avoids overflow.
    const yaw = (view.yaw % 360) * Math.PI / 180, pitch = (view.pitch % 360) * Math.PI / 180;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    return point => {
      const u = finite(cy * point[0] - sy * point[1], 'rotated x');
      const v = finite(sy * point[0] + cy * point[1], 'rotated y');
      const up = finite(cp * v - sp * point[2], 'rotated up');
      const depth = finite(sp * v + cp * point[2], 'depth');
      return { x: finite(view.cx + view.scale * u, 'projected x'), y: finite(view.cy - view.scale * up, 'projected y'), depth };
    };
  }
  function project3D(point, view) { return projector(camera(view))(xyz(point, 'point')); }

  function spatialScene(parent, options = {}) {
    object(options, 'spatialScene options');
    const ids = new Map();
    function common(item, kind, index) {
      object(item, kind + '[' + index + ']');
      const id = text(item.id, 'ID'); if (!id.trim()) throw new TypeError('ID must not be empty');
      if (ids.has(id)) throw new RangeError('Spatial IDs must be globally unique: ' + id);
      ids.set(id, { kind, index });
      const color = text(optional(item.color, C.white), 'color'); if (!color.trim()) throw new TypeError('color must not be empty');
      return { id, color, opacity: opacity(optional(item.opacity, 1)) };
    }
    function records(kind, normalize) {
      const items = optional(options[kind], []); if (!Array.isArray(items)) throw new TypeError(kind + ' must be an array');
      return Object.freeze(Array.from(items, (item, i) => Object.freeze(Object.assign(common(item, kind, i), normalize(item)))));
    }
    let model = {
      camera: camera(options.camera),
      points: records('points', item => ({ xyz: xyz(item.xyz, 'point.xyz'), r: positive(optional(item.r, 6), 'point.r') })),
      segments: records('segments', item => {
        const arrow = optional(item.arrow, false); if (typeof arrow !== 'boolean') throw new TypeError('segment.arrow must be boolean');
        return { from: xyz(item.from, 'segment.from'), to: xyz(item.to, 'segment.to'), width: positive(optional(item.width, 2), 'segment.width'), dash: text(optional(item.dash, ''), 'segment.dash'), arrow };
      }),
      polygons: records('polygons', item => {
        if (!Array.isArray(item.vertices) || item.vertices.length < 3) throw new TypeError('A polygon needs at least three vertices');
        return { vertices: Object.freeze(Array.from(item.vertices, (p, i) => xyz(p, 'polygon.vertices[' + i + ']'))) };
      }),
      labels: records('labels', item => {
        const anchor = optional(item.anchor, 'middle'); if (!['start', 'middle', 'end'].includes(anchor)) throw new TypeError('label.anchor must be start, middle or end');
        return { xyz: xyz(item.xyz, 'label.xyz'), text: text(item.text, 'label.text'), size: positive(optional(item.size, 22), 'label.size'), dx: finite(optional(item.dx, 0), 'label.dx'), dy: finite(optional(item.dy, 0), 'label.dy'), anchor };
      })
    };
    function prepare(next) {
      const project = projector(next.camera);
      return {
        points: next.points.map(item => project(item.xyz)),
        segments: next.segments.map(item => ({ from: project(item.from), to: project(item.to) })),
        polygons: next.polygons.map(item => item.vertices.map(project)),
        labels: next.labels.map(item => { const p = project(item.xyz); return { x: finite(p.x + item.dx, 'label x'), y: finite(p.y + item.dy, 'label y'), depth: p.depth }; })
      };
    }
    const initial = prepare(model); // Validate all projections before adding SVG.
    const g = F.group(parent); g.dataset.component = 'spatial-scene';
    const layers = {}, points = new Map(), segments = new Map(), polygons = new Map(), labels = new Map();
    ['polygons', 'segments', 'points', 'labels'].forEach(kind => { layers[kind] = F.group(g); layers[kind].dataset.spatialLayer = kind; });
    const identify = (node, item) => { node.dataset.spatialId = item.id; return node; };
    model.polygons.forEach(item => { const node = D.dom.s('polygon', { fill: item.color }); layers.polygons.append(node); polygons.set(item.id, identify(node, item)); });
    model.segments.forEach(item => {
      const node = item.arrow ? F.arrow(layers.segments, item.color, item.width) : F.line(layers.segments, 0, 0, 0, 0, item.color, item.width, item.dash);
      if (item.arrow) node.shaft.setAttribute('stroke-dasharray', item.dash);
      identify(item.arrow ? node.g : node, item); segments.set(item.id, node);
    });
    model.points.forEach(item => points.set(item.id, identify(F.dot(layers.points, 0, 0, item.r, item.color), item)));
    model.labels.forEach(item => labels.set(item.id, identify(F.label(layers.labels, 0, 0, item.text, item.size, item.color, item.anchor), item)));
    function paint(next, projected) {
      next.polygons.forEach((item, i) => { const node = polygons.get(item.id); node.setAttribute('points', projected.polygons[i].map(p => p.x + ',' + p.y).join(' ')); F.opacity(node, item.opacity); });
      next.segments.forEach((item, i) => {
        const node = segments.get(item.id), p = projected.segments[i];
        if (item.arrow) node.set(p.from.x, p.from.y, p.to.x, p.to.y); else F.seg(node, p.from.x, p.from.y, p.to.x, p.to.y);
        F.opacity(item.arrow ? node.g : node, item.opacity);
      });
      next.points.forEach((item, i) => { const node = points.get(item.id), p = projected.points[i]; F.pos(node, p.x, p.y); node.dataset.depth = String(p.depth); F.opacity(node, item.opacity); });
      // Positive depth is toward the viewer. Reorder the existing circles only;
      // equal-depth ties use original input order, not the previous draw order.
      next.points.map((item, i) => ({ id: item.id, depth: projected.points[i].depth, index: i })).sort((a, b) => a.depth - b.depth || a.index - b.index).forEach(item => layers.points.append(points.get(item.id)));
      next.labels.forEach((item, i) => { const node = labels.get(item.id), p = projected.labels[i]; node.setAttribute('x', p.x); node.setAttribute('y', p.y); F.opacity(node, item.opacity); });
    }
    function commit(next) { const projected = prepare(next); paint(next, projected); model = next; return api; }
    function locate(id, kind) {
      const location = ids.get(id);
      if (!location || (kind && location.kind !== kind)) throw new RangeError('Unknown ' + (kind || 'spatial') + ' ID: ' + id);
      return location;
    }
    function update(id, patch, kind) {
      const location = locate(id, kind), list = model[location.kind].slice();
      list[location.index] = Object.freeze(Object.assign({}, list[location.index], patch));
      return commit(Object.assign({}, model, { [location.kind]: Object.freeze(list) }));
    }
    function snapshot() {
      return { camera: { ...model.camera },
        points: model.points.map(item => ({ ...item, xyz: [...item.xyz] })),
        segments: model.segments.map(item => ({ ...item, from: [...item.from], to: [...item.to] })),
        polygons: model.polygons.map(item => ({ ...item, vertices: item.vertices.map(p => [...p]) })),
        labels: model.labels.map(item => ({ ...item, xyz: [...item.xyz] })) };
    }
    const api = { g, points, segments, polygons, labels, snapshot,
      setCamera(patch) { return commit(Object.assign({}, model, { camera: camera(patch, model.camera) })); },
      setPoint(id, value) { return update(id, { xyz: xyz(value, 'point.xyz') }, 'points'); },
      setSegment(id, from, to) { return update(id, { from: xyz(from, 'segment.from'), to: xyz(to, 'segment.to') }, 'segments'); },
      setOpacity(id, value) { return update(id, { opacity: opacity(value) }); },
      render() { return commit(model); }
    };
    paint(model, initial); return api;
  }
  K.project3D = project3D; K.spatialScene = spatialScene;
})();

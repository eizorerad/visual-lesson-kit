/* Assignment mechanics: complete disjoint sets of the same observations. */
(function () {
  'use strict';
  const finite = (v, name) => { if (!Number.isFinite(v)) throw new TypeError(name + ' must be finite'); return v; };
  function partitionActors(parent, options) {
    const o = Object.assign({ radius: 11, labelSize: 18, labelOffset: 29 }, options);
    if (!Array.isArray(o.items) || !o.items.length || Array.from(o.items).some(item => !item || typeof item.id !== 'string' || !item.id.length)) throw new TypeError('Nonempty items with string IDs required');
    if (new Set(o.items.map(item => item.id)).size !== o.items.length) throw new RangeError('Observation IDs must be unique');
    const items = Object.freeze(o.items.map(item => Object.freeze({ ...item, label: String(item.label ?? item.id) })));
    const byId = new Map(items.map((item, i) => [item.id, i]));
    if (!o.groups || typeof o.groups !== 'object' || !Object.keys(o.groups).length) throw new TypeError('Named placement groups required');
    const groups = Object.create(null);
    Object.entries(o.groups).forEach(([name, lane]) => {
      if (!lane || !Number.isInteger(lane.columns) || lane.columns < 1) throw new RangeError('Group columns must be a positive integer');
      ['x', 'y', 'dx', 'dy'].forEach(key => finite(lane[key], name + '.' + key));
      if (lane.dx <= 0 || lane.dy <= 0) throw new RangeError('Group spacing must be positive');
      const color = lane.color || C.white;
      if (!P.isColor(color)) throw new TypeError('Group colors must be six-digit hex or C roles');
      groups[name] = Object.freeze({ ...lane, color });
    });
    if (!Object.hasOwn(groups, o.initialGroup)) throw new RangeError('initialGroup must name a placement group');
    ['radius', 'labelSize', 'labelOffset'].forEach(key => finite(o[key], key));
    if (o.radius <= 0 || o.labelSize <= 0) throw new RangeError('Positive actor and label dimensions required');
    const initial = { [o.initialGroup]: items.map(item => item.id) };
    function normalize(partition) {
      if (!partition || typeof partition !== 'object' || Array.isArray(partition)) throw new TypeError('Partition must map group names to ID arrays');
      const assignments = Object.create(null), counts = Object.fromEntries(Object.keys(groups).map(name => [name, 0]));
      Object.entries(partition).forEach(([name, ids]) => {
        if (!Object.hasOwn(groups, name)) throw new RangeError('Unknown placement group: ' + name);
        if (!Array.isArray(ids)) throw new TypeError('Group membership must be an ID array');
        Array.from(ids).forEach(id => {
          if (!byId.has(id)) throw new RangeError('Unknown observation: ' + id);
          if (Object.hasOwn(assignments, id)) throw new RangeError('Observation assigned more than once: ' + id);
          assignments[id] = name; counts[name]++;
        });
      });
      if (Object.keys(assignments).length !== items.length) throw new RangeError('Every observation must receive exactly one role');
      const slots = Object.fromEntries(Object.keys(groups).map(name => [name, 0])), positions = Object.create(null);
      // Input item order determines placement; ordering IDs in a set differently
      // cannot reshuffle the observations by accident.
      items.forEach(item => { const name = assignments[item.id], lane = groups[name], slot = slots[name]++; positions[item.id] = { x: lane.x + (slot % lane.columns) * lane.dx, y: lane.y + Math.floor(slot / lane.columns) * lane.dy }; });
      return { assignments, counts, positions };
    }
    const g = F.group(parent); g.dataset.component = 'partition';
    const actors = items.map(item => {
      const actor = F.group(g); actor.dataset.observationId = item.id;
      const dot = F.dot(actor, 0, 0, o.radius, groups[o.initialGroup].color);
      const label = F.label(actor, 0, o.labelOffset, item.label, o.labelSize, C.white);
      return { g: actor, dot, label, item };
    });
    const api = { g, actors, items, counts: null, assignments: null, position: id => {
      if (!byId.has(id)) throw new RangeError('Unknown observation: ' + id);
      return { ...positions[id] };
    }, setPartition };
    let positions = Object.create(null);
    function setPartition(partition, progress = 1, transition = {}) {
      const t = Math.max(0, Math.min(1, finite(progress, 'progress'))), from = normalize(transition.from || initial), to = normalize(partition);
      const nextPositions = Object.create(null);
      actors.forEach(actor => {
        const id = actor.item.id, a = from.positions[id], b = to.positions[id];
        const point = { x: F.lerp(a.x, b.x, t), y: F.lerp(a.y, b.y, t) }; nextPositions[id] = point;
        F.at(actor.g, point.x, point.y); actor.g.dataset.role = to.assignments[id]; actor.g.dataset.fromRole = from.assignments[id];
        actor.dot.setAttribute('fill', P.mixHex(groups[from.assignments[id]].color, groups[to.assignments[id]].color, t));
      });
      positions = nextPositions; api.counts = Object.freeze(to.counts); api.assignments = Object.freeze(to.assignments);
      g.dataset.total = String(items.length);
    }
    setPartition(initial);
    return api;
  }
  K.partitionActors = partitionActors;
})();

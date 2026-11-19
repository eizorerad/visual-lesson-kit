#!/usr/bin/env python3
"""Rebuild the Q-Align teaching dataset from a local, unmodified checkout.

Only imports and function definitions from the source notebook are executed.
The example, survey, figures and other top-level notebook code are not run.
Numerical trajectories use the source's RNG and Metropolis rule exactly.
"""
import argparse
import ast
import hashlib
import heapq
import itertools
import json
import math
from pathlib import Path


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--repository', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path(__file__).resolve().parents[1] / 'js/q-align-data.js')
    parser.add_argument('--survey', type=Path, help='Verified 225-instance JSON; optional for regenerating the toy example')
    args = parser.parse_args()
    import networkx as nx
    import numpy as np

    repo = args.repository.resolve()
    notebook_path = repo / 'Q_Align_Phase1_Landscape_Methods.ipynb'
    notebook = json.loads(notebook_path.read_text())
    scope = {}
    tree = ast.parse(''.join(notebook['cells'][2]['source']))
    tree.body = [node for node in tree.body if isinstance(node, (ast.Import, ast.ImportFrom, ast.FunctionDef))]
    exec(compile(tree, str(notebook_path) + ':cell2', 'exec'), scope)
    a, b, truth, g1, g2 = scope['make_graph_pair']('erdos_renyi', 6, 0.1, seed=105)
    q, n, _ = scope['build_qubo_matrix'](a, b)
    raw = list(itertools.permutations(range(n)))
    energies = [int(scope['alignment_energy'](q, perm, n, n)) for perm in raw]
    index = {perm: i for i, perm in enumerate(raw)}
    results = [{'perm': perm, 'energy': energies[i]} for i, perm in enumerate(raw)]
    results.sort(key=lambda row: row['energy'])
    minima, basins = scope['find_local_minima'](results, n)
    minimum_ids = [index[row['perm']] for row in minima]
    optimum = min(energies)
    global_ids = [i for i, e in enumerate(energies) if e == optimum]
    basin_ids = [index[basins[perm]] for perm in raw]
    adjacency = [[index[p] for p in scope['swap_neighbors'](perm, n)] for perm in raw]

    # Find an actual positive escape barrier from a nonglobal local minimum.
    def barrier_path(source):
        best = {source: energies[source]}
        previous = {}
        queue = [(energies[source], 0, source)]
        steps = {source: 0}
        while queue:
            cost, length, current = heapq.heappop(queue)
            if (cost, length) != (best.get(current), steps.get(current)):
                continue
            if current in global_ids:
                path = [current]
                while path[-1] != source:
                    path.append(previous[path[-1]])
                return list(reversed(path)), cost - energies[source]
            for target in adjacency[current]:
                new = (max(cost, energies[target]), length + 1)
                if new < (best.get(target, math.inf), steps.get(target, math.inf)):
                    best[target], steps[target] = new
                    previous[target] = current
                    heapq.heappush(queue, (*new, target))
        raise AssertionError('Permutation graph must be connected')

    paths = [(source, *barrier_path(source)) for source in minimum_ids if source not in global_ids]
    source, escape, barrier = next(item for item in paths if item[2] > 0 and 3 <= len(item[1]) <= 8)

    # Exact same RNG stream and short-circuit acceptance as source SA.
    rng = np.random.RandomState(105)
    runs = []
    for run in range(50):
        perm = list(rng.permutation(n))
        energy = int(scope['alignment_energy'](q, perm, n, n))
        best = energy
        history = [{'id': index[tuple(perm)], 'energy': energy, 'best': best, 'temperature': 5.0}]
        for step in range(150):
            temperature = 5.0 * (0.01 / 5.0) ** (step / 150)
            ia, ib = rng.choice(n, 2, replace=False)
            candidate = list(perm)
            candidate[ia], candidate[ib] = candidate[ib], candidate[ia]
            candidate_energy = int(scope['alignment_energy'](q, candidate, n, n))
            delta = candidate_energy - energy
            accepted = bool(delta < 0 or rng.random() < np.exp(-delta / max(temperature, 1e-10)))
            if accepted:
                perm, energy = candidate, candidate_energy
            best = min(best, energy)
            history.append({'id': index[tuple(perm)], 'energy': energy, 'best': best,
                            'temperature': float(temperature), 'candidate': candidate_energy,
                            'delta': delta, 'accepted': accepted})
        runs.append({'number': run + 1, 'hit': best == optimum, 'history': history})
    hits = sum(run['hit'] for run in runs)
    assert [run['history'][-1]['best'] for run in runs] == scope['simulated_annealing'](a, b, q, seed=105)
    assert hits == 21
    success = next(run for run in runs if run['hit'])
    failure = next(run for run in runs if not run['hit'])

    # For the motif explanation use connected induced graphlets, with the
    # classification stated explicitly. The notebook's disconnected-triad bug
    # is recorded in the notes and is not silently reproduced as correct science.
    motifs = {
        'P3': [(0, 1), (1, 2)], 'K3': [(0, 1), (1, 2), (0, 2)],
        'P4': [(0, 1), (1, 2), (2, 3)], 'S3': [(0, 1), (0, 2), (0, 3)],
        'C4': [(0, 1), (1, 2), (2, 3), (3, 0)],
        'tail_tri': [(0, 1), (1, 2), (0, 2), (2, 3)],
        'chordal_C4': [(0, 1), (1, 2), (2, 3), (3, 0), (0, 2)],
        'K4': list(itertools.combinations(range(4), 2)),
    }
    counts = dict.fromkeys(motifs, 0)
    occurrences = {name: [] for name in motifs}
    motif_graphs = {name: nx.Graph(edges) for name, edges in motifs.items()}
    for size in (3, 4):
        for nodes in itertools.combinations(range(n), size):
            sub = g1.subgraph(nodes)
            if not nx.is_connected(sub):
                continue
            matches = [name for name, motif in motif_graphs.items() if len(motif) == size and nx.is_isomorphic(sub, motif)]
            assert len(matches) == 1
            counts[matches[0]] += 1
            occurrences[matches[0]].append(list(nodes))
    total = sum(counts.values())
    entropy = -sum((c / total) * math.log2(c / total) for c in counts.values() if c)

    survey_path = args.survey or repo / 'outputs/tutorial_survey_verification.json'
    if survey_path.is_file():
        verified = json.loads(survey_path.read_text())
        survey = verified['report']
        survey_hash = hashlib.sha256(survey_path.read_bytes()).hexdigest()
    else:
        # The checked-in copy contains full provenance and 225 verified records.
        existing = args.output.read_text()
        saved = json.loads(existing.split(' = ', 1)[1].rsplit(';', 1)[0])
        survey = saved['survey']
        survey_hash = saved['provenance']['surveySha256']

    changed = [[i, j] for i in range(n) for j in range(i + 1, n) if a[i, j] != b[truth[i], truth[j]]]
    # Phase 1 diagnostics: execute definitions, never the notebook's survey.
    for cell in (6, 11):
        definitions = ast.parse(''.join(notebook['cells'][cell]['source']))
        definitions.body = [node for node in definitions.body if isinstance(node, ast.FunctionDef)]
        exec(compile(definitions, str(notebook_path) + f':cell{cell}', 'exec'), scope)
    reference = raw[global_ids[0]]
    fdc, _, _ = scope['compute_fdc'](results, reference)
    distances = [scope['kendall_tau'](perm, reference) for perm in raw]
    nearest_distances = [min(scope['kendall_tau'](perm, raw[i]) for i in global_ids) for perm in raw]
    nearest_fdc = float(np.corrcoef(energies, nearest_distances)[0, 1])
    rho, corr_length, walk = scope['random_walk_autocorrelation'](a, b, q, n_steps=800, seed=105)
    short_runs = scope['simulated_annealing'](a, b, q, n_steps=40, seed=105)
    source_rows = verified['survey'] if survey_path.is_file() else saved.get('details', {}).get('surveyRows', [])
    assert len(source_rows) == 225, 'The detailed view requires the verified Tutorial survey'
    details = {
        'fdc': {'referenceId': global_ids[0], 'kendallDistances': distances, 'value': float(fdc),
                'nearestDistances': nearest_distances, 'nearestValue': nearest_fdc,
                'convention': 'Kendall inversions: adjacent transpositions, not arbitrary-swap distance'},
        'walk': {'steps': 800, 'seed': 105, 'energies': walk.astype(int).tolist(),
                 'rho': rho, 'correlationLength': corr_length,
                 'convention': 'always move; lag-1 centered covariance / full-series variance'},
        'budgets': [{'steps': 40, 'runs': 50, 'hits': int(sum(e == optimum for e in short_runs))},
                    {'steps': 150, 'runs': 50, 'hits': hits}],
        'basins': [{'id': i, 'size': basin_ids.count(i)} for i in global_ids],
        'energyHistogram': [{'energy': e, 'count': energies.count(e)} for e in sorted(set(energies))],
        'surveyRows': source_rows,
        'tutorialSha256': hashlib.sha256((repo / 'Q_Align_Tutorial.ipynb').read_bytes()).hexdigest(),
    }
    data = {
        'provenance': {'repository': 'https://github.com/eizorerad/Q-Align',
                       'commit': '70d8c57965644ced890e886ed93a81e53c291c5e',
                       'notebook': notebook_path.name, 'notebookSha256': hashlib.sha256(notebook_path.read_bytes()).hexdigest(),
                       'model': 'erdos_renyi', 'n': n, 'noise': 0.1, 'seed': 105,
                       'surveySha256': survey_hash, 'surveyInstances': 225,
                       'graphletConvention': 'connected induced motifs; corrected for this teaching view',
                       'barrierConvention': 'minimum maximum energy along swap paths, minus source energy'},
        'adj1': a.tolist(), 'adj2': b.tolist(), 'truth': [int(v) for v in truth],
        'permutations': [list(perm) for perm in raw], 'energies': energies,
        'neighbors': adjacency, 'localMinima': minimum_ids, 'globalOptima': global_ids, 'basinIds': basin_ids,
        'optimum': optimum, 'edges1': g1.number_of_edges(), 'edges2': g2.number_of_edges(),
        'changedEdges': changed, 'noiseFreeAdj2': a[np.ix_(np.argsort(truth), np.argsort(truth))].tolist(),
        'barrier': {'source': source, 'path': escape, 'height': barrier,
                    'energies': [energies[i] for i in escape]},
        'runs': [failure, success], 'sa': {'runs': 50, 'steps': 150, 'hits': hits, 'hitRate': hits / 50,
                                         'initialTemperature': 5.0, 'finalTemperature': 0.01, 'seed': 105},
        'graphlets': {'counts': counts, 'occurrences': occurrences, 'entropy': entropy,
                     'sourceFunctionEntropy': scope['count_graphlets'](g1)},
        'survey': survey,
        'details': details,
        'penaltyCounterexample': {'n': 4, 'validEnergy': -20, 'invalidEnergy': -24,
                                 'invalidAssignment': [[int(j in (i, (i + 1) % 4)) for j in range(4)] for i in range(4)]},
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text('/* Source-backed Q-Align numerical data; see provenance. */\nwindow.QAlignData = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
    print(json.dumps({'output': str(args.output), 'permutations': len(raw), 'minima': len(minima),
                      'optima': len(global_ids), 'SA': f'{hits}/50', 'barrierPath': escape,
                      'barrierHeight': barrier, 'graphletEntropy': entropy}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()

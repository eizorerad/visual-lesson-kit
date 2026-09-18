#!/usr/bin/env python3
"""Generate the real 13-nt ViennaRNA example; require ViennaRNA==2.7.2.

Run with an isolated Python environment containing the official ViennaRNA wheel.
The JSON fixture and offline JavaScript payload are generated together.
Use --embed-only to refresh JavaScript from the fixture without ViennaRNA.
No network access is made by this generator. All residue indices in JSON are 1-based.
The exhaustive enumerator is independent of ViennaRNA's MFE/PF recursions; energies
and loop contributions are evaluated by the ViennaRNA nearest-neighbor model.
"""

from __future__ import annotations

import argparse
from functools import lru_cache
import json
import math
from pathlib import Path


SEQUENCE = "GGACGAAACGUCC"
VERSION = "2.7.2"
ALLOWED_PAIRS = frozenset({"AU", "UA", "GC", "CG", "GU", "UG"})
ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets/rna-prediction/thermo-example.json"
SCRIPT_OUTPUT = ROOT / "js/recipes/rna-prediction/prediction-experiment.js"
SETTINGS = {
    "temperature": 37.0,
    "salt": 1.021,
    "dangles": 2,
    "min_loop_size": 3,
    "noLP": 0,
    "noGU": 0,
    "noGUclosure": 0,
    "special_hp": 1,
    "circ": 0,
    "gquad": 0,
    "logML": 0,
    "max_bp_span": -1,
    "betaScale": 1.0,
    "pf_smooth": 1,
    "compute_bpp": 1,
}
SOURCES = [
    {
        "title": "ViennaRNA 2.7.2 RNAfold manual: settings and model scope",
        "url": "https://www.tbi.univie.ac.at/RNA/RNAfold",
    },
    {
        "title": "ViennaRNA Python API: Turner 2004 parameter loading",
        "url": "https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/api_python.html",
    },
    {
        "title": "ViennaRNA energy evaluation for individual loops",
        "url": "https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/eval/eval_loops.html",
    },
    {
        "title": "ViennaRNA partition function and equilibrium properties",
        "url": "https://www.tbi.univie.ac.at/RNA/ViennaRNA/doc/html/pf_fold.html",
    },
    {
        "title": "NNDB Turner 2004 hairpin loop rules",
        "url": "https://rna.urmc.rochester.edu/NNDB/rna_2004/rna_2004_hairpin_loops.html",
    },
]


@lru_cache(maxsize=None)
def enumerate_structures(left: int, right: int) -> tuple[str, ...]:
    """Enumerate each legal noncrossing structure once, using zero-based bounds.

    The leftmost residue is either unpaired or paired to exactly one partner.
    A pair splits the interval into its interior and the remaining suffix.
    Pair span >= 4 imposes the usual minimum hairpin size of three residues.
    """
    if left > right:
        return ("",)
    results = ["." + suffix for suffix in enumerate_structures(left + 1, right)]
    for partner in range(left + 4, right + 1):
        if SEQUENCE[left] + SEQUENCE[partner] not in ALLOWED_PAIRS:
            continue
        for interior in enumerate_structures(left + 1, partner - 1):
            for suffix in enumerate_structures(partner + 1, right):
                results.append("(" + interior + ")" + suffix)
    return tuple(results)


def checked_pairs(structure: str) -> list[list[int]]:
    """Parse independently of RNA.ptable and enforce the advertised rules."""
    assert len(structure) == len(SEQUENCE)
    stack, pairs = [], []
    for index, symbol in enumerate(structure, 1):
        if symbol == "(":
            stack.append(index)
        elif symbol == ")":
            assert stack
            left = stack.pop()
            assert index - left >= 4
            assert SEQUENCE[left - 1] + SEQUENCE[index - 1] in ALLOWED_PAIRS
            pairs.append([left, index])
        else:
            assert symbol == "."
    assert not stack
    pairs.sort()
    for i, j in pairs:
        for k, l in pairs:
            assert not i < k < j < l
    return pairs


def loop_records(fc, structure: str) -> list[dict]:
    """Every closing pair contributes one loop term; include the exterior loop."""
    import RNA

    pt = RNA.ptable(structure)
    records = []
    for left in [0] + [i for i in range(1, len(SEQUENCE) + 1) if pt[i] > i]:
        right = len(SEQUENCE) + 1 if left == 0 else int(pt[left])
        children, unpaired = [], []
        cursor = left + 1
        while cursor < right:
            if pt[cursor] > cursor:
                children.append([cursor, int(pt[cursor])])
                cursor = int(pt[cursor]) + 1
            else:
                assert pt[cursor] == 0
                unpaired.append(cursor)
                cursor += 1
        if left == 0:
            kind = "exterior"
        elif not children:
            kind = "hairpin"
            assert len(unpaired) >= 3
        elif len(children) > 1:
            kind = "multibranch"
        elif not unpaired:
            kind = "stack"
        elif children[0][0] == left + 1 or children[0][1] == right - 1:
            kind = "bulge"
        else:
            kind = "internal"
        closing_pair = None if left == 0 else [left, right]
        touched_pairs = children + ([closing_pair] if closing_pair else [])
        record = {
            "id": f"loop-{left}",
            "type": kind,
            "closing_pair": closing_pair,
            "child_pairs": children,
            "unpaired_nt": unpaired,
            "highlight_nt": sorted(set(unpaired + [nt for pair in touched_pairs for nt in pair])),
            "energy_centikcal_mol": int(fc.eval_loop_pt(left, pt)),
        }
        record["energy_kcal_mol"] = record["energy_centikcal_mol"] / 100
        if kind == "stack":
            inner_left, inner_right = children[0]
            record["strand_5_to_3"] = SEQUENCE[left - 1] + SEQUENCE[inner_left - 1]
            record["opposite_strand_3_to_5"] = SEQUENCE[right - 1] + SEQUENCE[inner_right - 1]
        if kind == "hairpin":
            record["loop_sequence"] = "".join(SEQUENCE[i - 1] for i in unpaired)
            record["sequence_with_closing_pair"] = SEQUENCE[left - 1:right]
        records.append(record)
    total = int(fc.eval_structure_pt(pt))
    assert sum(loop["energy_centikcal_mol"] for loop in records) == total
    return records


def build() -> dict:
    try:
        import RNA
    except ImportError as exc:
        raise SystemExit(f"Regeneration requires an isolated Python environment with ViennaRNA=={VERSION}; see assets/rna-prediction/COMPUTATION.md. Viewing and the Node audit need no ViennaRNA.") from exc
    if RNA.__version__ != VERSION:
        raise SystemExit(f"Install ViennaRNA=={VERSION}; found {RNA.__version__}")
    assert RNA.params_load_RNA_Turner2004()
    md = RNA.md()
    for setting, value in SETTINGS.items():
        setattr(md, setting, value)
    fc = RNA.fold_compound(SEQUENCE, md)
    mfe_structure, mfe_float = fc.mfe()
    fc.exp_params_rescale(mfe_float)
    propensity_string, ensemble_float = fc.pf()
    rt = fc.exp_params.kT / 1000.0  # API stores RT in cal/mol.

    structures = enumerate_structures(0, len(SEQUENCE) - 1)
    assert len(set(structures)) == len(structures)
    evaluated = []
    for structure in structures:
        pairs = checked_pairs(structure)
        pt = RNA.ptable(structure)
        assert pairs == [[i, int(pt[i])] for i in range(1, len(SEQUENCE) + 1) if pt[i] > i]
        integer_energy = int(fc.eval_structure_pt(pt))
        assert abs(integer_energy / 100 - fc.eval_structure(structure)) < 1e-5
        evaluated.append({
            "structure": structure,
            "pairs": pairs,
            "pair_count": len(pairs),
            "energy_centikcal_mol": integer_energy,
            "energy_kcal_mol": integer_energy / 100,
            "loops": loop_records(fc, structure),
        })
    evaluated.sort(key=lambda item: (item["energy_centikcal_mol"], item["structure"]))
    assert evaluated[0]["structure"] == mfe_structure
    assert abs(evaluated[0]["energy_kcal_mol"] - mfe_float) < 1e-5
    assert sum(item["energy_centikcal_mol"] == evaluated[0]["energy_centikcal_mol"] for item in evaluated) == 1

    partition_function = sum(math.exp(-item["energy_kcal_mol"] / rt) for item in evaluated)
    for index, item in enumerate(evaluated, 1):
        item["structure_id"] = f"s{index:03}"
        item["boltzmann_weight"] = math.exp(-item["energy_kcal_mol"] / rt)
        item["probability"] = item["boltzmann_weight"] / partition_function
        item["probability_vienna_api"] = fc.pr_structure(item["structure"])
    ensemble_enumerated = -rt * math.log(partition_function)
    bpp = fc.bpp()
    pair_probabilities = []
    bpp_max_error = 0.0
    for i in range(1, len(SEQUENCE) + 1):
        for j in range(i + 1, len(SEQUENCE) + 1):
            enumerated = sum(item["probability"] for item in evaluated if [i, j] in item["pairs"])
            api_value = bpp[i][j]
            bpp_max_error = max(bpp_max_error, abs(enumerated - api_value))
            if enumerated:
                pair_probabilities.append({
                    "i": i, "j": j,
                    "bases": SEQUENCE[i - 1] + SEQUENCE[j - 1],
                    "probability": enumerated,
                    "probability_vienna_api": api_value,
                    "in_mfe": [i, j] in evaluated[0]["pairs"],
                })
    unpaired_probabilities = [
        {
            "i": i, "base": SEQUENCE[i - 1],
            "probability": 1 - sum(pair["probability"] for pair in pair_probabilities if i in (pair["i"], pair["j"])),
        }
        for i in range(1, len(SEQUENCE) + 1)
    ]
    assert len(evaluated) == 99
    assert abs(sum(item["probability"] for item in evaluated) - 1) < 1e-12
    assert abs(ensemble_enumerated - ensemble_float) < 1e-6
    assert bpp_max_error < 1e-6
    assert max(abs(item["probability"] - item["probability_vienna_api"]) for item in evaluated) < 1e-6
    assert all(-1e-12 <= item["probability"] <= 1 for item in unpaired_probabilities)
    assert fc.params.SaltStack == 0
    assert all(value == 0 for value in fc.params.SaltLoop)

    choices = [
        ("mfe", "(((((...)))))", "Five-pair stem", "Стебель из пяти пар"),
        ("long_loop", "((((.....))))", "Larger hairpin", "Более крупная петля"),
        ("frayed", ".((((...)))).", "Open outer pair", "Разомкнутая внешняя пара"),
        ("internal_loop", "((.((...)).))", "Internal loop", "Внутренняя петля"),
        ("unpaired", ".............", "Unpaired chain", "Неспаренная цепь"),
    ]
    lookup = {item["structure"]: item for item in evaluated}
    candidates = [dict(lookup[structure], id=identity, label={"en": en, "ru": ru}) for identity, structure, en, ru in choices]
    return {
        "schema_version": 1,
        "sequence": SEQUENCE,
        "length": len(SEQUENCE),
        "index_base": 1,
        "sequence_origin": "Short authored teaching sequence; energies are real model calculations, not experimental measurements.",
        "provenance": {
            "program": "ViennaRNA Python bindings",
            "version": RNA.__version__,
            "distribution": "ViennaRNA==2.7.2 from PyPI, official upstream Python interface",
            "parameter_set": "RNA Turner 2004",
            "parameter_loader": "RNA.params_load_RNA_Turner2004()",
            # Preserve the original calculation provenance byte-for-byte.
            # The portable reproducer is build/rna-prediction-data.py.
            "generator": "build/thermo-example.py",
            "sources": SOURCES,
        },
        "model": {
            "settings": SETTINGS,
            "temperature_C": 37.0,
            "temperature_K": 310.15,
            "monovalent_salt_M": 1.021,
            "salt_interpretation": "ViennaRNA default reference condition; computed stack and loop salt corrections are zero. No explicit Mg2+ model.",
            "energy_unit": "kcal/mol",
            "raw_integer_energy_unit": "0.01 kcal/mol = 10 cal/mol",
            "RT_kcal_mol": rt,
            "gas_constant_kcal_mol_K": rt / 310.15,
            "allowed_pair_types": sorted(ALLOWED_PAIRS),
            "structure_scope": "Single linear RNA, canonical and GU pairs, noncrossing secondary structures, minimum hairpin size 3; no constraints, no pseudoknots, no G-quadruplexes.",
            "probability_method": "Normalized exhaustive Boltzmann sum of all 99 structures evaluated with ViennaRNA; independently agrees with ViennaRNA PF and base-pair probabilities within 1e-6.",
        },
        "mfe": candidates[0],
        "candidates": candidates,
        "ensemble": {
            "structure_count": len(evaluated),
            "partition_function_Z": partition_function,
            "free_energy_kcal_mol": ensemble_enumerated,
            "free_energy_vienna_api_kcal_mol": ensemble_float,
            "mfe_probability": evaluated[0]["probability"],
            "propensity_string_vienna_api": propensity_string,
            "pair_probabilities": pair_probabilities,
            "unpaired_probabilities": unpaired_probabilities,
            "all_structures": evaluated,
        },
        "verification": {
            "exhaustive_mfe_matches_vienna_mfe": True,
            "all_loop_integer_sums_match_structure_energies": True,
            "all_pair_identities_and_hairpin_sizes_valid": True,
            "all_structures_distinct_and_noncrossing": True,
            "probability_sum": sum(item["probability"] for item in evaluated),
            "ensemble_energy_absolute_error_kcal_mol": abs(ensemble_enumerated - ensemble_float),
            "maximum_pair_probability_absolute_error": bpp_max_error,
            "maximum_structure_probability_absolute_error": max(abs(item["probability"] - item["probability_vienna_api"]) for item in evaluated),
            "tolerance_for_independent_pf_comparison": 1e-6,
        },
        "interpretation": {
            "energy": "Loop terms are sequence- and structure-context contributions; do not assign a fixed energy to a GC pair or to one hydrogen bond.",
            "comparison": "The four-pair larger hairpin is -3.70 kcal/mol; the four-pair frayed stem is -2.60; the four-pair internal-loop fold is +0.20. Pair count alone cannot reproduce these differences.",
            "probabilities": "Equilibrium model probabilities conditional on the stated sequence, parameters, settings and allowed structures; not experimental confidence.",
            "representation_2d": "Base-pair topology is computed. Positioning the residues in a 2D drawing is a layout choice.",
            "representation_3d": "No 3D coordinates or folding trajectories are computed by this generator. A 3D depiction of these pairs must be labeled schematic geometry.",
            "candidate_motion": "Transitioning between candidate drawings compares structures; it is not a computed kinetic pathway.",
        },
    }


def render_script(data: dict) -> str:
    """Embed data safely inside the standalone HTML's script element."""
    payload = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    payload = payload.replace("<", "\\u003c").replace(">", "\\u003e").replace("&", "\\u0026")
    payload = payload.replace("\u2028", "\\u2028").replace("\u2029", "\\u2029")
    return (
        "/* Generated from assets/rna-prediction/thermo-example.json by build/rna-prediction-data.py; real ViennaRNA computation. */\n"
        "window.RNA_EXPERIMENT=" + payload + ";\n"
    )


def write_or_check(output: Path, content: str, check: bool) -> None:
    if check:
        if not output.is_file() or output.read_text(encoding="utf-8") != content:
            raise SystemExit(f"Stale or missing output: {output}")
    else:
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(content, encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify JSON and embedded JavaScript exactly match a fresh calculation; with --embed-only, verify only the embedding.")
    parser.add_argument("--embed-only", action="store_true", help="Use existing JSON to write/check JavaScript without importing ViennaRNA.")
    parser.add_argument("--output", type=Path, default=OUTPUT, help="JSON output/input (default: this project's assets/rna-prediction/thermo-example.json).")
    parser.add_argument("--script-output", type=Path, default=SCRIPT_OUTPUT, help="Embedded JavaScript output (default: this project's recipe data script).")
    args = parser.parse_args()
    data = json.loads(args.output.read_text(encoding="utf-8")) if args.embed_only else build()
    if not args.embed_only:
        serialized = json.dumps(data, indent=2, ensure_ascii=False) + "\n"
        write_or_check(args.output, serialized, args.check)
    write_or_check(args.script_output, render_script(data), args.check)
    print(json.dumps({
        "output": str(args.output), "script_output": str(args.script_output),
        "checked": args.check, "fresh_calculation": not args.embed_only,
        "sequence": data["sequence"], "count": data["ensemble"]["structure_count"],
        "mfe": data["mfe"]["structure"], "energy": data["mfe"]["energy_kcal_mol"],
        "mfe_probability": data["ensemble"]["mfe_probability"],
        "verification": data["verification"],
    }, indent=2))


if __name__ == "__main__":
    main()

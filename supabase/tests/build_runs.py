#!/usr/bin/env python3
"""Gradi dvije samostalne skripte (jedna naredba = jedan DO blok, uvijek poništena):
  run1_before.sql : šema + NAMJERNO ranjive politike + test   (očekivano: napadi FAIL)
  run2_after.sql  : šema + migracija 20261028 + test          (očekivano: 0 FAIL)
Upotreba: python3 build_runs.py <izlazni_direktorij>"""
import pathlib, sys
here = pathlib.Path(__file__).parent
mig = here.parent / "migrations" / "20261028_rls_least_privilege.sql"
out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
read = lambda p: p.read_text(encoding="utf-8")
test = read(here / "rls_isolation.sql")
assert test.count("-- @@SETUP@@") == 1
assert "$$" not in read(here/"baseline_schema.sql") + read(here/"baseline_vulnerable_policies.sql") + read(mig)
def build(setup, name):
    (out / name).write_text(test.replace("\n  -- @@SETUP@@\n", "\n" + setup + "\n"), encoding="utf-8")
build(read(here/"baseline_schema.sql") + "\n" + read(here/"baseline_vulnerable_policies.sql"), "run1_before.sql")
build(read(here/"baseline_schema.sql") + "\n" + read(mig), "run2_after.sql")
print("OK", out)

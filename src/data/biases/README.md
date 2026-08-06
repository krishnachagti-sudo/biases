# The corpus

One JSON file per bias, named for its slug.

Empty on purpose. `docs/BUILD-ORDER.md` lists the 177 biases to write and the
order they get written in; the schema is defined alongside the entry template,
which does not exist yet either.

This directory is tracked while empty because two things read it and would
otherwise crash rather than report zero: `build/style-check.mjs` and the corpus
arm of `test/dedash.test.mjs`.

# MassScout Local Storage Scheme
_Note: The global local storage object is denoted as `global`. Active as of v1.1.0._

## Match entries

Match entries are stored under `global.<match key>`. For example, `global['Q4:4410']`.

## Options

User-defined options are stored under `global.options`. Available options:

* `favoriteTeams: number[]`: The user's favorite team numbers
* `ownTeam: number`: The user's team number
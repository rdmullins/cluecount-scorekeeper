# ClueCount — Play-Along Scorekeeper

A lightweight, responsive, client-side scoring app built with plain HTML, CSS, and JavaScript.

## Features

- Regular round values: $200–$1,000
- Double round values: $400–$2,000
- Correct, incorrect, and pass scoring
- Optional Daily Double wager panel
- Final round wager and result scoring
- Undo the most recent clue
- Saves score and recent history in this browser on this device
- Responsive layout for phones, tablets, and desktop
- No account, server, build step, or external JavaScript dependencies

## Use it

Open the published site in a modern browser. Your score is stored in that browser's local storage; it does not sync between devices or browsers. Use **New game** to clear the current score and history.

## Scoring assumptions

- Regular and Double clues: correct adds the clue value; incorrect subtracts it; pass adds/subtracts nothing.
- Daily Double: correct adds the wager; incorrect or pass subtracts it. Maximum wager is the greater of the current score and the highest clue value in the selected round, with a floor of $0.
- Final round: maximum wager is the current score, floored at $0. Correct adds the wager; incorrect or pass subtracts it.

These are simplified play-along rules. The app does not load episode data or verify responses.

## Naming note

**ClueCount** is a working name chosen to avoid an immediate naming collision with an existing app. This is an unofficial fan-made tool and is not affiliated with or endorsed by any show or rights holder.
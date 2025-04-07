There exists a synced state library imported as

import { state } from "URL_BELOW"

Always assume every param on the state does not exist yet.  Here is an example of how to use it:

state.onStateChange((state) => {
   updateUI(state)
})

await state.setupState({ todos: [] })

state.changeState((draft) => {
    if (!draft.todos) {
        draft.todos = [];
    }
    draft.todos.push({
        id: randomId(),
        title: "New Todo",
    });
});

Make a collaborative minesweeper game
```
https://cdn.jsdelivr.net/gh/jeffreyyoung/poe_push_pull_state@709ba294ea540b43d1eb3735faf57fb433b957d1/client.js


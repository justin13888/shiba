import { Show } from 'solid-js';
import './App.css';
import { getTabs } from '@/utils/db';

// TODO: Implement and style
function App() {
  // TODO: Check if there's some weird reactivity behaviour if undefined
  const [maxTabGroups, setMaxTabGroups] = createSignal<number | undefined>(10); // TODO: Make UI edit it
  // const [savedTabsTotal] = createResource(async () => {
  //   return await sendMessage("getTabCount", {}, "background");
  // });
  const [tabCount] = createResource(getTabCount);
  const [tabGroups] = createResource(
    maxTabGroups(),
    getTabs,
  );

  // createEffect(
  //   on(tabCount, (value) => {
  //     console.log('Tab count:', value);
  //   })
  // )

  // createEffect(
  //   on(tabGroups, (value) => {
  //     console.log('Tab groups:', value);
  //   })
  // )

  return (
    <div class="flex flex-col items-center justify-center p-4">
      <div class="text-5xl font-bold">
        <Show when={tabCount.state === 'ready'} fallback={<p>Loading...</p>}>
          <p>{tabCount()} Tabs Saved</p>
        </Show>
        <Show when={tabGroups.state === 'ready'} fallback={<p>Loading...</p>}>
          <p>Tabs Saved</p>
          <For each={tabGroups()}>
            {([tabGroup, tabs]) => (
              <div>
                <p>Name: {tabGroup.name || "undefined"}</p>
                <ul>
                  <For each={tabs}>
                    {(tab) => (
                      <li>
                        <a href={tab.url} target="_blank" rel="noreferrer">
                          {tab.title}
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
          <p>End</p>
        </Show>
      </div>
    </div>
  );
}

export default App;

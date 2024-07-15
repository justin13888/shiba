import { Show } from 'solid-js';
import './App.css';
import { deleteTabGroup, getTabs } from '@/utils/db';

// TODO: Implement style
function App() {
  const [maxTabGroups, setMaxTabGroups] = createSignal<number | undefined>(10); // TODO: Make UI edit it
  // const [savedTabsTotal] = createResource(async () => {
  //   return await sendMessage("getTabCount", {}, "background");
  // });
  const [tabCount, {refetch: tabCountRefetch}] = createResource(getTabCount);
  const [tabGroups, {refetch: tabGroupsRefetch}] = createResource(
    maxTabGroups(),
    getTabs,
  );

  const dataRefresh = () => {
    tabCountRefetch();
    tabGroupsRefetch();
  }

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
    <div class="flex flex-col p-4">
      <div class="flex flex-row items-baseline space-x-4 pb-4">
        <p class="text-4xl font-extrabold">Shiba</p>
        {/* TODO: Replace fallback with loading animation */}
        <Show when={tabCount.state === 'ready'} fallback={<p>Loading...</p>}>
          <p class="text-xl">{tabCount()} Tabs Saved</p>
        </Show>
      </div>
      <div class="flex flex-col space-y-6">

        {/* TODO: Replace fallback with loading animation */}
        <Show when={tabGroups.state === 'ready'} fallback={<p>Loading...</p>}>
          <For each={tabGroups()}>
            {([tabGroup, tabs]) => (
              <div class="m-4">
                <div class="flex flex-row align-baseline space-x-4">
                  <span class="pr-2">
                    {
                      // TODO: Make name box editable
                      tabGroup.name ? (
                        <p class="font-semibold">{tabGroup.name }</p>
                      ) : (
                        <p class="font-semibold italic">Unnamed</p>
                      )
                    }
                  </span>
                  <button class="p-2 rounded-sm text-blue-600 hover:bg-blue-300"
                    type="button"
                    onClick={() => {
                      for (const tab of tabs) {
                        browser.tabs.create({ url: tab.url });
                      }
                      deleteTabGroup(tabGroup.groupId);
                      dataRefresh();
                    }}>
                    Restore All
                  </button>

                  <button class="p-2 rounded-sm text-blue-600 hover:bg-blue-300"
                    type="button"
                    onClick={async () => {
                      const newWindow = await browser.windows.create({
                        url: tabs.map((tab) => tab.url),
                      });
                      deleteTabGroup(tabGroup.groupId);
                      dataRefresh();
                    }}>
                    Restore All in New Window
                  </button>
                  
                  <button class="p-2 rounded-sm text-red-600 hover:bg-red-300"
                    type="button"
                    onClick={() => {
                      deleteTabGroup(tabGroup.groupId);
                      dataRefresh();
                    }}
                    >
                    Delete All
                  </button>
                </div>
                {/* TODO: Display favicon */}
                {/* TODO: Current tab interactions include: Delete, Restore */}
                {/* TODO: Add "restore all", "Delete all" */}
                {/* TODO: Display timeCreated */}
                {/* TODO: Make file explorer like keyboard shortcuts work (e.g. Ctrl+A, Shift) */}
                <ul>
                  <For each={tabs}>
                    {(tab) => (
                      <li>
                        <span class="flex flex-row items-center space-x-2">
                          {/* TODO: Set to better fallback */}
                          <img src={tab.favicon || ""} alt="Favicon logo" class="h-5" />

                          {/* <p>{tab.favicon}</p> */}
                          <a href={tab.url} target="_blank" rel="noreferrer"
                            class="text-blue-600">
                            {tab.title}
                          </a>
                        </span>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            )}
          </For>
          {/* TODO: Implement pagination */}
        </Show>
      </div>
    </div>
  );
}

export default App;

import { Skeleton } from "@/components/ui/skeleton"
import { saveAllTabs, saveCurrentTab } from '@/utils/tabs';
import './App.css';

// TODO: Style
function App() {
  // Sample data for the number of tabs saved
  const [tabCount, { refetch }] = createResource(getTabCount);

  return (
    <>
      <div class="w-[300px] h-[300px] flex flex-col items-center justify-between p-1 bg-gray-100">
        <div class="flex flex-col grow text-center items-center p-4">
          <Show when={tabCount.state === 'ready'}
            fallback={<Skeleton height={72} width={62} radius={10} />}>
            <p class="text-7xl font-extrabold text-gray-800">
              {tabCount()}
            </p>
          </Show>
          <p>Tabs Saved</p>
        </div>

        {/* Save Buttons */}
        <div class="grid grid-cols-2 gap-1">
          {
            ([
              ['Save Current Tab', () => {
                saveCurrentTab();
                refetch();
              }],
              ['Save All Tabs', () => {
                saveAllTabs();
                refetch();
              }],
              ['Open Import', () => {
                window.open(browser.runtime.getURL('/import.html'), '_blank');
              }],
              ['Open Saved', () => {
                window.open(browser.runtime.getURL('/saved.html'), '_blank');
              }],
            ] as [string, () => void][]).map(([text, handler]) => (
              <button
                onClick={handler}
                class="p-4 bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                {text}
              </button>
            ))
          }

          {/* <button
          onClick={handleSaveCurrentTab}
          class="w-full p-4 bg-blue-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Save Current Tab
        </button> */}

          {/* TODO: Remove extra buttons after editing */}
        </div>
      </div>
    </>
  );
}

export default App;

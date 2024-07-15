import { createSignal } from 'solid-js'
import { parseOneTabUrl } from '@/utils/onetab';
import './App.css';
import { switchToOrOpenTab } from '@/utils';
import { sendMessage } from 'webext-bridge/window';
import { addTabBundle } from '@/utils/db';

// TODO: Style
function App() {
  const [importString, setImportString] = createSignal('');
  const [importOption, setImportOption] = createSignal<'oneTab' | 'betterOneTab'>('oneTab');
  const [isDisabled, setIsDisabled] = createSignal(true);
  const [feedbackMessage, setFeedbackMessage] = createSignal<string | null>(null);
  const [feedbackType, setFeedbackType] = createSignal<"success" | "error" | null>(null);
  // TODO: Combine feedbackMessage and feedbackType into a single signal

  // Update isDisabled whenever importString changes
  createEffect(() => {
    setIsDisabled(importString().trim() === "");
  });

  const handleSubmit = async (event: SubmitEvent) => {
    event.preventDefault();

    try {
      // Parse tab groups from import string
      const tabBundles = await (async () => {
        if (importOption() === 'oneTab') {
          return parseOneTabUrl(importString());
        }
        if (importOption() === 'betterOneTab') {
          return parseBetterOneTabUrl(importString());
        }
        
        setFeedbackMessage("Invalid import option. Please try again.");
        setFeedbackType("error");
        return undefined;
      })();
      if (!tabBundles) return;

      console.log('Parsed tab bundles:', tabBundles);
      
      // Add tabs to storage
      for (const tabBundle of tabBundles) {
        await addTabBundle(tabBundle);
      }

      // Open the new tab
      await switchToOrOpenTab(browser.runtime.getURL('/saved.html'))
      
      setFeedbackMessage("Tabs successfully imported!");
      setFeedbackType("success");
    } catch (error) {
      setFeedbackMessage(`Error importing tabs: ${error instanceof Error ? error.message : error}`);
      setFeedbackType("error");
      console.error(error);
    }
  };

  return (
    <div class="min-h-screen flex items-center justify-center bg-gray-200">
      <div class="flex justify-center items-center h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit}
          class="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full"
        >
          <div class="mb-4">
            <label for="textInput" class="block text-gray-700 text-sm font-bold mb-2">
              Enter Text:
            </label>
            <textarea
              id="textInput"
              value={importString()}
              onInput={(e) => setImportString(e.target.value)}
              class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Type something..."
            />
          </div>

          {/* Import Buttons */}
          <div class="flex items-center justify-between">
            <button
              type="submit"
              onClick={() => setImportOption('oneTab')}
              class={`bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled() ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
              disabled={isDisabled()}
            >
              Import as OneTab
            </button>
            <button
              type="submit"
              onClick={() => setImportOption('betterOneTab')}
              class={`bg-blue-500 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isDisabled() ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-700"}`}
              disabled={isDisabled()}
            >
              Import as Better OneTab (JSON)
            </button>
          </div>

          {/* Feedback Message */}
          {feedbackMessage() && (
            <div
              class={`mt-4 p-4 rounded ${feedbackType() === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
            >
              {feedbackMessage()}
            </div>
          )}
        </form>
      </div>
    </div>
  );

}

export default App;

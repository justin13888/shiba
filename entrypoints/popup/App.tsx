import './App.css';

// TODO: Style
function App() {
  // Sample data for the number of tabs saved
  const savedTabsTotal = 420; // TODO: Connect with background script

  // Define handler functions for buttons
  const handleSaveCurrentTab = () => {
    // TODO: Implement
    // Add logic to save the current tab
    console.log('Save current tab');
  };

  const handleSaveAllTabs = () => {
    // TODO: Implement
    // Add logic to save all tabs
    console.log('Save all tabs');
  };

  return (
    <>
      <div class="flex flex-col items-center justify-center h-screen p-4 bg-gray-100">
      <div class="text-5xl font-bold text-gray-800">
          {savedTabsTotal} Tabs Saved
      </div>

      {/* Save Buttons */}
      <div class="flex flex-col space-y-4">
        <button
          onClick={handleSaveCurrentTab}
          class="w-full p-4 bg-blue-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Save Current Tab
        </button>
        <button
          onClick={handleSaveAllTabs}
          class="w-full p-4 bg-green-500 text-white text-xl font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors"
        >
          Save All Tabs
        </button>
      </div>
    </div>
    </>
  );
}

export default App;

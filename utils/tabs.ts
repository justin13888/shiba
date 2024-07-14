import { Tab, TabGroup } from '@/types/model';

export const saveCurrentTab = async () => {
    // TODO: Implement for real
    await browser.tabs.query({ active: true, currentWindow: true })
        .then((tabs) => {
            if (tabs.length > 0) {
                const tab = tabs[0];
                const [title, url] = [undefined, undefined]
                // const title = tab.title;
                // const url = tab.url;
                const favicon = tab.favIconUrl;
                if (title && url) {
                    const currentTab = new Tab({
                        title,
                        url,
                        favicon,
                    });
                    const newTabGroup = new TabGroup({
                        tabs: [currentTab],
                    });
                    appendTabs([newTabGroup]);
                } else {
                    console.error('Tab title or URL is undefined:', { title, url });
                }
            }
        });
    console.log('Saving current tab');
    const currentTab = new Tab({
        title: 'Example',
        url: 'https://example.com',
    });

    const newTabGroup = new TabGroup({
        tabs: [currentTab],
    });

    await appendTabs([newTabGroup]);
};

export const saveAllTabs = () => {
    // TODO: Implement for real
};

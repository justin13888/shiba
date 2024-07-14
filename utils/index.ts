export const switchToOrOpenTab = (url: string) => {
    browser.tabs.query({ currentWindow: true, url }).then((tabs) => {
        if (tabs.length > 0) {
            browser.tabs.update(tabs[0].id, { active: true });
        } else {
            browser.tabs.create({ url });
        }
    });
}

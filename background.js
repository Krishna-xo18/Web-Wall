chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  const { status } = changeInfo;
  let currentTabUrlHost = new URL(tab.url).host;
  if (status === "loading") {
    chrome.storage.local.get({ urls: [] }, function (result) {
      var urlsArr = result.urls;
      if (urlsArr && urlsArr.length > 0) {
        urlsArr.forEach(element => {
          if (element.URL == currentTabUrlHost) {
            chrome.tabs.create({ url: chrome.runtime.getURL("blocked.html") });
            chrome.tabs.remove(tabId);
          }
        });
      }
    });
  }
});

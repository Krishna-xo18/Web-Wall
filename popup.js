// Get the URL of the current tab and update the UI
function getCurrentTabUrlAndBind() {
  chrome.tabs &&
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let currentTab = tabs[0];
      if (currentTab.url && !currentTab.url.includes("blocked.html")) {
        document.getElementById("disabledButton").style.display = "none";
        let currentTabHostUrl = new URL(currentTab.url).host;
        document.getElementById("img").src =
          currentTab.favIconUrl || "/assets/default_favicon.jpg";
        document.getElementById("content").innerHTML = "You're on";
        urlName(currentTabHostUrl);
      } else {
        document.getElementById("blockButton").style.display = "none";
        document.getElementById("img").src =
          currentTab.favIconUrl || "/assets/default_favicon.jpg";
        document.getElementById("content").innerHTML =
          "You're trying to access a";
        document.getElementById("urlName").innerHTML = "Blocked Site";
      }
    });
}

// Display a truncated version of the URL if it's too long
function urlName(url) {
  document.getElementById("urlName").innerHTML =
    url.length >= 19 ? url.substring(0, 19) + "..." : url;
}

// Get details of the current tab and block the site

function BlockSocial() {
  console.log("called");
  const sites = [
    {
      url: "www.instagram.com",
      favicon: "/assets/instagram.jpg",
    },
    {
      url: "www.facebook.com",
      favicon: "https://www.facebook.com/favicon.ico",
    },
    { url: "www.twitter.com", favicon: "https://www.twitter.com/favicon.ico" },
    {
      url: "www.linkedin.com",
      favicon: "https://www.linkedin.com/favicon.ico",
    },
    {
      url: "www.snapchat.com",
      favicon: "https://www.snapchat.com/favicon.ico",
    },
    { url: "www.tiktok.com", favicon: "https://www.tiktok.com/favicon.ico" },
  ];

  chrome.storage.local.get({ urls: [] }, function (result) {
    var urls = result.urls;
    sites.forEach((site) => {
      if (!urls.find((url) => url.URL === site.url)) {
        urls.push({
          URL: site.url,
          Blocked: true,
          favIconUrl: site.favicon,
        });
      }
    });
    chrome.storage.local.set({ urls: urls }, function () {
      chrome.tabs.query(
        { active: true, currentWindow: true },
        function (arrayOfTabs) {
          chrome.tabs.reload(arrayOfTabs[0].id);
        }
      );
    });
  });
}

function getTabDetails() {
  chrome.tabs &&
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      let currentTab = tabs[0];
      if (currentTab.url) {
        let currentTabUrlHost = new URL(currentTab.url).host;

        chrome.declarativeNetRequest.getDynamicRules((dynamicRes) => {
          if (dynamicRes && dynamicRes.length > 0) {
            dynamicRes.forEach((rule) =>
              chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: [rule.id],
              })
            );
          }
        });

        chrome.declarativeNetRequest.getDynamicRules((dynamicRes) => {
          let id = dynamicRes.length ? dynamicRes.length + 1 : 1;
          chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [
              {
                id: id,
                priority: 1,
                action: { type: "block" },
                condition: {
                  urlFilter: `||${currentTabUrlHost}/`,
                  resourceTypes: ["main_frame"],
                },
              },
            ],
          });
        });

        chrome.storage.local.get({ urls: [] }, function (result) {
          var urls = result.urls;
          urls.push({
            URL: currentTabUrlHost,
            Blocked: true,
            favIconUrl: currentTab.favIconUrl,
          });
          chrome.storage.local.set({ urls: urls }, function () {
            chrome.tabs.query(
              { active: true, currentWindow: true },
              function (arrayOfTabs) {
                chrome.tabs.reload(arrayOfTabs[0].id);
              }
            );
          });
        });
      }
    });
}

// Event listeners for DOM content and button clicks
document.addEventListener("DOMContentLoaded", function () {
  getCurrentTabUrlAndBind();
  document.getElementById("listPage").style.display = "none";
  document.getElementById("mainPage").style.display = "block";
  document
    .getElementById("blockButton")
    .addEventListener("click", getTabDetails);
  document
    .getElementById("blockButtonSocial")
    .addEventListener("click", BlockSocial);
  document
    .getElementById("editBlockListButton")
    .addEventListener("click", getBlockedSiteList);
  document.getElementById("goBack").addEventListener("click", goToMainPage);
  document.getElementById("searchBar").addEventListener("keyup", search_sites);
});

// Display the list of blocked sites
function getBlockedSiteList() {
  document.getElementById("mainPage").style.display = "none";
  document.getElementById("listPage").style.display = "block";
  var input = document.getElementById("searchBar");
  if (input.value.length > 0) input.value = "";

  chrome.storage.local.get({ urls: [] }, (result) =>
    createCardList(result.urls)
  );
}

// Create a list of cards for each blocked site
function createCardList(urls) {
  var container = document.getElementById("blockSiteList");
  container.innerHTML = "";
  if (urls.length > 0) {
    urls.forEach((url) => {
      var favIcon = url.favIconUrl || "/assets/default_favicon.jpg";
      container.innerHTML += `
        <div class="card">
          <div class="container">
            <div class="urlCardContent">
              <span><img id="favIconImg" alt="" src=${favIcon} width="20px" height="20px"/></span>
              <span id="urlListName">${url.URL}</span>
            </div>
            <input id="unblockSiteButton" type="button" value="Unblock">
          </div>
        </div>`;
    });
    document
      .querySelectorAll("#unblockSiteButton")
      .forEach((button) => button.addEventListener("click", unBlockSite));
  } else {
    container.innerHTML = `<div id='noRecords'>No Records Available</div>`;
  }
}

// Filter the list of blocked sites based on search input
function search_sites() {
  let input = document.getElementById("searchBar").value.toLowerCase();
  let x = document.getElementsByClassName("card");
  Array.from(x).forEach((card) => {
    let url = card.querySelector("#urlListName").innerHTML.toLowerCase();
    card.style.display = url.includes(input) ? "list-item" : "none";
  });
}

// Remove a site from the blocked list
function removeFromUrlArrList(url) {
  chrome.storage.local.get(null, (result) => {
    var urls = result.urls.filter((item) => item.URL !== url);
    chrome.storage.local.set({ urls: urls }, getBlockedSiteList);
  });
}

// Go back to the main page
function goToMainPage() {
  document.getElementById("listPage").style.display = "none";
  document.getElementById("mainPage").style.display = "block";
}

// Unblock a site and remove it from the dynamic rules
function unBlockSite(event) {
  var parrentNode = event.target.parentNode;
  var url = parrentNode.querySelector("#urlListName").innerHTML;
  if (url) {
    removeFromUrlArrList(url);
    chrome.declarativeNetRequest.getDynamicRules((dynamicRes) => {
      dynamicRes.forEach((rule) => {
        if (rule.condition.urlFilter.includes(url)) {
          chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: [rule.id],
          });
        }
      });
    });
  }
}

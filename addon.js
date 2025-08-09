// ==UserScript==
// @name         Gildovní Tržiště
// @namespace    Violentmonkey Scripts
// @version      1.1
// @description  Rychlý výběr itemů na prodej a odeslání na endpoint, vylepšené UI a opravy chyb.
// @author       Psyche
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @updateURL    https://raw.githubusercontent.com/PsychedelicCZ/LZ-Addon/main/addon.js
// @downloadURL  https://raw.githubusercontent.com/PsychedelicCZ/LZ-Addon/main/addon.js
// ==/UserScript==

(function () {
    'use strict';

    const useable_scrolls = [
      'antoniovo', 'gaias', 'gaiovo', 'ichoruovo', 'luciovo', 'marcellovo',
      'opiehnzovo', 'rayolovo', 'talethovo', 'trafanovo', 'titaniovo', 'uróthienovo',
      'valeriovo', 'vergilliovo', 'sebastianovo', 'tiberovo', 'ambrosiovo', 'aulovo',
      'usrovo', 'agresivity', 'amazonek', 'brutality', 'bojových umění', 'duševní nadvlády',
      'důvtipu', 'draka', 'dominance', 'rozkoše', 'eliminace', 'harmonie', 'hvězd',
      'konfliktu', 'haleluja', 'chakry', 'lásky', 'nebes', 'naděje', 'odplaty',
      'otevřených ran', 'ohně', 'pekla', 'rychlosti', 'šílenství', 'smrti', 'samoty',
      'slávy', 'úspěchu', 'utrpení', 'vraždy', 'záře', 'zkázy', 'země', 'zloby', 'pekla',
      'křídel', 'šera', 'zimy', 'tepla', 'trápení', 'hlubiny', 'malátnosti'
    ];

    function saveSettings(settings) {
        localStorage.setItem('gladiatus_addon_settings', JSON.stringify(settings));
    }

    function loadSettings() {
        const saved = localStorage.getItem('gladiatus_addon_settings');
        return saved ? JSON.parse(saved) : { showScrollSearcher: true };
    }

    function createScrollSearcher() {
        const settings = loadSettings();
        if (!settings.showScrollSearcher) return;

        const mainMenu = document.getElementById('mainmenu');
        if (!mainMenu) return;

        const searchContainer = document.createElement('div');
        searchContainer.id = 'scroll-searcher';
        searchContainer.style.cssText = `
            position: relative;
            margin-bottom: 2px;
        `;

        const inputContainer = document.createElement('div');
        inputContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 5px;
        `;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.placeholder = 'Vyhledat svitek...';
        searchInput.className = 'menuitem';
        searchInput.style.cssText = `
            padding: 8px 12px;
            background: transparent;
            color: #BFAE54;
            border: 1px solid #BFAE54;
            border-radius: 4px;
            font-size: 12px;
            font-family: inherit;
            box-sizing: border-box;
            cursor: text;
            outline: none;
            width: calc(100% - 42px);
        `;

        const infoButton = document.createElement('button');
        infoButton.className = 'menuitem';
        infoButton.innerHTML = '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyUzYuNDggMjIgMTIgMjJTMjIgMTcuNTIgMjIgMTJTMTcuNTIgMiAxMiAyWk0xMyAxN0gxMVYxMUgxM1YxN1pNMTMgOUgxMVY3SDEzVjlaIiBmaWxsPSIjQkZBRTU0Ii8+Cjwvc3ZnPgo=" title="Informace o eventech" height="17" width="17">';
        infoButton.style.cssText = `
    background: transparent;
    color: rgb(191, 174, 84);
    border: 1px solid rgb(191, 174, 84);
    border-radius: 4px !important;
    font-size: 12px;
    font-family: inherit;
    box-sizing: border-box;
    cursor: text;
    outline: none;
    width: 28px;
`;




        const eventsTooltip = document.createElement('div');
        eventsTooltip.style.cssText = `
            position: absolute;
            top: 100%;
            right: 0;
            min-width: 350px;
            max-width: 450px;
            max-height: 400px;
            overflow-y: auto;
            margin-top: 8px;
            border: 1px solid #BFAE54;
            border-radius: 6px;
            background: #30140A;
            display: none;
            z-index: 1001;
            padding: 15px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        inputContainer.appendChild(searchInput);
        inputContainer.appendChild(infoButton);

        const suggestionsContainer = document.createElement('div');
        suggestionsContainer.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            max-height: 200px;
            overflow-y: auto;
            margin-top: 2px;
            border: 1px solid #BFAE54;
            border-radius: 4px;
            background: #30140A;
            display: none;
            z-index: 1000;
        `;

        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('cs-CZ', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        }

        function getTimeRemaining(targetDate) {
            const now = new Date();
            const target = new Date(targetDate);
            const diff = target - now;

            if (diff <= 0) return null;

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            if (days > 0) return `${days}d ${hours}h`;
            if (hours > 0) return `${hours}h ${minutes}m`;
            return `${minutes}m`;
        }

        function isEventActive(start, end) {
            const now = new Date();
            return now >= new Date(start) && now <= new Date(end);
        }

        function loadEvents() {
            eventsTooltip.innerHTML = '<div style="text-align: center; color: #BFAE54;">Načítání eventů...</div>';

            GM_xmlhttpRequest({
                method: "GET",
                url: "https://lz.clans.pro/api/events",
                onload: function(response) {
                    if (response.status === 200) {
                        try {
                            const data = JSON.parse(response.responseText);
                            displayEvents(data.events || []);
                        } catch (e) {
                            eventsTooltip.innerHTML = '<div style="color: #f00; text-align: center;">Chyba při načítání eventů</div>';
                        }
                    } else {
                        eventsTooltip.innerHTML = '<div style="color: #f00; text-align: center;">Nepodařilo se načíst eventy</div>';
                    }
                },
                onerror: function() {
                    eventsTooltip.innerHTML = '<div style="color: #f00; text-align: center;">Chyba sítě</div>';
                }
            });
        }

        function displayEvents(events) {
            if (!events || events.length === 0) {
                eventsTooltip.innerHTML = '<div style="color: #bbb; text-align: center;">Žádné nadcházející eventy</div>';
                return;
            }

            const now = new Date();
            const sortedEvents = events.sort((a, b) => new Date(a.start) - new Date(b.start));

            let html = '<div style="color: #BFAE54; font-weight: bold; margin-bottom: 12px; text-align: center; font-size: 14px;">📅 Gladiatus Eventy</div>';

            sortedEvents.forEach((event, index) => {
                const isActive = isEventActive(event.start, event.end);
                const startDate = formatDate(event.start);
                const endDate = formatDate(event.end);

                let timeInfo = '';
                let statusColor = '#bbb';
                let statusText = '';

                if (isActive) {
                    const timeLeft = getTimeRemaining(event.end);
                    statusText = '🟢 Probíhá';
                    statusColor = '#0f0';
                    if (timeLeft) timeInfo = ` (končí za ${timeLeft})`;
                } else if (new Date(event.start) > now) {
                    const timeToStart = getTimeRemaining(event.start);
                    statusText = '🔵 Nadcházející';
                    statusColor = '#4a9eff';
                    if (timeToStart) timeInfo = ` (za ${timeToStart})`;
                } else {
                    statusText = '⚫ Skončený';
                    statusColor = '#666';
                }

                html += `
                    <div style="
                        margin-bottom: ${index < sortedEvents.length - 1 ? '15px' : '0'};
                        padding: 10px;
                        border: 1px solid rgba(191, 174, 84, 0.3);
                        border-radius: 4px;
                        background: ${isActive ? 'rgba(0, 255, 0, 0.05)' : 'rgba(191, 174, 84, 0.05)'};
                    ">
                        <div style="
                            font-weight: bold;
                            color: #fff;
                            margin-bottom: 6px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <span>${startDate} - ${endDate}</span>
                            <span style="color: ${statusColor}; font-size: 11px;">${statusText}</span>
                        </div>
                        ${timeInfo ? `<div style="color: #ffd700; font-size: 11px; margin-bottom: 8px;">${timeInfo}</div>` : ''}
                        <div style="color: #ddd; line-height: 1.4;">
                            ${event.bonuses.map(bonus => `• ${bonus}`).join('<br>')}
                        </div>
                    </div>
                `;
            });

            eventsTooltip.innerHTML = html;
        }

        function showEvents() {
            loadEvents();
            eventsTooltip.style.display = 'block';
        }

        function hideEvents() {
            eventsTooltip.style.display = 'none';
        }

        // Event handlers for info button
        infoButton.addEventListener('mouseenter', () => {
            infoButton.style.background = 'rgba(191, 174, 84, 0.2)';
            infoButton.style.borderRadius = '4px';
            showEvents();
        });

        infoButton.addEventListener('mouseleave', () => {
            infoButton.style.background = 'transparent';
            infoButton.style.borderRadius = '4px';
            setTimeout(() => {
                if (!eventsTooltip.matches(':hover') && !infoButton.matches(':hover')) {
                    hideEvents();
                }
            }, 100);
        });

        eventsTooltip.addEventListener('mouseenter', () => {
            eventsTooltip.style.display = 'block';
        });

        eventsTooltip.addEventListener('mouseleave', () => {
            hideEvents();
        });

        function showSuggestions(query) {
            if (!query.trim()) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            const filtered = useable_scrolls.filter(scroll =>
                scroll.toLowerCase().includes(query.toLowerCase())
            );

            if (filtered.length === 0) {
                suggestionsContainer.style.display = 'none';
                return;
            }

            suggestionsContainer.innerHTML = '';

            filtered.forEach(scroll => {
                const suggestionItem = document.createElement('div');
                suggestionItem.style.cssText = `
                    padding: 8px 12px;
                    cursor: pointer;
                    border-bottom: 1px solid #BFAE54;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    font-size: 12px;
                `;

                const scrollName = document.createElement('span');
                scrollName.textContent = `svitek ${scroll}`;
                scrollName.style.color = '#BFAE54';

                const checkIcon = document.createElement('span');
                checkIcon.textContent = '✓';
                checkIcon.style.cssText = `
                    color: #0f0;
                    font-weight: bold;
                    font-size: 14px;
                `;
                checkIcon.title = 'Použitelný svitek';

                suggestionItem.appendChild(scrollName);
                suggestionItem.appendChild(checkIcon);

                suggestionItem.addEventListener('mouseenter', () => {
                    suggestionItem.style.background = 'rgba(191, 174, 84, 0.2)';
                });
                suggestionItem.addEventListener('mouseleave', () => {
                    suggestionItem.style.background = 'transparent';
                });

                suggestionItem.addEventListener('click', () => {
                    searchInput.value = `svitek ${scroll}`;
                    suggestionsContainer.style.display = 'none';
                });

                suggestionsContainer.appendChild(suggestionItem);
            });

            suggestionsContainer.style.display = 'block';
        }

        searchInput.addEventListener('input', (e) => {
            showSuggestions(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim()) {
                showSuggestions(searchInput.value);
            }
        });

        document.addEventListener('click', (e) => {
            if (!searchContainer.contains(e.target)) {
                suggestionsContainer.style.display = 'none';
                hideEvents();
            }
        });

        searchContainer.appendChild(inputContainer);
        searchContainer.appendChild(suggestionsContainer);
        searchContainer.appendChild(eventsTooltip);

        mainMenu.insertBefore(searchContainer, mainMenu.firstChild);
    }

    function removeScrollSearcher() {
        const existingSearcher = document.getElementById('scroll-searcher');
        if (existingSearcher) {
            existingSearcher.remove();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createScrollSearcher);
    } else {
        createScrollSearcher();
    }

    if (!window.location.search.includes('mod=overview')) {
        return;
    }

    console.log("Script started!")

    const targetSelector = '.inventory_box.ui-droppable-grid';

    const maleficaKeywords = [
      'měchy', 'kladivo', 'čtyřlístek', 'kovadlina',
      'anvil', 'bellows', 'clover', 'hammer'
    ];

    const waitForElement = (selector, callback) => {
      const el = document.querySelector(selector);
      if (el) return callback(el);
      const observer = new MutationObserver(() => {
        const el = document.querySelector(selector);
        if (el) {
          observer.disconnect();
          callback(el);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    function formatPrice(value) {
      const number = parseInt(String(value).replace(/\D/g, ''), 10);
      if (isNaN(number)) return value;
      return number.toLocaleString('cs-CZ');
    }

    function parseItemNameAndColor(rawName) {
      if (rawName.includes(',')) {
        const parts = rawName.split(',');
        const cleanName = parts[0].trim();
        const colorPart = parts[1];
        let color = '#fff';

        if (colorPart) {
          const lowerCaseColorPart = colorPart.toLowerCase();
          if (lowerCaseColorPart.includes('lime')) {
            color = '#07ea03';
          } else {
            const hexMatch = colorPart.match(/#[0-9A-Fa-f]{6}/);
            if (hexMatch) {
              color = hexMatch[0];
            }
          }
        }
        return { name: cleanName, color: color };
      }
      return { name: rawName, color: '#fff' };
    }

    function checkScrollUsability(itemName) {
      const lowerName = itemName.toLowerCase();
      if (lowerName.includes('svitek')) {
        const scrollName = lowerName.replace(/svitek\s*/g, '').trim();
        return useable_scrolls.includes(scrollName);
      }
      return null;
    }

    function getUserId() {
      const playerNameElement = document.querySelector('.playername_achievement.ellipsis, .playername.ellipsis');
      if (playerNameElement) {
        return playerNameElement.dataset.userId ||
               playerNameElement.getAttribute('data-user-id') ||
               playerNameElement.textContent.trim();
      }
      return null;
    }

    function getInventoryItems() {
      const items = document.getElementById("inv").getElementsByTagName("div");
      const parsedItems = [];

      for (let item of items) {
          const tooltipRaw = item.getAttribute("data-tooltip");
          if (!tooltipRaw) continue;

          const itemClass = item.className.split(' ').find(cls => cls.startsWith('item-i-')) || "Neznámá class";

          try {
              const tooltip = JSON.parse(tooltipRaw);
              const rawName = tooltip[0]?.[0] || "Neznámý předmět";

              const statsObject = {};
              tooltip.slice(1).forEach(line => {
                  if (Array.isArray(line[0]) && typeof line[0][0] === 'string' && line[0][0]) {
                      const statText = line[0][0];
                      const parts = statText.split(/ \+(.*)/s);
                      if (parts.length > 1) {
                          const key = parts[0].trim();
                          const value = `+${parts[1].trim()}`;
                          statsObject[key] = value;
                      }
                  }
              });

              const { name, color } = parseItemNameAndColor(decodeHTMLEntities(rawName));
              const isScrollUsable = checkScrollUsability(name);

              parsedItems.push({
                  id: item.dataset.itemId,
                  itemClass: itemClass,
                  name: name,
                  color: color,
                  stats: statsObject,
                  level: item.dataset.level || "???",
                  price: item.dataset.priceGold || "0",
                  isScrollUsable: isScrollUsable
              });

          } catch (e) {
              console.warn("Tooltip rozpadlej u itemu:", item, e);
          }
      }
      return parsedItems;
    }

    function decodeHTMLEntities(str) {
      const txt = document.createElement("textarea");
      txt.innerHTML = str;
      return txt.value;
    }

    function ensureItemImageStyles() {
        if (!document.getElementById('gladiatus-item-styles')) {
            const styleSheet = document.createElement("style");
            styleSheet.id = 'gladiatus-item-styles';
            styleSheet.innerText = `[class*="item-i-"] { background-image: url(https://s58-cz.gladiatus.gameforge.com/cdn/img/item.png); background-repeat: no-repeat; }`;
            document.head.appendChild(styleSheet);
        }
    }

    waitForElement(targetSelector, (container) => {
      const btn = document.createElement('button');
      btn.style.position = 'relative';
      btn.style.marginLeft = '20px';
      btn.style.background = '#412D18';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '6px 10px';
      btn.style.cursor = 'pointer';

      const btnText = document.createElement('span');
      btnText.textContent = 'Gildovní tržiště';
      btn.appendChild(btnText);

      btn.onclick = openMarketplace;

      const playerId = getUserId();
      if (playerId) {
          GM_xmlhttpRequest({
              method: "GET",
              url: `https://lz.clans.pro/api/notifications/${playerId}`,
              onload: function(response) {
                  if (response.status === 200) {
                      try {
                          const notifications = JSON.parse(response.responseText);
                          const totalNotifications = notifications.reservedItems + notifications.soldPurchases;
                          if (totalNotifications > 0) {
                              const notificationBadge = document.createElement('span');
                              notificationBadge.textContent = totalNotifications;
                              notificationBadge.style.position = 'absolute';
                              notificationBadge.style.top = '-8px';
                              notificationBadge.style.right = '-8px';
                              notificationBadge.style.background = '#B13123';
                              notificationBadge.style.color = 'white';
                              notificationBadge.style.borderRadius = '50%';
                              notificationBadge.style.padding = '2px 6px';
                              notificationBadge.style.fontSize = '11px';
                              notificationBadge.style.fontWeight = 'bold';
                              notificationBadge.style.border = '1px solid #fff';
                              btn.appendChild(notificationBadge);
                          }
                      } catch (e) { console.error("Chyba při parsování notifikací:", e); }
                  }
              }
          });
      }

      container.insertAdjacentElement('afterend', btn);
    });

    function openMarketplace() {
      if (document.getElementById('marketModal')) return;
      ensureItemImageStyles();

      const modal = document.createElement('div');
      modal.id = 'marketModal';
      modal.style.position = 'fixed';
      modal.style.top = '50%';
      modal.style.left = '50%';
      modal.style.transform = 'translate(-50%, -50%)';
      modal.style.outline = '2px solid rgba(0,0,0,0.6)';
      modal.style.background = 'rgb(48, 20, 10)';
      modal.style.color = '#fff';
      modal.style.padding = '20px 30px';
      modal.style.zIndex = '9999';
      modal.style.borderRadius = '8px';
      modal.style.border = '1px solid #210b03';
      modal.style.maxHeight = '70vh';
      modal.style.minWidth = '600px';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.overflow = 'hidden';

      const closeX = document.createElement('div');
      closeX.textContent = '✕';
      closeX.style.position = 'absolute';
      closeX.style.top = '10px';
      closeX.style.right = '15px';
      closeX.style.cursor = 'pointer';
      closeX.style.fontSize = '18px';
      closeX.style.zIndex = '10000';
      closeX.onclick = () => modal.remove();
      modal.appendChild(closeX);

      const tabsContainer = document.createElement('div');
      tabsContainer.style.display = 'flex';
      tabsContainer.style.borderBottom = '1px solid rgba(117, 99, 59, 0.57)';
      tabsContainer.style.marginBottom = '10px';
      tabsContainer.style.flexShrink = '0';

      const contentContainer = document.createElement('div');
      contentContainer.style.overflowY = 'auto';
      contentContainer.style.flexGrow = '1';
      contentContainer.style.margin = '0 -10px';
      contentContainer.style.padding = '0 10px';

      const tabContents = {};
      const tabButtons = {};

      const setActiveTab = (id) => {
          for (const tabId in tabContents) {
              tabContents[tabId].style.display = 'none';
              tabButtons[tabId].style.color = '#bbb';
              tabButtons[tabId].style.borderBottomColor = 'transparent';
              tabButtons[tabId].style.fontWeight = 'normal';
          }
          if (id === 'moje-nabidky' && !tabContents[id].dataset.loaded) {
              fetchAndDisplayMyOffers();
              tabContents[id].dataset.loaded = 'true';
          }
          if (id === 'moje-nakupy' && !tabContents[id].dataset.loaded) {
              fetchAndDisplayMyPurchases();
              tabContents[id].dataset.loaded = 'true';
          }
          if (id === 'trziste' && !tabContents[id].dataset.loaded) {
              const firstCategoryButton = trzisteContent.querySelector('button');
              if (firstCategoryButton) firstCategoryButton.click();
              tabContents[id].dataset.loaded = 'true';
          }
        tabContents[id].style.display = 'block';
        tabButtons[id].style.color = '#fff';
        tabButtons[id].style.borderBottomColor = '#fff';
        tabButtons[id].style.fontWeight = 'bold';
      };

      const createTab = (id, name) => {
        const button = document.createElement('button');
        button.textContent = name;
        button.dataset.tabId = id;
        button.style.padding = '8px 15px';
        button.style.border = 'none';
        button.style.background = 'transparent';
        button.style.color = '#bbb';
        button.style.cursor = 'pointer';
        button.style.borderBottom = '2px solid transparent';
        button.style.marginBottom = '-1px';
        button.style.outline = 'none';
        button.style.fontSize = '14px';
        button.onclick = () => setActiveTab(id);

        const content = document.createElement('div');
        content.id = `tab-content-${id}`;
        content.style.display = 'none';

        tabsContainer.appendChild(button);
        contentContainer.appendChild(content);
        tabContents[id] = content;
        tabButtons[id] = button;
      };

      createTab('prodat', 'Prodat');
      createTab('trziste', 'Tržiště');
      createTab('moje-nabidky', 'Moje nabídky');
      createTab('moje-nakupy', 'Moje nákupy');
      createTab('nastaveni', 'Nastavení');

      modal.appendChild(tabsContainer);
      modal.appendChild(contentContainer);

      // --- PRODAT CONTENT ---
      const prodatContent = tabContents['prodat'];
      const form = document.createElement('form');

      const toggleAllDiv = document.createElement('div');
      toggleAllDiv.style.marginBottom = '10px';
      const toggleAll = document.createElement('input');
      toggleAll.type = 'checkbox';
      toggleAll.id = 'toggleAll';
      const toggleAllLabel = document.createElement('label');
      toggleAllLabel.htmlFor = 'toggleAll';
      toggleAllLabel.textContent = ' Vybrat vše / Zrušit vše';
      toggleAllDiv.appendChild(toggleAll);
      toggleAllDiv.appendChild(toggleAllLabel);
      form.appendChild(toggleAllDiv);

      toggleAll.addEventListener('change', () => {
        form.querySelectorAll('input[type=checkbox][name=items]').forEach(cb => {
          cb.checked = toggleAll.checked;
        });
      });

      const items = getInventoryItems();

      items.forEach((item) => {
        const wrapper = document.createElement('div');
        wrapper.style.marginBottom = '10px';
        wrapper.style.marginTop = '10px';
        wrapper.style.padding = '0px 10px 10px 0px';
        wrapper.style.borderBottom = '1px solid rgba(117, 99, 59, 0.57)';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '10px';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = item.id;
        checkbox.name = 'items';
        wrapper.appendChild(checkbox);

        const imageContainer = document.createElement('div');
        imageContainer.style.flexShrink = '0';

        const lowerName = item.name.toLowerCase();
        const isScroll = lowerName.includes('svitek');
        const isMalefica = maleficaKeywords.some(keyword => lowerName.includes(keyword.toLowerCase()));

        if (item.itemClass && (isScroll || isMalefica)) {
            const itemImage = document.createElement('div');
            itemImage.className = item.itemClass;
            imageContainer.appendChild(itemImage);
        }
        wrapper.appendChild(imageContainer);

        const label = document.createElement('div');
        label.style.flexGrow = '1';
        label.style.display = 'flex';
        label.style.flexDirection = 'column';

        const nameWrapper = document.createElement('div');
        nameWrapper.style.display = 'flex';
        nameWrapper.style.alignItems = 'center';

        const name = document.createElement('div');
        name.textContent = item.name;
        name.style.fontWeight = 'bold';
        name.style.fontSize = '14px';
        name.style.color = item.color || "#07ea03";
        name.style.textShadow = '0 0 2px #000';
        name.style.marginRight = '8px';

        if (item.isScrollUsable !== null) {
          const scrollIcon = document.createElement('span');
          scrollIcon.style.fontSize = '16px';
          scrollIcon.style.fontWeight = 'bold';
          if (item.isScrollUsable) {
            scrollIcon.textContent = '✓ ';
            scrollIcon.style.color = '#0f0';
            scrollIcon.title = 'Použitelný svitek';
          } else {
            scrollIcon.textContent = '✗ ';
            scrollIcon.style.color = '#f00';
            scrollIcon.title = 'Nepoužitelný svitek';
          }
          nameWrapper.appendChild(scrollIcon);
        }

        const info = document.createElement('div');
        const formattedPrice = formatPrice(item.price);
        info.innerHTML = `<span style="font-size: 12px; font-weight: 300; color: #bbb">Lvl ${item.level} – ${formattedPrice} <img alt="" src="//gf3.geo.gfsrv.net/cdn6b/71e68d38f81ee6f96a618f33c672e0.gif" align="absmiddle" border="0"></span>`;

        const inputsContainer = document.createElement('div');
        inputsContainer.style.display = 'flex';
        inputsContainer.style.gap = '5px';
        inputsContainer.style.marginLeft = '10px';

        const amountInput = document.createElement('input');
        amountInput.type = 'number';
        amountInput.name = `amount_${item.id}`;
        amountInput.placeholder = 'Množství';
        amountInput.title = 'Množství (defaultně 1)';
        amountInput.min = '1';
        amountInput.style.width = '60px';

        const priceInput = document.createElement('input');
        priceInput.type = 'number';
        priceInput.name = `customPrice_${item.id}`;
        priceInput.placeholder = 'Cena';
        priceInput.style.width = '70px';

        inputsContainer.appendChild(amountInput);
        inputsContainer.appendChild(priceInput);

        nameWrapper.appendChild(name);
        label.appendChild(nameWrapper);
        label.appendChild(info);
        wrapper.appendChild(label);
        wrapper.appendChild(inputsContainer);
        form.appendChild(wrapper);
      });

      const submit = document.createElement('button');
      submit.textContent = 'Odeslat';
      submit.type = 'submit';
      submit.className = 'expedition_button awesome-button';
      form.appendChild(submit);

      form.onsubmit = async (e) => {
        e.preventDefault();
        const userId = getUserId();
        const selected = Array.from(form.elements['items'])
          .filter(el => el.checked)
          .map(el => {
            const itemData = items.find(item => item.id === el.value);
            const customPrice = form.elements[`customPrice_${el.value}`]?.value;
            const amountValue = form.elements[`amount_${el.value}`]?.value;
            const amount = (amountValue && parseInt(amountValue, 10) > 0) ? parseInt(amountValue, 10) : 1;

            return {
              id: el.value,
              name: itemData.name,
              level: itemData.level,
              itemClass: itemData.itemClass,
              price: itemData.price,
              customPrice: customPrice || itemData.price,
              standardPrice: itemData.price,
              color: itemData.color,
              stats: itemData.stats,
              isScrollUsable: itemData.isScrollUsable,
              amount: amount
            };
          });

        const data = { playerId: userId || "unknown", selectedItems: selected };

        GM_xmlhttpRequest({
          method: "POST",
          url: "https://lz.clans.pro/api/marketplace",
          headers: { "Content-Type": "application/json" },
          data: JSON.stringify(data),
          onload: function(response) {
            if (response.status === 200) {
              alert('Úspěšně odesláno!');
              modal.remove();
            } else {
              alert('Chyba při odesílání: ' + response.statusText);
            }
          },
          onerror: function(error) {
            console.error('Error:', error);
            alert('Chyba při odesílání požadavku');
          }
        });
      };

      prodatContent.appendChild(form);

      // --- TRZISTE CONTENT ---
      const trzisteContent = tabContents['trziste'];
      trzisteContent.style.display = 'flex';
      trzisteContent.style.flexDirection = 'column';

      const subMenuContainer = document.createElement('div');
      subMenuContainer.style.display = 'flex';
      subMenuContainer.style.gap = '10px';
      subMenuContainer.style.marginBottom = '15px';
      subMenuContainer.style.flexShrink = '0';

      const offerListContainer = document.createElement('div');
      offerListContainer.id = 'offer-list-container';
      offerListContainer.style.flexGrow = '1';

      trzisteContent.appendChild(subMenuContainer);
      trzisteContent.appendChild(offerListContainer);

      const displayOffers = (offers) => {
          offerListContainer.innerHTML = '';
          const buyerId = getUserId();

          if (!offers || offers.length === 0) {
              offerListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">V této kategorii nejsou žádné nabídky.</p>';
              return;
          }

          offers.forEach(item => {
              const wrapper = document.createElement('div');
              wrapper.style.padding = '10px';
              wrapper.style.borderBottom = '1px solid rgba(117, 99, 59, 0.57)';
              wrapper.style.display = 'flex';
              wrapper.style.alignItems = 'center';
              wrapper.style.gap = '10px';

              const imageContainer = document.createElement('div');
              imageContainer.style.flexShrink = '0';

              const itemCategoriesWithImages = ['material', 'malefica', 'scroll'];
              if (item.itemClass && itemCategoriesWithImages.includes(item.category)) {
                  const itemImage = document.createElement('div');
                  itemImage.className = item.itemClass;
                  imageContainer.appendChild(itemImage);
              }
              wrapper.appendChild(imageContainer);

              const contentWrapper = document.createElement('div');
              contentWrapper.style.flexGrow = '1';
              contentWrapper.style.display = 'flex';
              contentWrapper.style.flexDirection = 'column';

              const name = document.createElement('div');
              const displayName = (item.amount && item.amount > 1) ? `${item.amount}x ${item.name}` : item.name;
              name.textContent = displayName;
              name.style.fontWeight = 'bold';
              name.style.fontSize = '14px';
              name.style.color = item.color || "#07ea03";
              name.style.textShadow = '0 0 2px #000';

              const detailsWrapper = document.createElement('div');
              detailsWrapper.style.display = 'flex';
              detailsWrapper.style.justifyContent = 'space-between';
              detailsWrapper.style.alignItems = 'center';
              detailsWrapper.style.fontSize = '12px';
              detailsWrapper.style.color = '#bbb';

              const sellerAndLevelInfo = document.createElement('div');
              sellerAndLevelInfo.innerHTML = `Lvl ${item.level} • Prodejce: <span style="color: #fff; font-weight: bold;">${item.playerId}</span>`;

              const priceInfo = document.createElement('div');
              const formattedPrice = formatPrice(item.customPrice);
              priceInfo.innerHTML = `<span style="font-weight: bold; font-size: 13px; color: #fff;">${formattedPrice}</span> <img alt="Zlato" src="//gf3.geo.gfsrv.net/cdn6b/71e68d38f81ee6f96a618f33c672e0.gif" align="absmiddle" border="0" style="margin-bottom: 2px;">`;

              detailsWrapper.appendChild(sellerAndLevelInfo);
              detailsWrapper.appendChild(priceInfo);

              contentWrapper.appendChild(name);
              contentWrapper.appendChild(detailsWrapper);
              wrapper.appendChild(contentWrapper);

              const buyButton = document.createElement('button');
              buyButton.textContent = 'Koupit';
              buyButton.className = 'expedition_button awesome-button';
              buyButton.style.marginLeft = '10px';
              buyButton.style.flexShrink = '0';
              buyButton.onclick = () => {
                  buyButton.disabled = true;
                  buyButton.textContent = 'Rezervuji...';

                  GM_xmlhttpRequest({
                      method: "POST",
                      url: "https://lz.clans.pro/api/sell",
                      headers: { "Content-Type": "application/json" },
                      data: JSON.stringify({ buyerId: buyerId, itemId: item._id }),
                      onload: function(response) {
                          if (response.status === 200) {
                              buyButton.textContent = 'Rezervováno';
                              wrapper.style.opacity = '0.5';
                          } else {
                              try {
                                  const errorResponse = JSON.parse(response.responseText);
                                  alert(`Chyba při nákupu: ${errorResponse.error || response.statusText}`);
                              } catch (e) {
                                  alert(`Chyba při nákupu: ${response.statusText}`);
                              }
                              buyButton.textContent = 'Koupit';
                              buyButton.disabled = false;
                          }
                      },
                      onerror: function(error) {
                          console.error('Chyba sítě při nákupu:', error);
                          alert('Chyba sítě při nákupu.');
                          buyButton.textContent = 'Koupit';
                          buyButton.disabled = false;
                      }
                  });
              };

              wrapper.appendChild(buyButton);
              offerListContainer.appendChild(wrapper);
          });
      };

      const fetchAndDisplayOffers = (category) => {
          offerListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Načítání nabídek...</p>';
          GM_xmlhttpRequest({
              method: "GET",
              url: `https://lz.clans.pro/api/offers?category=${category}`,
              onload: function(response) {
                  if (response.status === 200) {
                      try {
                          const offers = JSON.parse(response.responseText);
                          displayOffers(offers);
                      } catch (e) {
                          offerListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Nepodařilo se zpracovat data z tržiště.</p>';
                      }
                  } else {
                      offerListContainer.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Chyba ${response.status} při načítání dat.</p>`;
                  }
              },
              onerror: function(error) {
                  offerListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Chyba sítě při načítání dat.</p>';
              }
          });
      };

      const categories = { 'scroll': 'Svitky', 'material': 'Suroviny', 'malefica': 'Malefica', 'other': 'Ostatní' };
      let activeSubMenuButton = null;

      const createSubMenuButton = (id, name) => {
          const button = document.createElement('button');
          button.textContent = name;
          button.className = 'expedition_button awesome-button';
          button.style.background = '#412D18';
          button.style.opacity = '0.7';
          button.style.color = "#E9D2A0";

          button.onclick = () => {
              if (activeSubMenuButton) {
                  activeSubMenuButton.style.opacity = '0.7';
              }
              button.style.opacity = '1';
              activeSubMenuButton = button;
              fetchAndDisplayOffers(id);
          };
          subMenuContainer.appendChild(button);
      };

      for (const catId in categories) {
          createSubMenuButton(catId, categories[catId]);
      }

      // --- MOJE NABIDKY CONTENT ---
      const mojeNabidkyContent = tabContents['moje-nabidky'];
      const myOffersListContainer = document.createElement('div');
      myOffersListContainer.id = 'my-offers-list-container';
      mojeNabidkyContent.appendChild(myOffersListContainer);

      const markAsSold = (itemId) => {
          const sellerId = getUserId();
          console.log('Označuji jako prodáno:', { itemId, sellerId }); // Debug log
          GM_xmlhttpRequest({
              method: "PATCH",
              url: `https://lz.clans.pro/api/marketplace/${itemId}/sold`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify({ sellerId: sellerId }),
              onload: function(response) {
                  console.log('Odpověď serveru:', response.status, response.responseText); // Debug log
                  if (response.status === 200) {
                      alert('Předmět označen jako prodaný.');
                      fetchAndDisplayMyOffers();
                  } else {
                      try {
                          const errorResponse = JSON.parse(response.responseText);
                          alert(`Chyba při označování předmětu: ${errorResponse.error || response.statusText}`);
                      } catch (e) {
                          alert(`Chyba při označování předmětu: ${response.statusText}`);
                      }
                  }
              },
              onerror: function(error) {
                  console.error('Chyba sítě při označování předmětu:', error);
                  alert('Chyba sítě při označování předmětu.');
              }
          });
      };

      const deleteOffer = (itemId, onSuccessCallback) => {
          const playerId = getUserId();
          GM_xmlhttpRequest({
              method: "DELETE",
              url: `https://lz.clans.pro/api/marketplace/${itemId}`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify({ playerId: playerId }),
              onload: function(response) {
                  if (response.status === 200) {
                      if (onSuccessCallback) onSuccessCallback();
                  } else {
                      alert(`Chyba při provádění operace: ${response.statusText}`);
                  }
              },
              onerror: function(error) {
                  console.error('Chyba sítě při operaci:', error);
                  alert('Chyba sítě při provádění operace.');
              }
          });
      };

      const deletePurchase = (itemId, onSuccessCallback) => {
          const buyerId = getUserId();
          console.log('Mažu nákup:', { itemId, buyerId }); // Debug log
          GM_xmlhttpRequest({
              method: "DELETE",
              url: `https://lz.clans.pro/api/purchase/${itemId}`,
              headers: { "Content-Type": "application/json" },
              data: JSON.stringify({ buyerId: buyerId }),
              onload: function(response) {
                  console.log('Odpověď serveru při mazání nákupu:', response.status, response.responseText); // Debug log
                  if (response.status === 200) {
                      if (onSuccessCallback) onSuccessCallback();
                  } else {
                      try {
                          const errorResponse = JSON.parse(response.responseText);
                          alert(`Chyba při mazání nákupu: ${errorResponse.error || response.statusText}`);
                      } catch (e) {
                          alert(`Chyba při mazání nákupu: ${response.statusText}`);
                      }
                  }
              },
              onerror: function(error) {
                  console.error('Chyba sítě při mazání nákupu:', error);
                  alert('Chyba sítě při mazání nákupu.');
              }
          });
      };

      const displayMyOffers = (offers) => {
          myOffersListContainer.innerHTML = '';
          if (!offers || offers.length === 0) {
              myOffersListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Nemáte žádné aktivní nabídky.</p>';
              return;
          }

          offers.sort((a, b) => {
              if (a.status === 'reserved' && b.status !== 'reserved') return -1;
              if (a.status !== 'reserved' && b.status === 'reserved') return 1;
              return new Date(b.createdAt) - new Date(a.createdAt);
          });

          offers.forEach(item => {
              const wrapper = document.createElement('div');
              wrapper.style.marginBottom = '10px';
              wrapper.style.marginTop = '10px';
              wrapper.style.padding = '10px';
              wrapper.style.borderBottom = '1px solid rgba(117, 99, 59, 0.57)';
              wrapper.style.display = 'flex';
              wrapper.style.alignItems = 'center';
              wrapper.style.gap = '10px';

              if (item.status === 'reserved') {
                  wrapper.style.background = 'rgba(255, 215, 0, 0.15)';
                  wrapper.style.borderLeft = '3px solid #ffd700';
              }

              const imageContainer = document.createElement('div');
              imageContainer.style.flexShrink = '0';

              const itemCategoriesWithImages = ['material', 'malefica', 'scroll'];
              if (item.itemClass && itemCategoriesWithImages.includes(item.category)) {
                  const itemImage = document.createElement('div');
                  itemImage.className = item.itemClass;
                  imageContainer.appendChild(itemImage);
              }
              wrapper.appendChild(imageContainer);

              const label = document.createElement('div');
              label.style.flexGrow = '1';
              label.style.display = 'flex';
              label.style.flexDirection = 'column';

              const name = document.createElement('div');
              const displayName = (item.amount && item.amount > 1) ? `${item.amount}x ${item.name}` : item.name;
              name.textContent = displayName;
              name.style.fontWeight = 'bold';
              name.style.color = item.color || '#fff';

              const priceInfo = document.createElement('div');
              priceInfo.innerHTML = `<span style="font-size: 12px; font-weight: 300; color: #bbb">Cena: ${item.customPrice} <img alt="" src="//gf3.geo.gfsrv.net/cdn6b/71e68d38f81ee6f96a618f33c672e0.gif" align="absmiddle" border="0"></span>`;

              const statusInfo = document.createElement('div');
              statusInfo.style.fontSize = '11px';
              statusInfo.style.marginTop = '4px';

              label.appendChild(name);
              label.appendChild(priceInfo);
              if (item.status === 'reserved') {
                  statusInfo.innerHTML = `<span style="color: #ffd700;">Rezervováno pro: ${item.buyerId || '??'}</span>`;
                  label.appendChild(statusInfo);
              }
              wrapper.appendChild(label);

              const buttonsContainer = document.createElement('div');
              buttonsContainer.style.display = 'flex';
              buttonsContainer.style.gap = '5px';
              buttonsContainer.style.marginLeft = '10px';

              if (item.status === 'active') {
                  const cancelButton = document.createElement('button');
                  cancelButton.textContent = 'Zrušit';
                  cancelButton.className = 'expedition_button awesome-button';
                  cancelButton.onclick = () => {
                      if (confirm(`Opravdu chcete zrušit nabídku pro "${displayName}"?`)) {
                          cancelButton.disabled = true;
                          cancelButton.textContent = 'Ruším...';
                          deleteOffer(item._id, () => { alert('Nabídka byla zrušena.'); fetchAndDisplayMyOffers(); });
                      }
                  };
                  buttonsContainer.appendChild(cancelButton);
              }

              if (item.status === 'reserved') {
                  const soldButton = document.createElement('button');
                  soldButton.textContent = 'Prodáno';
                  soldButton.className = 'expedition_button awesome-button';
                  soldButton.style.background = 'linear-gradient(to bottom, #D47777, #A64040)';
                  soldButton.style.color = '#451111';
                  soldButton.style.border = '1px solid #E9A0A0';
                  soldButton.onclick = () => {
                      if (confirm(`Potvrdit prodej položky "${displayName}" hráči ${item.buyerId}?`)) {
                          soldButton.disabled = true;
                          soldButton.textContent = 'Ukládám...';
                          markAsSold(item._id);
                      }
                  };
                  buttonsContainer.appendChild(soldButton);
              }

              wrapper.appendChild(buttonsContainer);
              myOffersListContainer.appendChild(wrapper);
          });
      };

      const fetchAndDisplayMyOffers = () => {
          myOffersListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Načítání vašich nabídek...</p>';
          const playerId = getUserId();
          if (!playerId) {
              myOffersListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">ID hráče nebylo nalezeno.</p>';
              return;
          }
          GM_xmlhttpRequest({
              method: "GET",
              url: `https://lz.clans.pro/api/my-offers/${playerId}`,
              onload: function(response) {
                  if (response.status === 200) {
                      try {
                          const offers = JSON.parse(response.responseText);
                          displayMyOffers(offers);
                      } catch (e) {
                          console.error("Chyba při parsování odpovědi z mých nabídek:", e);
                          myOffersListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Nepodařilo se zpracovat data.</p>';
                      }
                  } else {
                      console.error('Chyba při načítání mých nabídek: ', response.status, response.responseText);
                      myOffersListContainer.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Chyba ${response.status} při načítání dat.</p>`;
                  }
              },
              onerror: function(error) {
                  console.error('Chyba síťového požadavku na mé nabídky:', error);
                  myOffersListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Chyba sítě při načítání dat.</p>';
              }
          });
      };

      // --- MOJE NAKUPY CONTENT ---
      const mojeNakupyContent = tabContents['moje-nakupy'];
      const myPurchasesListContainer = document.createElement('div');
      myPurchasesListContainer.id = 'my-purchases-list-container';
      mojeNakupyContent.appendChild(myPurchasesListContainer);

      const displayMyPurchases = (purchases) => {
          myPurchasesListContainer.innerHTML = '';
          if (!purchases || purchases.length === 0) {
              myPurchasesListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Zatím nemáte žádné nákupy.</p>';
              return;
          }

          purchases.sort((a, b) => {
              if (a.status === 'sold' && b.status !== 'sold') return -1;
              if (a.status !== 'sold' && b.status === 'sold') return 1;
              return new Date(b.updatedAt) - new Date(a.updatedAt);
          });

          purchases.forEach(item => {
              const wrapper = document.createElement('div');
              wrapper.style.padding = '10px';
              wrapper.style.borderBottom = '1px solid rgba(117, 99, 59, 0.57)';
              wrapper.style.display = 'flex';
              wrapper.style.alignItems = 'center';
              wrapper.style.gap = '10px';

              const imageContainer = document.createElement('div');
              imageContainer.style.flexShrink = '0';

              const itemCategoriesWithImages = ['material', 'malefica', 'scroll'];
              if (item.itemClass && itemCategoriesWithImages.includes(item.category)) {
                  const itemImage = document.createElement('div');
                  itemImage.className = item.itemClass;
                  imageContainer.appendChild(itemImage);
              }
              wrapper.appendChild(imageContainer);

              const contentWrapper = document.createElement('div');
              contentWrapper.style.flexGrow = '1';
              contentWrapper.style.display = 'flex';
              contentWrapper.style.flexDirection = 'column';

              const name = document.createElement('div');
              const displayName = (item.amount && item.amount > 1) ? `${item.amount}x ${item.name}` : item.name;
              name.textContent = displayName;
              name.style.fontWeight = 'bold';
              name.style.color = item.color || '#fff';

              const priceInfo = document.createElement('div');
              const formattedPrice = formatPrice(item.customPrice);
              priceInfo.innerHTML = `<span style="font-size: 12px; font-weight: 300; color: #bbb">Cena: ${formattedPrice} <img alt="" src="//gf3.geo.gfsrv.net/cdn6b/71e68d38f81ee6f96a618f33c672e0.gif" align="absmiddle" border="0"></span>`;

              const sellerInfo = document.createElement('div');
              sellerInfo.innerHTML = `<span style="font-size: 11px; color: #ddd;">Prodejce: ${item.playerId}</span>`;
              sellerInfo.style.marginTop = '4px';

              contentWrapper.appendChild(name);
              contentWrapper.appendChild(priceInfo);
              contentWrapper.appendChild(sellerInfo);

              const statusContainer = document.createElement('div');
              statusContainer.style.display = 'flex';
              statusContainer.style.flexDirection = 'column';
              statusContainer.style.alignItems = 'flex-end';
              statusContainer.style.gap = '5px';

              const statusText = document.createElement('span');
              statusText.style.fontSize = '11px';

              if (item.status === 'sold') {
                  wrapper.style.background = 'rgba(70, 130, 20, 0.15)';
                  wrapper.style.borderLeft = '3px solid #468214';
                  statusText.textContent = 'Čeká na vyzvednutí';
                  statusText.style.color = '#6ab04c';

                  const acceptButton = document.createElement('button');
                  acceptButton.textContent = 'Koupeno';
                  acceptButton.className = 'expedition_button awesome-button';
                  acceptButton.onclick = () => {
                      if (confirm(`Opravdu chcete potvrdit převzetí a odstranit položku "${displayName}" z historie?`)) {
                          acceptButton.disabled = true;
                          acceptButton.textContent = 'Mažu...';
                          deletePurchase(item._id, fetchAndDisplayMyPurchases);
                      }
                  };
                  statusContainer.appendChild(acceptButton);

              } else {
                  statusText.textContent = 'Rezervováno';
                  statusText.style.color = '#ffd700';
              }

              statusContainer.insertBefore(statusText, statusContainer.firstChild);

              wrapper.appendChild(contentWrapper);
              wrapper.appendChild(statusContainer);
              myPurchasesListContainer.appendChild(wrapper);
          });
      };

      const fetchAndDisplayMyPurchases = () => {
          myPurchasesListContainer.innerHTML = '<p style="text-align: center; padding: 20px;">Načítání vašich nákupů...</p>';
          const buyerId = getUserId();
          if (!buyerId) {
              myPurchasesListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">ID hráče nebylo nalezeno.</p>';
              return;
          }
          GM_xmlhttpRequest({
              method: "GET",
              url: `https://lz.clans.pro/api/my-purchases/${buyerId}`,
              onload: function(response) {
                  if (response.status === 200) {
                      try {
                          const purchases = JSON.parse(response.responseText);
                          displayMyPurchases(purchases);
                      } catch (e) {
                          console.error("Chyba při parsování odpovědi z mých nákupů:", e);
                          myPurchasesListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Nepodařilo se zpracovat data.</p>';
                      }
                  } else {
                      console.error('Chyba při načítání mých nákupů: ', response.status, response.responseText);
                      myPurchasesListContainer.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Chyba ${response.status} při načítání dat.</p>`;
                  }
              },
              onerror: function(error) {
                  console.error('Chyba síťového požadavku na mé nákupy:', error);
                  myPurchasesListContainer.innerHTML = '<p style="text-align: center; color: red; padding: 20px;">Chyba sítě při načítání dat.</p>';
              }
          });
      };

      // --- NASTAVENI CONTENT ---
      const nastaveniContent = tabContents['nastaveni'];
      nastaveniContent.style.padding = '20px';

      const settingsTitle = document.createElement('h3');
      settingsTitle.textContent = 'Nastavení addonu';
      settingsTitle.style.marginTop = '0';
      settingsTitle.style.marginBottom = '20px';
      settingsTitle.style.color = '#fff';
      nastaveniContent.appendChild(settingsTitle);

      const settings = loadSettings();

      const scrollSearcherSetting = document.createElement('div');
      scrollSearcherSetting.style.display = 'flex';
      scrollSearcherSetting.style.alignItems = 'center';
      scrollSearcherSetting.style.gap = '10px';

      const scrollSearcherCheckbox = document.createElement('input');
      scrollSearcherCheckbox.type = 'checkbox';
      scrollSearcherCheckbox.id = 'scrollSearcherToggle';
      scrollSearcherCheckbox.checked = settings.showScrollSearcher;
      scrollSearcherCheckbox.style.transform = 'scale(1.2)';

      const scrollSearcherLabel = document.createElement('label');
      scrollSearcherLabel.htmlFor = 'scrollSearcherToggle';
      scrollSearcherLabel.textContent = 'Zobrazit vyhledávač scrollů v menu';
      scrollSearcherLabel.style.color = '#fff';
      scrollSearcherLabel.style.fontSize = '14px';
      scrollSearcherLabel.style.cursor = 'pointer';

      const scrollSearcherDescription = document.createElement('div');
      scrollSearcherDescription.textContent = 'Zobrazuje vyhledávací pole s našeptáváním použitelných scrollů v hlavním menu hry.';
      scrollSearcherDescription.style.fontSize = '12px';
      scrollSearcherDescription.style.color = '#bbb';
      scrollSearcherDescription.style.marginTop = '5px';
      scrollSearcherDescription.style.marginLeft = '30px';

      scrollSearcherSetting.appendChild(scrollSearcherCheckbox);
      scrollSearcherSetting.appendChild(scrollSearcherLabel);
      nastaveniContent.appendChild(scrollSearcherSetting);
      nastaveniContent.appendChild(scrollSearcherDescription);

      scrollSearcherCheckbox.addEventListener('change', () => {
          const newSettings = { ...settings, showScrollSearcher: scrollSearcherCheckbox.checked };
          saveSettings(newSettings);

          if (scrollSearcherCheckbox.checked) {
              createScrollSearcher();
          } else {
              removeScrollSearcher();
          }

          const changeInfo = document.createElement('div');
          changeInfo.textContent = scrollSearcherCheckbox.checked ?
              '✓ Vyhledávač scrollů byl zobrazen' :
              '✓ Vyhledávač scrollů byl skryt';
          changeInfo.style.color = '#0f0';
          changeInfo.style.fontSize = '12px';
          changeInfo.style.marginTop = '10px';
          changeInfo.style.marginLeft = '30px';

          const existingInfo = nastaveniContent.querySelector('.change-info');
          if (existingInfo) existingInfo.remove();

          changeInfo.className = 'change-info';
          nastaveniContent.appendChild(changeInfo);

          setTimeout(() => {
              if (changeInfo.parentNode) {
                  changeInfo.remove();
              }
          }, 3000);
      });

      setActiveTab('prodat');

      document.body.appendChild(modal);
    }
  })();

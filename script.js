// script.js

document.addEventListener('DOMContentLoaded', () => {
    // This script should only run on app.html. If it's another page, do nothing.
    if (!document.getElementById('phone-container')) {
        return;
    }

    const dom = {
        phoneContainer: document.getElementById('phone-container'),
        // Screens
        homeScreen: document.getElementById('home-screen'),
        myDashboardScreen: document.getElementById('my-dashboard-screen'),
        characterDetailScreen: document.getElementById('character-detail-screen'),
        characterEditScreen: document.getElementById('character-edit-screen'),
        chatScreen: document.getElementById('chat-screen'),
        profileSettingsScreen: document.getElementById('profile-settings-screen'),
        apiSettingsScreen: document.getElementById('api-settings-screen'),
        apiSettingsForm: document.getElementById('api-settings-form'), // Modified
        backgroundSettingsScreen: document.getElementById('background-settings-screen'),
        promptsScreen: document.getElementById('prompts-screen'),
        spaceScreen: document.getElementById('space-screen'),

        // Home Screen
        characterList: document.getElementById('character-list'),
        addCharacterBtn: document.getElementById('add-character-btn'),
        menuBtn: document.getElementById('menu-btn'),
        dropdownMenu: document.getElementById('dropdown-menu'),
        batchDeleteHeader: document.getElementById('batch-delete-header'),
        batchDeleteFooter: document.getElementById('batch-delete-footer'),
        deleteSelectedBtn: document.getElementById('delete-selected-btn'),
        cancelDeleteBtn: document.getElementById('cancel-delete-btn'),

        // Character Detail Screen
        detailAvatar: document.getElementById('detail-avatar'),
        detailName: document.getElementById('detail-name'),
        goToChatBtn: document.getElementById('go-to-chat-btn'),
        goToEditBtn: document.getElementById('go-to-edit-btn'),

        // Character Edit Screen
        characterEditForm: document.getElementById('character-edit-form'),
        
        // Chat Screen
        chatHeaderTitle: document.getElementById('chat-header-title'),
        chatHistory: document.getElementById('chat-history'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        
        // 悬浮球 (FAB)
        fabWrapper: document.getElementById('fab-wrapper'),
        fabToggleBtn: document.getElementById('fab-toggle-btn'),
        fabPanelContainer: document.getElementById('fab-panel-container'),
    };

    let characters = [];
    let apiConfig = {}; // Modified
    let activeCharacterId = null;
    let isBatchDeleteMode = false;
    let screenHistory = [];

    // --- Data Management ---
    const saveCharacters = () => localStorage.setItem('aiChatCharacters', JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem('aiChatCharacters');
        characters = saved ? JSON.parse(saved) : [{ id: Date.now(), name: 'Helpful Assistant', subtitle: 'Your default AI companion.', setting: 'You are a helpful assistant.', avatar: '', history: [] }];
        if (!saved) saveCharacters();
        activeCharacterId = parseInt(sessionStorage.getItem('activeCharacterId')) || null;
    };

    // --- API Config Management (NEW) ---
    const loadApiConfig = () => {
        const saved = localStorage.getItem('aiChatApiConfig');
        if (saved) {
            // 如果有保存的配置，则加载它
            apiConfig = JSON.parse(saved);
        } else {
            // 否则，使用 config.js 中的默认配置 (进行深拷贝以防意外修改)
            apiConfig = JSON.parse(JSON.stringify(DEFAULT_API_CONFIG));
        }
    };

    const saveApiConfig = () => {
        localStorage.setItem('aiChatApiConfig', JSON.stringify(apiConfig));
        alert('API 设置已保存！');
    };

    // --- Rendering ---
    const renderApiSettingsForm = () => {
        // 获取当前选定的服务商配置，例如 'openai'
        const currentProvider = apiConfig.provider;
        const config = apiConfig[currentProvider];

        dom.apiSettingsForm.innerHTML = `
            <div class="form-group">
                <label for="api-base-url">API Base URL</label>
                <input type="text" id="api-base-url" value="${config.baseUrl || ''}" placeholder="例如: https://api.openai.com/v1">
            </div>
            <div class="form-group">
                <label for="api-key">API Key</label>
                <input type="password" id="api-key" value="${config.apiKey || ''}" placeholder="请输入您的 API Key">
            </div>
            <div class="form-group">
                <label for="api-model">Model</label>
                <input type="text" id="api-model" value="${config.model || ''}" placeholder="例如: gpt-3.5-turbo">
            </div>
            <div class="btn-group">
                <button type="submit" class="action-button btn-primary">保存设置</button>
            </div>
        `;
    };

    const renderCharacterList = () => {
        dom.characterList.innerHTML = '';
        characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'character-card';
            item.dataset.id = char.id;
            let content = `<img src="${char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'}" alt="Avatar"><div class="character-info"><div class="name">${char.name}</div><div class="subtitle">${char.subtitle || ''}</div><div class="meta"><span>💬</span><span>${char.history ? char.history.length : 0}</span></div></div>`;
            if (isBatchDeleteMode) {
                item.classList.add('batch-delete-item');
                content = `<input type="checkbox" class="batch-delete-checkbox" data-id="${char.id}">${content}`;
            } else {
                item.addEventListener('click', () => { 
                    activeCharacterId = char.id; 
                    sessionStorage.setItem('activeCharacterId', activeCharacterId);
                    showScreen('characterDetail'); 
                });
            }
            item.innerHTML = content;
            dom.characterList.appendChild(item);
        });
    };
    
    // --- Navigation & State ---
    const showScreen = (screenName) => {
        if (!screenName) return;
        
        if (isBatchDeleteMode && screenName !== 'home') exitBatchDeleteMode();
        
        const currentScreen = screenHistory.length > 0 ? screenHistory[screenHistory.length - 1] : null;
        if (screenName !== currentScreen) {
            screenHistory.push(screenName);
            if (screenHistory.length > 10) screenHistory.shift();
        }

        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        
        const screenMap = {
            home: dom.homeScreen, myDashboard: dom.myDashboardScreen, characterDetail: dom.characterDetailScreen,
            characterEdit: dom.characterEditScreen, chat: dom.chatScreen, apiSettings: dom.apiSettingsScreen,
            profileSettings: dom.profileSettingsScreen, backgroundSettings: dom.backgroundSettingsScreen,
            prompts: dom.promptsScreen, space: dom.spaceScreen
        };
        if (screenMap[screenName]) screenMap[screenName].classList.remove('hidden');
        if (screenName === 'home') renderCharacterList();
        
        // Modified
        if (screenName === 'apiSettings') {
            renderApiSettingsForm();
        }
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop();
            const previousScreen = screenHistory[screenHistory.length - 1];
            // 直接显示上一个屏幕，不再次推入历史记录
            document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
            const screenElement = document.getElementById(`${previousScreen}-screen`);
            if (screenElement) {
                screenElement.classList.remove('hidden');
            }
        }
    };

    // --- Batch Delete Mode ---
    const enterBatchDeleteMode = () => { isBatchDeleteMode = true; dom.homeScreen.classList.add('batch-delete-active'); renderCharacterList(); };
    const exitBatchDeleteMode = () => { isBatchDeleteMode = false; dom.homeScreen.classList.remove('batch-delete-active'); renderCharacterList(); };

    // --- Event Listeners ---
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', goBack);
    });
    
    // --- Draggable FAB & Panel Logic (FIXED) ---
    let isDragging = false;
    let wasDragged = false;
    let startX, startY;
    let initialFabX, initialFabY;
    const dragThreshold = 5;

    const onPointerDown = (e) => {
        if (e.target.closest('.panel-button')) return;
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        
        isDragging = true;
        wasDragged = false;
        
        const currentPointer = e.touches ? e.touches[0] : e;
        startX = currentPointer.clientX;
        startY = currentPointer.clientY;
        
        const fabRect = dom.fabWrapper.getBoundingClientRect();
        const containerRect = dom.phoneContainer.getBoundingClientRect();
        initialFabX = fabRect.left - containerRect.left;
        initialFabY = fabRect.top - containerRect.top;

        dom.fabWrapper.classList.add('dragging');
        e.preventDefault();

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const currentPointer = e.touches ? e.touches[0] : e;
        const dx = currentPointer.clientX - startX;
        const dy = currentPointer.clientY - startY;

        if (!wasDragged && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
            wasDragged = true;
            dom.fabPanelContainer.classList.add('hidden');
        }
        
        if (wasDragged) {
            let newX = initialFabX + dx;
            let newY = initialFabY + dy;

            const containerRect = dom.phoneContainer.getBoundingClientRect();
            const fabRect = dom.fabWrapper.getBoundingClientRect();
            
            newX = Math.max(0, Math.min(newX, containerRect.width - fabRect.width));
            newY = Math.max(0, Math.min(newY, containerRect.height - fabRect.height));

            dom.fabWrapper.style.left = `${newX}px`;
            dom.fabWrapper.style.top = `${newY}px`;
            dom.fabWrapper.style.right = 'auto';
            dom.fabWrapper.style.bottom = 'auto';
        }
    };

    const onPointerUp = () => {
        if (!isDragging) return;
        isDragging = false;

        dom.fabWrapper.classList.remove('dragging');
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        if (wasDragged) {
            const containerWidth = dom.phoneContainer.clientWidth;
            const fabCenter = dom.fabWrapper.offsetLeft + dom.fabWrapper.offsetWidth / 2;
            dom.fabWrapper.style.left = (fabCenter < containerWidth / 2) ? '20px' : 'auto';
            dom.fabWrapper.style.right = (fabCenter < containerWidth / 2) ? 'auto' : '20px';
        } else {
            // Click action: Toggle panel
            const panel = dom.fabPanelContainer;
            const isHidden = panel.classList.toggle('hidden');
            if (!isHidden) {
                const fabRect = dom.fabWrapper.getBoundingClientRect();
                const panelRect = panel.getBoundingClientRect();
                panel.style.left = `${fabRect.width / 2 - panelRect.width / 2}px`;
                panel.style.top = `${fabRect.height / 2 - panelRect.height / 2}px`;
            }
        }
    };

    dom.fabWrapper.addEventListener('pointerdown', onPointerDown);

    dom.fabPanelContainer.addEventListener('click', (e) => {
        const button = e.target.closest('.panel-button');
        if (!button) return;
        
        const targetScreen = button.dataset.targetScreen;
        const action = button.dataset.action;

        if (targetScreen) {
            showScreen(targetScreen);
        } else if (action === 'back') {
            goBack();
        } else {
            alert('该功能正在快马加鞭地开发中...');
        }
        
        dom.fabPanelContainer.classList.add('hidden');
    });

    // Other listeners (Home Screen)
    dom.menuBtn.addEventListener('click', (e) => { e.stopPropagation(); dom.dropdownMenu.style.display = dom.dropdownMenu.style.display === 'block' ? 'none' : 'block'; });
    dom.dropdownMenu.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'batch-delete') enterBatchDeleteMode();
        dom.dropdownMenu.style.display = 'none';
    });
    document.body.addEventListener('click', () => { if(dom.dropdownMenu.style.display === 'block') dom.dropdownMenu.style.display = 'none'; });
    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: 'New Character', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar); saveCharacters(); activeCharacterId = newChar.id; showScreen('characterEdit');
    });
    dom.cancelDeleteBtn.addEventListener('click', exitBatchDeleteMode);
    dom.deleteSelectedBtn.addEventListener('click', () => {
        const selectedCheckboxes = dom.characterList.querySelectorAll('.batch-delete-checkbox:checked');
        if (selectedCheckboxes.length === 0) { alert('请至少选择一个要删除的角色。'); return; }
        if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个角色吗？`)) {
            const idsToDelete = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.id));
            characters = characters.filter(char => !idsToDelete.includes(char.id));
            saveCharacters(); exitBatchDeleteMode();
        }
    });

    // Other listeners (Character Detail & Edit)
    dom.goToChatBtn.addEventListener('click', () => showScreen('chat'));
    dom.goToEditBtn.addEventListener('click', () => showScreen('characterEdit'));
    dom.characterEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // ... form submission logic ...
        showScreen('characterDetail');
    });

    // --- API Settings Form Listener (NEW) ---
    dom.apiSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const currentProvider = apiConfig.provider;
        
        // 从表单获取最新值
        apiConfig[currentProvider].baseUrl = document.getElementById('api-base-url').value.trim();
        apiConfig[currentProvider].apiKey = document.getElementById('api-key').value.trim();
        apiConfig[currentProvider].model = document.getElementById('api-model').value.trim();

        // 保存配置
        saveApiConfig();

        // 保存后返回上一页
        goBack();
    });

    // --- Initial Load ---
    const initialSetup = () => {
        loadCharacters();
        loadApiConfig(); // Modified
        
        const urlParams = new URLSearchParams(window.location.search);
        const startScreen = urlParams.get('start');
        showScreen(startScreen || 'home'); 
    };

    initialSetup();
});

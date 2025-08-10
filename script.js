// script.js (FINAL FIX)

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
        apiSettingsForm: document.getElementById('api-settings-form'),
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
    };

    let characters = [];
    let apiConfig = {};
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

    // --- API Config Management ---
    const loadApiConfig = () => {
        const saved = localStorage.getItem('aiChatApiConfig');
        if (saved) {
            apiConfig = JSON.parse(saved);
        } else {
            apiConfig = JSON.parse(JSON.stringify(DEFAULT_API_CONFIG));
        }
    };

    const saveApiConfig = () => {
        localStorage.setItem('aiChatApiConfig', JSON.stringify(apiConfig));
        alert('API 设置已保存！');
    };

    // --- Rendering ---
    const renderApiSettingsForm = () => {
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
        
        if (screenName === 'apiSettings') {
            renderApiSettingsForm();
        }
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop();
            const previousScreen = screenHistory[screenHistory.length - 1];
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
    
    // --- Home Screen Listeners (FIXED) ---
    // Direct listener for the "Add" button
    dom.addCharacterBtn.addEventListener('click', () => {
        const newChar = { id: Date.now(), name: 'New Character', subtitle: '', setting: '', avatar: '', history: [] };
        characters.push(newChar);
        saveCharacters();
        activeCharacterId = newChar.id;
        showScreen('characterEdit');
    });

    // Direct listener for the "Menu" button
    dom.menuBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevents the body click listener from firing immediately
        // Correctly toggles the display
        dom.dropdownMenu.style.display = dom.dropdownMenu.style.display === 'block' ? 'none' : 'block';
    });

    // Listener for the dropdown menu itself
    dom.dropdownMenu.addEventListener('click', (e) => {
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        const targetScreen = item.dataset.targetScreen;
        const action = item.dataset.action;

        if (targetScreen) {
            showScreen(targetScreen);
        } else if (action) {
            switch (action) {
                case 'batch-delete':
                    enterBatchDeleteMode();
                    break;
                case 'back':
                    goBack();
                    break;
                default:
                    break;
            }
        }
        
        dom.dropdownMenu.style.display = 'none'; // Hide menu after any action
    });

    // Listener to close dropdown when clicking outside
    document.body.addEventListener('click', () => { 
        if (dom.dropdownMenu.style.display === 'block') {
            dom.dropdownMenu.style.display = 'none';
        }
    });

    // Batch delete listeners
    dom.cancelDeleteBtn.addEventListener('click', exitBatchDeleteMode);
    dom.deleteSelectedBtn.addEventListener('click', () => {
        const selectedCheckboxes = dom.characterList.querySelectorAll('.batch-delete-checkbox:checked');
        if (selectedCheckboxes.length === 0) { alert('请至少选择一个要删除的角色。'); return; }
        if (confirm(`确定要删除选中的 ${selectedCheckboxes.length} 个角色吗？`)) {
            const idsToDelete = Array.from(selectedCheckboxes).map(cb => parseInt(cb.dataset.id));
            characters = characters.filter(char => !idsToDelete.includes(char.id));
            saveCharacters();
            exitBatchDeleteMode();
        }
    });

    // --- Other Screen Listeners ---
    dom.goToChatBtn.addEventListener('click', () => showScreen('chat'));
    dom.goToEditBtn.addEventListener('click', () => showScreen('characterEdit'));

    dom.characterEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // ... form submission logic ...
        showScreen('characterDetail');
    });

    dom.apiSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const currentProvider = apiConfig.provider;
        apiConfig[currentProvider].baseUrl = document.getElementById('api-base-url').value.trim();
        apiConfig[currentProvider].apiKey = document.getElementById('api-key').value.trim();
        apiConfig[currentProvider].model = document.getElementById('api-model').value.trim();
        saveApiConfig();
        goBack();
    });

    // --- Initial Load ---
    const initialSetup = () => {
        loadCharacters();
        loadApiConfig();
        
        const urlParams = new URLSearchParams(window.location.search);
        const startScreen = urlParams.get('start');
        showScreen(startScreen || 'home'); 
    };

    initialSetup();
});

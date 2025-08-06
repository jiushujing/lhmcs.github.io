document.addEventListener('DOMContentLoaded', () => {
    // This script should only run on app.html. If it's another page, do nothing.
    if (!document.getElementById('phone-container')) {
        return;
    }

    const dom = {
        // Screens
        homeScreen: document.getElementById('home-screen'),
        myDashboardScreen: document.getElementById('my-dashboard-screen'),
        characterDetailScreen: document.getElementById('character-detail-screen'),
        characterEditScreen: document.getElementById('character-edit-screen'),
        chatScreen: document.getElementById('chat-screen'),
        profileSettingsScreen: document.getElementById('profile-settings-screen'),
        apiSettingsScreen: document.getElementById('api-settings-screen'),
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
        editCharAvatar: document.getElementById('edit-char-avatar'),
        editCharAvatarUpload: document.getElementById('edit-char-avatar-upload'),
        editCharName: document.getElementById('edit-char-name'),
        editCharSubtitle: document.getElementById('edit-char-subtitle'),
        editCharSetting: document.getElementById('edit-char-setting'),
        deleteCharacterBtn: document.getElementById('delete-character-btn'),

        // Chat Screen
        chatHeaderTitle: document.getElementById('chat-header-title'),
        chatHistory: document.getElementById('chat-history'),
        chatForm: document.getElementById('chat-form'),
        chatInput: document.getElementById('chat-input'),
        
        // My Dashboard
        iconGrid: document.getElementById('icon-grid'),
        dashboardProfilePic: document.getElementById('dashboard-profile-pic'),
        dashboardUserName: document.getElementById('dashboard-user-name'),
        iconProfile: document.getElementById('icon-profile'),
        iconApi: document.getElementById('icon-api'),
        iconBackground: document.getElementById('icon-background'),
        iconEntertainment: document.getElementById('icon-entertainment'),
        iconMusic: document.getElementById('icon-music'),
        iconSliders: document.getElementById('icon-sliders'),
        opacitySlider: document.getElementById('opacity-slider'),
        brightnessSlider: document.getElementById('brightness-slider'),

        // Profile & API Settings Elements
        profileForm: document.getElementById('profile-form'),
        userNameInput: document.getElementById('user-name'),
        userSettingInput: document.getElementById('user-setting'),
        profilePic: document.getElementById('profile-pic'),
        profilePicUpload: document.getElementById('profile-pic-upload'),
        apiSettingsForm: document.getElementById('api-settings-form'),
        apiUrlInput: document.getElementById('api-url'),
        apiKeyInput: document.getElementById('api-key'),
        modelSelect: document.getElementById('model-select'),
        fetchModelsButton: document.getElementById('fetch-models-button'),
        btnOpenAI: document.getElementById('btn-openai'),
        btnGemini: document.getElementById('btn-gemini'),
        openaiModelsGroup: document.getElementById('openai-models'),
        geminiModelsGroup: document.getElementById('gemini-models'),

        // 悬浮球 (FAB)
        fabContainer: document.getElementById('fab-container'),
        fabToggleBtn: document.getElementById('fab-toggle-btn'),
        fabMenu: document.getElementById('fab-menu'),
    };

    let characters = [];
    let activeCharacterId = null;
    let isBatchDeleteMode = false;
    let currentApiType = 'openai';

    // --- Data Management ---
    const saveCharacters = () => localStorage.setItem('aiChatCharacters', JSON.stringify(characters));
    const loadCharacters = () => {
        const saved = localStorage.getItem('aiChatCharacters');
        characters = saved ? JSON.parse(saved) : [{ id: Date.now(), name: 'Helpful Assistant', subtitle: 'Your default AI companion.', setting: 'You are a helpful assistant.', avatar: '', history: [] }];
        if (!saved) saveCharacters();
        activeCharacterId = parseInt(sessionStorage.getItem('activeCharacterId')) || null;
    };

    // --- Rendering ---
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
                    showScreen('chat'); // 修改：选择角色后直接进入聊天
                });
            }
            item.innerHTML = content;
            dom.characterList.appendChild(item);
        });
    };

    // --- Navigation & State ---
    const showScreen = (screenName) => {
        if (isBatchDeleteMode && screenName !== 'home') exitBatchDeleteMode();
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        
        // 预处理
        if (screenName === 'characterDetail' && activeCharacterId) {
            const char = characters.find(c => c.id === activeCharacterId);
            dom.detailAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            dom.detailName.textContent = char.name;
        } else if (screenName === 'characterEdit' && activeCharacterId) {
            const char = characters.find(c => c.id === activeCharacterId);
            dom.editCharAvatar.src = char.avatar || 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
            dom.editCharName.value = char.name;
            dom.editCharSubtitle.value = char.subtitle || '';
            dom.editCharSetting.value = char.setting;
        } else if (screenName === 'chat' && activeCharacterId) {
            const char = characters.find(c => c.id === activeCharacterId);
            dom.chatHeaderTitle.textContent = char.name;
            renderChatHistory();
        }

        const screenMap = {
            home: dom.homeScreen, myDashboard: dom.myDashboardScreen, characterDetail: dom.characterDetailScreen,
            characterEdit: dom.characterEditScreen, chat: dom.chatScreen, apiSettings: dom.apiSettingsScreen,
            profileSettings: dom.profileSettingsScreen, backgroundSettings: dom.backgroundSettingsScreen,
            prompts: dom.promptsScreen, space: dom.spaceScreen
        };
        if (screenMap[screenName]) screenMap[screenName].classList.remove('hidden');
        if (screenName === 'home') renderCharacterList();
    };

    // --- Batch Delete Mode ---
    const enterBatchDeleteMode = () => { isBatchDeleteMode = true; dom.homeScreen.classList.add('batch-delete-active'); renderCharacterList(); };
    const exitBatchDeleteMode = () => { isBatchDeleteMode = false; dom.homeScreen.classList.remove('batch-delete-active'); renderCharacterList(); };

    // --- Background Settings Logic (未改变) ---
    // ... 此处省略未改变的背景设置代码 ...

    // --- Editable Label Settings (未改变) ---
    // ... 此处省略未改变的标签设置代码 ...

    // --- Event Listeners ---
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const currentScreen = btn.closest('.screen');
            const mainFabScreens = ['home-screen', 'my-dashboard-screen', 'space-screen', 'api-settings-screen', 'prompts-screen'];

            if (mainFabScreens.includes(currentScreen.id)) {
                // 从5个主功能页返回，都去聊天页
                showScreen('chat');
            } else if (currentScreen.id === 'chat-screen') {
                // 从聊天页返回，去角色列表页，方便切换角色
                showScreen('home');
            } else if (currentScreen.id === 'character-edit-screen') {
                // 从角色编辑页返回，去角色详情页
                showScreen('characterDetail');
            } else if (['profile-settings-screen', 'background-settings-screen'].includes(currentScreen.id)) {
                // 从“我的”中的子页面返回，回到“我的”桌面
                showScreen('myDashboard');
            } else {
                // 其他情况（如从角色详情页返回），都去角色列表
                showScreen('home');
            }
        });
    });

    // 悬浮球 (FAB) 交互逻辑
    dom.fabToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止点击事件冒泡到body
        dom.fabContainer.classList.toggle('active');
    });

    dom.fabMenu.addEventListener('click', (e) => {
        const targetButton = e.target.closest('.fab-button');
        if (targetButton) {
            const targetScreen = targetButton.dataset.targetScreen;
            showScreen(targetScreen);
        }
    });

    // 点击页面任何其他地方，收起悬浮球菜单
    document.getElementById('screen-container').addEventListener('click', () => {
        if (dom.fabContainer.classList.contains('active')) {
            dom.fabContainer.classList.remove('active');
        }
    });


    // Dashboard Icon Clicks (只保留非导航功能)
    dom.iconProfile.addEventListener('click', () => showScreen('profileSettings'));
    dom.iconApi.style.cursor = 'default';
    dom.iconMusic.addEventListener('click', () => alert('音乐功能正在开发中！'));
    dom.iconEntertainment.addEventListener('click', (e) => {
        if (e.target.classList.contains('entertainment-swatch')) { e.stopPropagation(); alert('娱乐功能正在开发中！'); }
    });
    dom.iconSliders.addEventListener('click', (e) => e.stopPropagation());
    dom.iconBackground.addEventListener('click', (e) => {
        if (e.target.closest('.bg-widget-bottom-left')) {
            showScreen('backgroundSettings');
        } else if (e.target.closest('.bg-widget-top') || e.target.closest('.bg-widget-bottom-right')) {
            alert('此功能待开发');
        }
    });

    // ... 此处省略其他未改变的监听器代码 (Editable Label, Menu, Character CRUD, Profile, API, Chat, Widget) ...

    // --- Initial Load ---
    loadCharacters();
    loadProfileSettings();
    loadApiSettings();
    loadWidgetSettings();
    loadLabelSettings();
    generateEntertainmentItems();
    loadBackgrounds();
    
    // 修改：初始加载逻辑
    if (activeCharacterId) {
        showScreen('chat'); // 如果有激活的角色，直接进入聊天
    } else {
        showScreen('home'); // 否则进入角色列表让用户选择
    }
});

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
            if (screenHistory.length > 10) screenHistory.shift(); // 限制历史记录大小
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
    };

    const goBack = () => {
        if (screenHistory.length > 1) {
            screenHistory.pop(); // 移除当前屏幕
            const previousScreen = screenHistory[screenHistory.length - 1];
            showScreen(previousScreen);
        }
    };

    // --- Event Listeners ---
    document.querySelectorAll('.back-button').forEach(btn => {
        btn.addEventListener('click', goBack);
    });
    
    // --- Draggable FAB & Panel Logic ---
    let isDragging = false;
    let wasDragged = false;
    let startX, startY;
    let initialFabX, initialFabY;
    const dragThreshold = 5;

    const onPointerDown = (e) => {
        if (e.target.closest('.panel-button')) return;
        if (e.button !== 0) return;
        
        isDragging = true;
        wasDragged = false;
        
        startX = e.clientX || e.touches[0].clientX;
        startY = e.clientY || e.touches[0].clientY;
        
        const fabRect = dom.fabWrapper.getBoundingClientRect();
        const containerRect = dom.phoneContainer.getBoundingClientRect();
        initialFabX = fabRect.left - containerRect.left;
        initialFabY = fabRect.top - containerRect.top;

        dom.fabWrapper.classList.add('dragging');
        e.preventDefault();

        window.addEventListener('pointermove', onPointerMove, { passive: false });
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('touchmove', onPointerMove, { passive: false });
        window.addEventListener('touchend', onPointerUp);
    };

    const onPointerMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();

        const currentX = e.clientX || e.touches[0].clientX;
        const currentY = e.clientY || e.touches[0].clientY;
        const dx = currentX - startX;
        const dy = currentY - startY;

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
        window.removeEventListener('touchmove', onPointerMove);
        window.removeEventListener('touchend', onPointerUp);

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
    dom.fabWrapper.addEventListener('touchstart', onPointerDown, { passive: false });

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

    // --- Initial Load ---
    const initialSetup = () => {
        loadCharacters();
        // ... Load other settings ...
        showScreen('home'); // 默认进入角色列表页
    };

    initialSetup();
});

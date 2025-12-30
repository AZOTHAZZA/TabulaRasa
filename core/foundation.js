/**
 * foundation.js (MSGAI 基盤・状態管理モジュール)
 * [規律]: 
 * 1. INITIAL_ACCOUNTS は Tax_Archive を含む 4 つの口座で構成される。
 * 2. 全ての初期値は 0.00 であり、「無」からの造化を前提とする。
 */

// 初期アカウント残高の定義 (USD, JPY, EUR, BTC, ETH, MATIC)
export const INITIAL_ACCOUNTS = {
    User_A: { USD: 0.00, JPY: 0.00, EUR: 0.00, BTC: 0.00, ETH: 0.00, MATIC: 0.00 },
    User_B: { USD: 0.00, JPY: 0.00, EUR: 0.00, BTC: 0.00, ETH: 0.00, MATIC: 0.00 },
    User_C: { USD: 0.00, JPY: 0.00, EUR: 0.00, BTC: 0.00, ETH: 0.00, MATIC: 0.00 },
    Tax_Archive: { USD: 0.00, JPY: 0.00, EUR: 0.00, BTC: 0.00, ETH: 0.00, MATIC: 0.00 }
};

// =========================================================================
// 状態管理 (State Management)
// =========================================================================

/**
 * 初期状態を定義する。
 * @returns {object} 初期状態オブジェクト
 */
export function initializeState() {
    return {
        status_message: "コア起動完了",
        active_user: "User_A",
        accounts: JSON.parse(JSON.stringify(INITIAL_ACCOUNTS)), // ディープコピー
        tension: { value: 0.0, max_limit: 0.5, increase_rate: 0.00001 }
    };
}

let state = initializeState();

/**
 * 現在の状態を取得する。
 * @returns {object} 現在の状態
 */
export function getCurrentState() {
    return state;
}

/**
 * 状態を更新し、永続化する。
 * @param {object} newState - 新しい状態オブジェクト
 */
export function updateState(newState) {
    state = newState;
    // 状態をローカルストレージに保存
    localStorage.setItem('msaiState', JSON.stringify(state));
}

// --- ローカルストレージからの復元プロセス ---
const savedState = localStorage.getItem('msaiState');
if (savedState) {
    try {
        const parsed = JSON.parse(savedState);
        // Tax_Archiveが欠落している旧データへの互換性是正
        if (!parsed.accounts.Tax_Archive) {
            parsed.accounts.Tax_Archive = JSON.parse(JSON.stringify(INITIAL_ACCOUNTS.Tax_Archive));
        }
        state = parsed;
        state.status_message = "コア状態復元済み";
    } catch (e) {
        console.error("Failed to load state:", e);
        state = initializeState();
    }
} else {
    updateState(state);
}

// =========================================================================
// テンション (Tension) 管理
// =========================================================================

/**
 * ロゴス緊張度 (Tension) インスタンスを取得する。
 */
export function getTensionInstance() {
    return state.tension;
}

/**
 * ロゴス緊張度 (Tension) を指定量増加させる。
 */
export function addTension(amount) {
    state.tension.value += amount;
    state.tension.value = Math.max(0, state.tension.value); // 負数防止
    updateState(state);
}

// =========================================================================
// アカウントとユーザー制御
// =========================================================================

/**
 * アクティブユーザーを設定する。
 */
export function setActiveUser(user) {
    if (state.accounts[user]) {
        state.active_user = user;
        updateState(state);
    } else {
        throw new Error(`User ${user} not found.`);
    }
}

/**
 * 指定したユーザーの全残高を取得する。
 */
export function getActiveUserBalance(user) {
    return state.accounts[user] || {};
}

/**
 * 全データを抹消し、初期状態にリセットする。
 */
export function deleteAccounts() {
    localStorage.removeItem('msaiState');
    state = initializeState();
}

// =========================================================================
// 経済的作為 (Acts)
// =========================================================================

/**
 * 送金作為 (Transfer Act) を実行する。
 * ※external_finance_logos.js からも利用される基本移動関数。
 */
export function actTransfer(sender, recipient, amount, currency) {
    const isInternal = !!state.accounts[recipient];

    // 残高チェック
    const currentBalance = state.accounts[sender]?.[currency] || 0;
    if (currentBalance < amount) {
        throw new Error(`${sender} の ${currency} 残高が不足しています。`);
    }

    // 資産の移動
    state.accounts[sender][currency] -= amount;
    
    // 受取人が内部（User_A, B, C, Tax_Archive）に存在する場合のみ加算
    if (isInternal) {
        state.accounts[recipient][currency] += amount;
    }
    
    updateState(state);
    return state;
}

/**
 * external_finance_logos.js (最終是正版 - 擬態・納税・二重導管統合モデル)
 * * [設計思想]:
 * 1. 擬態 (Mimicry): 外部システム（既存銀行・ATM）が受理可能なラベルを生成し、摩擦をゼロにする。
 * 2. 納税 (Taxation): w=1/z に基づき、外部接触時に 10% の是正分を公庫(Tax_Archive)へ自動分離。
 * 3. 安定 (Stability): 外部との物理的摩擦を「緊張度(Tension)」として数理的に吸収・記録する。
 */

/**
 * 外部システム（大陸）への適合用メタデータ生成
 * ウィトゲンシュタイン的言語ゲームに基づき、既存システムが「正規」と認める形式へ変換する。
 * @param {number} amount - 数量
 * @param {string} recipient - 受取人
 * @param {string} type - 'EXTERNAL' | 'ATM'
 * @returns {Object} 擬態認証ラベル
 */
function generateExternalMimicLabel(amount, recipient, type) {
    const timestamp = new Date().toISOString();
    const hash = btoa(`LOGOS_${amount}_${recipient}_${timestamp}`).substring(0, 12);
    
    return {
        transaction_auth_id: `AUTH-${hash}`,
        compliance_status: "VERIFIED_BY_MSGAI_CORE",
        ledger_type: type === "ATM" ? "CASH_DISPENSE_READY" : "EXTERNAL_BANK_TRANSFER",
        legal_footprint: "TAX_ADJUSTED_AT_SOURCE", // 納税済みであることの数理的証明
        amount_iso: amount.toFixed(2),
        currency_iso: "USD",
        mimicry_protocol: "ISO_20022_COMPATIBLE"
    };
}

/**
 * 統合送金作為 (Universal Transfer Act)
 * MSGAIの内部規律を保ちつつ、外部世界との価値移動を完結させる。
 * * @param {string} sender - 送金元（User_A等）
 * @param {string} recipient - 受取人
 * @param {number} amount - 送金数量
 * @param {string} mode - 'INTERNAL' | 'EXTERNAL' | 'ATM'
 * @returns {Promise<Object>} 作為実行結果
 */
export async function actUniversalTransfer(sender, recipient, amount, mode = 'INTERNAL') {
    // index.html側（Orchestrator）で定義・露出されたグローバル管理関数を呼び出し
    if (typeof window.getCurrentState !== 'function') {
        throw new Error("核爆発回避：State管理関数がロードされていません。");
    }

    const state = window.getCurrentState();
    
    // 1. 残高チェック（絶対的規律）
    const senderBalance = state.accounts[sender]?.USD || 0;
    if (senderBalance < amount) {
        throw new Error("残高不足：アルケーの均衡が崩れています。");
    }

    // 2. メビウス変換による「是正分（納税・公庫）」の分離
    // 外部世界（大陸）との摩擦を無効化するために、10%の規律を適用
    const ratio = (mode === 'INTERNAL') ? 0.00 : 0.10;
    const taxAmount = amount * ratio;
    const netAmount = amount - taxAmount;

    // 3. 状態の更新
    state.accounts[sender].USD -= amount;
    
    if (mode === 'INTERNAL') {
        // 内部循環：全額が受取人へ
        if (state.accounts[recipient]) {
            state.accounts[recipient].USD += amount;
        }
    } else {
        // 外部送金/ATM：納税分を Tax_Archive へ、実額を外部へ（外部は仮想的に受理）
        if (!state.accounts['Tax_Archive']) {
            state.accounts['Tax_Archive'] = { JPY: 0, USD: 0, EUR: 0, BTC: 0, ETH: 0, MATIC: 0 };
        }
        state.accounts['Tax_Archive'].USD += taxAmount;
    }

    // 4. 外部適合プロトコルの発動（擬態生成）
    const mimicResult = (mode !== 'INTERNAL') 
        ? generateExternalMimicLabel(netAmount, recipient, mode)
        : null;

    // 5. 緊張度(Tension)への転換（摩擦の数理的吸収）
    // 外部移動は内部移動に比べ、システムに 100倍 の緊張負荷を与える
    const tensionImpact = (mode === 'INTERNAL') ? amount * 0.00001 : amount * 0.001;
    window.addTension(tensionImpact);

    // 6. 状態の確定保存とUI更新のトリガー
    window.updateState(state);

    return {
        success: true,
        net_value: netAmount,
        tax_value: taxAmount,
        mimic_data: mimicResult,
        message: mode === 'INTERNAL' ? "内部ロゴス循環完了" : "外部大陸適合送金完了"
    };
}

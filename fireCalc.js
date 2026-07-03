/**
 * FIRE 反向记账计算器 - 厦门版
 * 作者: 你的名字
 * 说明: 根据用户财务状况和厦门社保政策，计算经济独立/提前退休的可持续天数。
 */

// ========== 厦门 2025 社保参数（最低档灵活就业） ==========
// 数据来源：厦门市人社局、税务局公告（2025年度），基数下限为全省全口径社平工资的60%
// 注意：政策可能调整，请以当年官方公布为准。
const XIAMEN_SOCIAL_SECURITY = {
    pensionBaseMin: 4212,      // 养老保险月最低缴费基数（元）-- 2025年预估
    pensionRate: 0.20,         // 灵活就业人员养老保险缴费比例
    medicalBaseMin: 4212,      // 医保月最低缴费基数（元）-- 同养老保险基数
    medicalRate: 0.10,         // 灵活就业人员医保缴费比例（含生育保险0.4%）
    unemploymentBenefit: 1827  // 失业金月标准（厦门最低工资2030*90%），最长领24个月
};

/**
 * 计算月度社保支出（若选择灵活就业续保）
 * @returns {number} 月社保总支出
 */
function calcMonthlySocialSecurity() {
    const pension = XIAMEN_SOCIAL_SECURITY.pensionBaseMin * XIAMEN_SOCIAL_SECURITY.pensionRate;
    const medical = XIAMEN_SOCIAL_SECURITY.medicalBaseMin * XIAMEN_SOCIAL_SECURITY.medicalRate;
    return Math.round(pension + medical); // 四舍五入到元
}

/**
 * 主计算函数
 * @param {Object} input - 用户输入
 * @param {number} input.currentSavings - 当前储蓄（元）
 * @param {number} input.monthlySalary - 当前税后月薪（元），若已辞职则填0
 * @param {number} input.monthlyPassiveIncome - 每月睡后收入（理财、房租等）（元）
 * @param {boolean} input.isEmployed - 是否仍在职（在职才有月薪）
 * @param {boolean} input.receivingUnemployment - 是否正在领取失业金
 * @param {boolean} input.payingFlexibleSocial - 是否以灵活就业身份续交社保
 * @param {number} input.monthlyBasicExpense - 每月基础生存支出（元）
 * @param {number} input.monthlyOtherExpense - 每月其他固定支出（元）
 * @returns {Object} 计算结果
 */
function calculateFIRE(input) {
    // 1. 月收入计算
    const salary = input.isEmployed ? input.monthlySalary : 0;
    const unemploymentIncome = input.receivingUnemployment ? XIAMEN_SOCIAL_SECURITY.unemploymentBenefit : 0;
    const totalMonthlyIncome = salary + input.monthlyPassiveIncome + unemploymentIncome;

    // 2. 月支出计算（含可能的社保续缴）
    const socialSecurityCost = input.payingFlexibleSocial ? calcMonthlySocialSecurity() : 0;
    const totalMonthlyExpense = input.monthlyBasicExpense + input.monthlyOtherExpense + socialSecurityCost;

    // 3. 月净流入（正值为增加储蓄，负值为消耗储蓄）
    const monthlyNetFlow = totalMonthlyIncome - totalMonthlyExpense;

    // 4. 计算经济自由可持续月数
    let sustainableMonths = Infinity; // 默认无限（如果净流入非负）
    let depletionDate = null;         // 储蓄耗尽日期

    if (monthlyNetFlow < 0) {
        // 负现金流：储蓄不断被消耗
        sustainableMonths = Math.floor(input.currentSavings / Math.abs(monthlyNetFlow));
        // 计算耗尽日期（从当前月份开始算）
        const now = new Date();
        const depletion = new Date(now.getFullYear(), now.getMonth() + sustainableMonths, now.getDate());
        depletionDate = depletion.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    // 5. 自由天数
    const freedomDays = sustainableMonths === Infinity ? '无限' : (sustainableMonths * 30).toFixed(0);

    return {
        monthlyNetFlow: monthlyNetFlow,
        sustainableMonths: sustainableMonths,
        freedomDays: freedomDays,
        depletionDate: depletionDate,
        breakdown: {
            totalIncome: totalMonthlyIncome,
            totalExpense: totalMonthlyExpense,
            salary: salary,
            passiveIncome: input.monthlyPassiveIncome,
            unemployment: unemploymentIncome,
            basicExpense: input.monthlyBasicExpense,
            otherExpense: input.monthlyOtherExpense,
            socialSecurity: socialSecurityCost
        }
    };
}

// 如果是在 Node 环境下导出（方便后续扩展）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateFIRE, calcMonthlySocialSecurity, XIAMEN_SOCIAL_SECURITY };
}
/**
 * 统一响应格式
 * @param {number} code - 状态码
 * @param {string} msg - 消息
 * @param {any} data - 数据
 * @returns {object} 响应对象
 */
function response(code, msg, data = null) {
    return {
        code,
        msg,
        data
    };
}

module.exports = {
    response,
};
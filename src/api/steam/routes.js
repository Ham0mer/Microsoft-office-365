const express = require('express');

const config = require('../../core/config');
const utils = require('../../core/utils');
const steamApi = require('../../core/steamApi');
const router = express.Router();

router.get('/profile/:steamid', async (req, res) => {
    const { steamid } = req.params;
    const result = await steamApi.getPlayerSummaries(config.steam_api_key, steamid);
    res.json(utils.response(0, '获取玩家信息成功', result));
});

router.get('/games/:steamid', async (req, res) => {
    const { steamid } = req.params;
    const result = await steamApi.getOwnedGames(config.steam_api_key, steamid);
    res.json(utils.response(0, '获取玩家游戏信息成功', result));
});

//steamid 和count 为可选参数如果count为空则默认为5
router.get('/recentlyplayed/:steamid/:count?', async (req, res) => {
    const { steamid } = req.params;
    const count = req.params.count || 5;
    const result = await steamApi.GetRecentlyPlayedGames(config.steam_api_key, steamid, count);
    res.json(utils.response(0, '获取玩家最近游玩游戏信息成功', result));
});

//GetPlayerAchievements
router.get('/achievements/:steamid/:appid', async (req, res) => {
    const { steamid, appid } = req.params;
    const result = await steamApi.GetPlayerAchievements(config.steam_api_key, steamid, appid);
    res.json(utils.response(0, '获取玩家成就信息成功', result));
});


//imageUrl2Base64
router.get('/imageurl2base64/:id', async (req, res) => {
    const { id } = req.params;
    const result = await steamApi.imageUrl2Base64(id);
    res.json(utils.response(0, '获取玩家游戏图片成功', result));
});

module.exports = router;
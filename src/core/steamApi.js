const axios = require('axios');

async function getPlayerSummaries(apiKey, steamIds) {
  const url = 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/';
  const steamids = Array.isArray(steamIds) ? steamIds.join(',') : steamIds;
  const { data } = await axios.get(url, {
    params: { key: apiKey, steamids }
  });
  return data.response.players;
}

//https://steamcommunity.com/profiles/${steamid}/ 模拟浏览器访问获取html
async function getSteamProfileHtml(steamid) {
  const url = `https://steamcommunity.com/profiles/${steamid}/`;
  const { data } = await axios.get(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36',
    },
  });
  return data;
}


async function getOwnedGames(apiKey, steamid) {
  const url = 'http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/';
  const { data } = await axios.get(url, {
    params: { key: apiKey, steamid:steamid }
  });
  return data.response.games;
}

async function GetRecentlyPlayedGames(apiKey, steamid, count) {
  const url = 'http://api.steampowered.com/IPlayerService/GetRecentlyPlayedGames/v1/';
  const { data } = await axios.get(url, {
    params: { key: apiKey, steamid:steamid, count:count }
  });
  return data.response.games;
}

async function GetPlayerAchievements(apiKey, steamid, appid) {
  const statsUrl = 'http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/';
  const { data: statsData } = await axios.get(statsUrl, {
    params: { key: apiKey, steamid: steamid, appid: appid, l: 'schinese' }
  });
  const playerstats = statsData.playerstats || { achievements: [] };
  const schemaUrl = 'https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/';
  const { data: schemaData } = await axios.get(schemaUrl, {
    params: { key: apiKey, appid: appid, l: 'schinese' }
  });
  const schemaAchievements = (schemaData?.game?.availableGameStats?.achievements) || [];
  const iconMap = new Map(schemaAchievements.map(a => [a.name, a.icon]));
  const achievements = playerstats.achievements || [];
  const achievementsWithIcon = achievements.map(a => ({
    ...a,
    iconUrl: iconMap.get(a.apiname) || null
  }));

  return {
    ...playerstats,
    achievements: achievementsWithIcon
  };
}




function getImage(id) {
  const url = `https://steamcdn-a.akamaihd.net/steam/apps/${id}/header.jpg`;
  return url;
}

async function imageUrl2Base64(id) {
  const imageUrl = getImage(id);
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary').toString('base64');
}


module.exports = { getPlayerSummaries, getSteamProfileHtml, getOwnedGames, GetRecentlyPlayedGames, imageUrl2Base64, GetPlayerAchievements };  

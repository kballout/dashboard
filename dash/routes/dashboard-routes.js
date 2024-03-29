const express = require('express');
const { validateGuild } = require('../modules/middleware');
const categories = require('../categories');
const router = express.Router();
const bot = require('../../bot');
const DB = require('../modules/mongodb');
let mongo = new DB()

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || DEF_DELAY));
  }

  //login
router.get('/dashboard', (req, res) => res.render('dashboard/dashboardIndex', {
    subtitle: 'Dashboard',
    categories,
}));

//choose server
router.get('/servers/:id', validateGuild, async (req, res) => {
    var guildExists = await mongo.checkIfExists(req.params.id);
    res.render('dashboard/show', {
        guildExists,
        subtitle: 'Dashboard',
        categories,
        key: res.cookies.get('key')
    })
})

//general settings
router.get('/servers/:id/general', validateGuild, async (req, res) => {
    var guildExists = await mongo.checkIfExists(req.params.id);
    if(!guildExists){
        res.render('dashboard/modules/general', {
            guildExists,
            subtitle: 'Settings',
            categories,
    
        })
    }
    else{
        let data = await mongo.getAllGeneralData(req.params.id);
        let storeIcons = await mongo.getStoreIcons(req.params.id);
        let conv1 = 'Off';
        let conv2 = 'Off';
        let conv3 = parseFloat(data['Exchange Rate']) * 100;
            switch(data['Automatic Monthly Bonus']){
                case true:
                    conv1 = 'true';
                    break;
                case false:
                    conv1 = 'false';
                    break;
            }
            
            switch(data['Reset Challenges Time']){
                case 10:
                    conv2 = '10AM';
                    break;
                case 11:
                    conv2 = '11AM';
                    break;
                case 12:
                    conv2 = '12PM';
                    break;
                case 13:
                    conv2 = '1PM';
                    break;
                case 14:
                    conv2 = '2PM';
                    break;
                case 15:
                    conv2 = '3PM';
                    break;
                case 16:
                    conv2 = '4PM';
                    break;
            }
        res.render('dashboard/modules/general', {
            guildExists,
            categories,
            data,
            conv1,
            conv2,
            conv3,
            storeIcons
        })
    }
    
})

//moderation
router.get('/servers/:id/moderation', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let badWordsList = await mongo.getBadWordsList(req.params.id);
    res.render('dashboard/modules/moderation', {
        guildExists,
        subtitle: 'Moderation',
        badWordsList
    })
})



//TEAMS
//lists all teams
router.get('/servers/:id/management', validateGuild, async (req, res) => {
    var guildExists = await mongo.checkIfExists(req.params.id);
    var allTeams = await mongo.getAllTeamData(req.params.id);
    res.render('dashboard/modules/management', {
        guildExists,
        subtitle: 'Teams',
        allTeams,
    })
})
//edit one team
router.get('/servers/:id/edit/:teamName', validateGuild, async (req, res) => {
    var guildExists = await mongo.checkIfExists(req.params.id);
    var team = await mongo.getOneTeam(req.params.id, req.params.teamName);
    res.render('dashboard/modules/team/editTeam', {
        team,
        subtitle: 'Edit Team',
        guildExists
    })
})
//create a team
router.get('/servers/:id/makeTeam', validateGuild, async (req, res) => {
    var guildExists = await mongo.checkIfExists(req.params.id);
    var allTeams = await mongo.getAllTeamData(req.params.id);
    await sleep(2000);
    res.render('dashboard/modules/team/createTeam', {
        allTeams,
        subtitle: 'Create Team',
        guildExists
    })
	
})
//delete team
router.get('/servers/:id/delete/:teamName', validateGuild, async (req, res) => {
    if (await mongo.checkTeamNameValid(req.params.id, req.params.teamName)){
        var guild = bot.guilds.cache.get(req.params.id);
        const channel = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')).find(x => x.rawPosition === 0);
        channel.send('~deleteteam ' + req.params.teamName);
        await sleep(2000);
        res.redirect('/servers/' + req.params.id + '/management');

    }
    else{
        res.render('errors/teamError.pug');
    }
	
})





//initialize activity
router.get('/servers/:id/initialize', validateGuild, async (req, res) => {
        var guild = bot.guilds.cache.get(req.params.id);
        const channel = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')).find(x => x.rawPosition === 0);
        channel.send('~initiate');
        await sleep(8000);
        res.redirect('/servers/' + req.params.id);
})

//terminate activity
router.get('/servers/:id/terminate', validateGuild, async (req, res) => {
    var guild = bot.guilds.cache.get(req.params.id);
    const channel = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')).find(x => x.rawPosition === 0);
    channel.send('~terminate');
    await sleep(10000);
    res.redirect('/servers/' + req.params.id);
})




//world event
router.get('/servers/:id/deactivateWorldEvent', validateGuild, async (req, res) => {
    await mongo.editWorldEvent(req.params.id, false);
    res.redirect('/servers/' + req.params.id + '/stores')
    
})
router.get('/servers/:id/activateWorldEvent', validateGuild, async (req, res) => {
    await mongo.editWorldEvent(req.params.id, true);
    res.redirect('/servers/' + req.params.id + '/stores')
})




//STORES
//get store lists
router.get('/servers/:id/stores', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let allStores = await mongo.getAllStoresData(req.params.id);
    let worldEvent = await mongo.getWorldEvent(req.params.id);
    res.render('dashboard/modules/stores', {
        guildExists,
        subtitle: 'Stores',
        allStores,
        worldEvent
    })
    
})
//get single item to edit
router.get('/servers/:id/editStore/:storeNum/:itemNumber', validateGuild, async (req, res) => {
    var store = req.params.storeNum;
    var guildExists = await mongo.checkIfExists(req.params.id);
    var item = await mongo.getItemData(req.params.id, store, req.params.itemNumber);
    res.render('dashboard/modules/store/editStore', {
        item,
        store,
        subtitle: 'Edit Store',
        guildExists
    })
    
})
//create item page
router.get('/servers/:id/makeItem/:storeNum', validateGuild, async (req, res) => {
    var store = req.params.storeNum;
    var item = await mongo.getStoreItemTotal(req.params.id, store);
    item++;
    res.render('dashboard/modules/store/makeItem', {
        item,
        subtitle: 'Create Item',
        store
    }) 
})
//delete item 
router.get('/servers/:id/delete/:storeNum/:itemNumber', validateGuild, async (req, res) => {
    await mongo.deleteItem(req.params.id, req.params.storeNum ,parseInt(req.params.itemNumber))

    res.redirect('/servers/' + req.params.id + '/stores');
    
})
//additional stores creation page
router.get('/servers/:id/createNewStore', validateGuild, async (req, res) => {
    var guildExists = await mongo.checkIfExists(req.params.id);
    var allStoreNames = await mongo.getAllStoreNames(req.params.id);
    res.render('dashboard/modules/store/createNewStore', {
        guildExists,
        subtitle: 'Stores',
        allStoreNames,
    })
    
})
//edit settings for additional store
router.get('/servers/:id/editAdditionalStore/:store', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let additionalStoreNames = await mongo.getAllStoreNames(req.params.id);
    removeMainStores(additionalStoreNames);
    let storeInfo = await mongo.getSingleStoreData(req.params.id, req.params.store);
    res.render('dashboard/modules/store/editAdditionalStore', {
        guildExists,
        subtitle: 'Stores',
        additionalStoreNames,
        storeInfo
    })
    
})
router.get('/servers/:id/deleteStore/:store', validateGuild, async (req,res) => {
    let options = await mongo.getAllCurrentOptions(req.params.id, req.params.store);
    let store2Info;
    let length;
    for(let i = 0; i < options.length; i++){
        store2Info = await mongo.getSingleStoreData(req.params.id, options[i]);
        length = await mongo.getStoreOptionsSize(req.params.id, req.params.store);
            for(let i = 0; i < length; i++){
                console.log(options[i] + 'remove')
                if(req.params.store === store2Info[0].Options[i]){
                    mongo.removeStoreOption(req.params.id, options[i], req.params.store, i);
                }
            }
    }
    await mongo.deleteStore(req.params.id, req.params.store)
    res.redirect('/servers/' + req.params.id + '/Stores')
})



//programs
router.get('/servers/:id/programs', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let programs = await mongo.getAllProgramData(req.params.id);
    res.render('dashboard/modules/programs', {
        guildExists,
        programs,
        subtitle: 'Programs'
    })
    
})
//edit program
router.get('/servers/:id/editprogram/:program', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let program = await mongo.getOneProgram(req.params.id, req.params.program);
    let num = req.params.program;
    res.render('dashboard/modules/programs/editProgram', {
        guildExists,
        program,
        num,
        subtitle: 'Edit Program'

    })
    
})
//create program
router.get('/servers/:id/createprogram', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let programs = await mongo.getAllProgramData(req.params.id);
    let total = programs['Total Programs'];
    total++;
    res.render('dashboard/modules/programs/createprogram', {
        guildExists,
        programs,
        total,
        subtitle: 'Create Program'
    })
    
})
//delete program
router.get('/servers/:id/deleteprogram/:program', validateGuild, async (req, res) => {
    await mongo.deleteProgram(req.params.id, parseInt(req.params.program));
    res.redirect('/servers/' + req.params.id + '/programs');
    
})


//Emblems
//get all emblems
router.get('/servers/:id/emblems', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let emblems = await mongo.getAllEmblemInfo(req.params.id);
    res.render('dashboard/modules/emblems', {
        guildExists,
        emblems,
        subtitle: 'Emblems'
    })
})
//edit emblem
router.get('/servers/:id/editEmblem/:emblemName', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let emblem = await mongo.getOneEmblem(req.params.id, req.params.emblemName);
    let double = false;
    if(emblem['Name'] === 'Total Points' || emblem['Name'] === 'Total Exchange' || emblem['Name'] === 'Donated Points'){
        double = true;
    }
    res.render('dashboard/modules/emblem/editEmblem', {
        guildExists,
        emblem,
        double,
        subtitle: 'Edit Emblem'
    })
})



//leaderboards
router.get('/servers/:id/stats', validateGuild, async (req, res) => {
    let guildExists = await mongo.checkIfExists(req.params.id);
    let loggedIn = true;
    var users = [];
    let allUserIDs = await mongo.getAllUsers(req.params.id);
    let nextUser = {};

    for(var i = 0; i < allUserIDs.length; i++){
        
        nextUser = {
            'username': await mongo.getUserName(req.params.id, allUserIDs[i]['User ID']),
            'discriminator': await mongo.getUserDiscriminator(req.params.id, allUserIDs[i]['User ID']),
            'currentPoints': await mongo.getUserCurrPoints(req.params.id, allUserIDs[i]['User ID']),
            'totalPoints': await mongo.getUserTotalPoints(req.params.id, allUserIDs[i]['User ID']),
            'avatarUrl': await mongo.getUserAvatar(req.params.id, allUserIDs[i]['User ID']),
            'monthlyPoints': await mongo.getUserMonthlyPoints(req.params.id, allUserIDs[i]['User ID']),
            'totalExchange': await mongo.getUserTotalExchange(req.params.id, allUserIDs[i]['User ID']),
            'monthlyExchange': await mongo.getUserMonthlyExchange(req.params.id, allUserIDs[i]['User ID']),
            'highestStreak': await mongo.getUserHighestStreak(req.params.id, allUserIDs[i]['User ID']),
            'attendance': await mongo.getUserTotalAttendance(req.params.id, allUserIDs[i]['User ID']),
            'level': await mongo.getUserLevel(req.params.id, allUserIDs[i]['User ID']),
            'xp': await mongo.getUserXP(req.params.id, allUserIDs[i]['User ID']),
            'messages': await mongo.getUserTotalMsg(req.params.id, allUserIDs[i]['User ID']),
        }
        nextUser['untilNextLevel'] = 5 * Math.pow(nextUser['level'], 2) + 50 * nextUser['level'] + 100,
        users.push(nextUser);
    }
    
    res.render('dashboard/modules/leaderboards', {
        guildExists,
        loggedIn,
        users,
        subtitle: 'Leaderboards'
    })
    
})




//POST requests
router.post('/servers/:id/general', (req, res) => {
    for (let [key, value] of Object.entries(req.body)) {
        if(key === 'exchange'){
            mongo.changeExchangeRate(req.params.id, parseFloat(value) / 100);
        }
        if(key === 'maxOffenses'){
            mongo.changeMaxOffenses(req.params.id, parseInt(value));
        }
        if(key === 'dailyChallenges'){
            mongo.changeDailyChallenges(req.params.id, parseInt(value));
        }
        if(key === 'offensesBonus'){
            mongo.changeBonusAmount(req.params.id, parseFloat(value), 'Offenses Bonus');
        }
        if(key === 'exchangeBonus'){
            mongo.changeBonusAmount(req.params.id, parseFloat(value), 'Exchange Bonus');
        }
        if(key === 'pointsBonus'){
            mongo.changeBonusAmount(req.params.id, parseFloat(value), 'Points Bonus');
        }
        if(key === 'streakBonus'){
            mongo.changeBonusAmount(req.params.id, parseFloat(value), 'Streak Bonus');
        }
        if(key === 'level1Buyer'){
            mongo.changeLevel1Buyer(req.params.id, parseInt(value));
        }
        if(key === 'level2Buyer'){
            mongo.changeLevel2Buyer(req.params.id, parseInt(value));
        }
        if(key === 'level3Buyer'){
            mongo.changeLevel3Buyer(req.params.id, parseInt(value));
        }
        
      }
    res.redirect('back');
})

router.post('/servers/:id/time', (req, res) => {
    var guild = bot.guilds.cache.get(req.params.id);
    
    const channel = guild.channels.cache.filter(ch => ch.name === 'bot-messages' && ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')).first();
    
    for (let [key, value] of Object.entries(req.body)) {
        if(key === 'automaticMonthlyBonus'){
            let conv1 = value;
            let result;
            if(conv1 === true){
                result = 'on';
            }
            else{
                result = 'off';
            }
            mongo.changeBonusDaySchedule(req.params.id, conv1);
        }
        if(key === 'challengesScheduleTime'){
            var conv2 = -1;
            switch(value){
                case 'tenAM':
                    conv2 = 10;
                    break;
                case 'elevenAM':
                    conv2 = 11;
                    break;
                case 'twelvePM':
                    conv2 = 12;
                    break;
                case 'onePM':
                    conv2 = 13;
                    break;
                case 'twoPM':
                    conv2 = 14;
                    break;
                case 'threePM':
                    conv2 = 15;
                    break;
                case 'fourPM':
                    conv2 = 16;
                    break;
            }
            channel.send('~changedailyresettime ' + conv2);
            mongo.changeChallengesResetTime(req.params.id, conv2);
        }

        if(key === 'boostTimeLimit'){
            var conv3
            switch(value){
                case 'oneHR':
                    conv3 = 1
                    break;
                case 'twoHRs':
                    conv3 = 2;
                    break;
                case 'threeHRs':
                    conv3 = 3;
                    break;
                case 'fourHRs':
                    conv3 = 4;
                    break;
                case 'fiveHRs':
                    conv3 = 5;
                    break;
                case 'sixHRs':
                    conv3 = 6;
                    break;
            }
            mongo.changeBoostTimeLimit(req.params.id, conv3);
        }
        
      }
    res.redirect('back');
})

router.post('/servers/:id/rankM', (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'equalRank'){
            mongo.changeMultipliers(req.params.id, 'rank', 'equal', parseFloat(value));
        }
        if(key === 'oneHigherRank'){
            mongo.changeMultipliers(req.params.id, 'rank', 'oneHigherRank', parseFloat(value));

        }
        if(key === 'twoHigherRanks'){
            mongo.changeMultipliers(req.params.id, 'rank', 'twoHigherRanks', parseFloat(value));

        }
        if(key === 'oneLowerRank'){
            mongo.changeMultipliers(req.params.id, 'rank', 'oneLowerRank', parseFloat(value));

        }
        if(key === 'twoLowerRanks'){
            mongo.changeMultipliers(req.params.id, 'rank', 'twoLowerRanks', parseFloat(value));

        }
    }
    
    res.redirect('back');
})

router.post('/servers/:id/tierM', (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'equalTier'){
            mongo.changeMultipliers(req.params.id, 'Tier', 'equal', parseFloat(value));
        }
        if(key === 'oneHigherTier'){
            mongo.changeMultipliers(req.params.id, 'Tier', 'oneHigherTier', parseFloat(value));

        }
        if(key === 'twoHigherTiers'){
            mongo.changeMultipliers(req.params.id, 'Tier', 'twoHigherTiers', parseFloat(value));

        }
        if(key === 'oneLowerTier'){
            mongo.changeMultipliers(req.params.id, 'Tier', 'oneLowerTier', parseFloat(value));

        }
        if(key === 'twoLowerTiers'){
            mongo.changeMultipliers(req.params.id, 'Tier', 'twoLowerTiers', parseFloat(value));

        }
    }
    
    res.redirect('back');
})

router.post('/servers/:id/teamM', (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'equalTeam'){
            mongo.changeMultipliers(req.params.id, 'Team', 'equal', parseFloat(value));
        }
        if(key === 'oneHigherTeam'){
            mongo.changeMultipliers(req.params.id, 'Team', 'oneHigherTeam', parseFloat(value));

        }
        if(key === 'twoHigherTeams'){
            mongo.changeMultipliers(req.params.id, 'Team', 'twoHigherTeams', parseFloat(value));

        }
        if(key === 'oneLowerTeam'){
            mongo.changeMultipliers(req.params.id, 'Team', 'oneLowerTeam', parseFloat(value));

        }
        if(key === 'twoLowerTeams'){
            mongo.changeMultipliers(req.params.id, 'Team', 'twoLowerTeams', parseFloat(value));

        }
    }
    
    res.redirect('back');
})

router.post('/servers/:id/icons', (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'matchIcon'){
            mongo.changeIcon(req.params.id, 'matchIcon', value);
        }
        if(key === 'bossIcon'){
            mongo.changeIcon(req.params.id, 'bossIcon', value);
        }
        if(key === 'bossWinIcon'){
            mongo.changeIcon(req.params.id, 'bossWinIcon', value);
        }
        if(key === 'bossLossIcon'){
            mongo.changeIcon(req.params.id, 'bossLossIcon', value);
        }
        if(key === 'store1Icon'){
            mongo.changeIcon(req.params.id, 'store1Icon', value);
        }
        if(key === 'store2Icon'){
            mongo.changeIcon(req.params.id, 'store2Icon', value);
        }
        if(key === 'store3Icon'){
            mongo.changeIcon(req.params.id, 'store3Icon', value);
        }
        if(key === 'teamStoreIcon'){
            mongo.changeIcon(req.params.id, 'teamStoreIcon', value);
        }
    }
    
    res.redirect('back');
})




//words
router.post('/servers/:id/words', (req, res) => {
    
    let str = JSON.stringify(req.body['textArea']).replace(/^"|"$/g, '').split(',');
    str = str.filter(function(stri) {
        return /\S/.test(stri);
    });
    let data = {};
    for(var i = 0; i < str.length; i++){
        data[i] = str[i];
    }
    mongo.setBadWordsList(req.params.id, data);
    
    res.redirect('/servers/' + req.params.id);
})




//teams
router.post('/servers/:id/edit/:teamName', (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'teamPoints'){
            mongo.updateTeamPoints(req.params.id, req.params.teamName, parseFloat(value));
        }
        if(key === 'teamTier'){
            mongo.updateTeamTier(req.params.id, req.params.teamName, parseInt(value));
        }
        if(key === 'teamFlag'){
            var url = value
            if(value === 'none'){
                var url = 'https://drive.google.com/thumbnail?id='
            }
            mongo.updateTeamFlag(req.params.id, req.params.teamName, url);
        }
        
    }
    
    res.redirect('/servers/' + req.params.id + '/management');
})

router.post('/servers/:id/makeTeam', async (req, res) => {
    var value = req.body['teamName'];
    value = value[0].toUpperCase() + value.slice(1).toLowerCase();
   if (await mongo.checkTeamNameValid(req.params.id, value) === null){
        var guild = bot.guilds.cache.get(req.params.id);
        const channel = guild.channels.cache.filter(ch => ch.type === 'GUILD_TEXT' && ch.permissionsFor(guild.me).has('SEND_MESSAGES')).find(x => x.rawPosition === 0);
        channel.send('~createteam ' + value);
        await sleep(2000);
        res.redirect('/servers/' + req.params.id + '/management');
         
   }
   else{
       res.render('errors/teamError.pug');
   }
})


//World event
router.post('/servers/:id/worldEvent', async (req,res) => {
    console.log(req.body);
    await mongo.changeWorldEventCost(req.params.id, parseFloat(req.body['cost']))
    res.redirect('/servers/' + req.params.id + '/stores');
})


//edit item 
router.post('/servers/:id/editStore/:storeNum/:itemNum', (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'itemName'){
            mongo.updateItemName(req.params.id, req.params.storeNum, req.params.itemNum, value);
        }
        if(key === 'itemQuantity'){
            mongo.updateItemQuantity(req.params.id, req.params.storeNum, req.params.itemNum, parseInt(value));
        }
        if(key === 'itemCost'){
            mongo.updateItemCost(req.params.id, req.params.storeNum, req.params.itemNum, parseFloat(value));
        }
        if(key === 'available'){
            mongo.updateItemAvailable(req.params.id, req.params.storeNum, req.params.itemNum, value);
        }
        
    }
    res.redirect('/servers/' + req.params.id + '/stores');
})
//create item function
router.post('/servers/:id/makeItem/:storeNum/:itemNum', async (req, res) => {
    await mongo.createNewItem(req.params.id, req.params.storeNum, req.params.itemNum, 
    req.body['itemName'], 
    parseInt(req.body['itemQuantity']), 
    parseFloat(req.body['itemCost']), 
    req.body['available']);
    
    res.redirect('/servers/' + req.params.id + '/stores');
})

//create a new additional store
router.post('/servers/:id/createNewStore', async (req, res) => {
    let roleName = capitalizeTheFirstLetterOfEachWord(req.body.storeName);
    let roleID;
    let storeID;
    let guild = bot.guilds.cache.get(req.params.id);
    

    //Create role
    await guild.roles.create({name: roleName + ' Buyer', color: 'BLUE'}).then(role => {
        roleID = role.id;
    })

    let mutedID = guild.roles.cache.find(r => r.name === 'Muted').id;
    let adminID = guild.roles.cache.find(r => r.name === 'Game Admin').id;
    let category = guild.channels.cache.find(c => c.name === 'MMO Stores' && c.type === 'GUILD_CATEGORY');
    
    //Create channel
    await guild.channels.create(roleName, {
        type: 'GUILD_TEXT'
    }).then(channel => {
        channel.setParent(category.id)
        storeID = channel.id;
        channel.permissionOverwrites.set([
            {
                id: mutedID,
                deny: ['SEND_MESSAGES']
            },
            {
                id: roleID,
                deny: ['SEND_MESSAGES', 'MANAGE_MESSAGES'],
                allow: ['VIEW_CHANNEL', 'ADD_REACTIONS']
            },
            {
                id: adminID,
                deny: ['SEND_MESSAGES', 'MANAGE_MESSAGES', 'MANAGE_CHANNELS'],
                allow: ['VIEW_CHANNEL', 'ADD_REACTIONS']
            },
            {
                id: guild.roles.everyone.id,
                deny: ['VIEW_CHANNEL'],
            }
        ])
    })

    //Add to database
    mongo.createNewAdditionalStore(req.params.id, roleName, storeID, parseInt(req.body.levelRequired), roleID);
    res.redirect('/servers/' + req.params.id + '/stores');
})

//edit additional store settings
router.post('/servers/:id/editAdditionalStore/:store', async (req, res) => {
    let length = await mongo.getStoreOptionsSize(req.params.id, req.params.store);

    for (let [key, value] of Object.entries(req.body)){
        if(key === 'levelRequired' && value != ''){
            mongo.updateStoreLevelRequired(req.params.id, req.params.store, parseInt(value));
        }
        else if(key === 'storeIcon' && value !== ''){
            mongo.updateStoreIcon(req.params.id, req.params.store, value);
        }
        else if(key === 'checkedBoxes' && value !== '' && value !== 'undefined'){
            let length2;
            let changes = value.split(',');
            let changeSplit;
            for(let change of changes){
                changeSplit = change.split('\t');
                length2 = await mongo.getStoreOptionsSize(req.params.id, changeSplit[0]);
                if(changeSplit[1] === 'On'){
                    mongo.addStoreOption(req.params.id, req.params.store, changeSplit[0], length);
                    length++;
                    mongo.addStoreOption(req.params.id, changeSplit[0], req.params.store, length2);
                }
                else{
                    await mongo.removeStoreOption(req.params.id, req.params.store, changeSplit[0]);
                    await mongo.updateOptionNumbers(req.params.id, req.params.store);
                    await mongo.removeStoreOption(req.params.id, changeSplit[0], req.params.store);
                    await mongo.updateOptionNumbers(req.params.id, changeSplit[0]);
                }
            }
        }
    }
    res.redirect('/servers/' + req.params.id + '/Stores')  
})



//create program function
router.post('/servers/:id/createprogram/:program', async (req, res) => {
    let name = capitalizeTheFirstLetterOfEachWord(req.body['programName']);
    let data = await mongo.getAllProgramData(req.params.id);
    let isValid = true;
    for(let i = 1; i < data['Total Programs']; i++){
        if(name === data['Programs']['Program ' +  i]['Name']){
            isValid = false;
            break;
        }
    }
    if(isValid){
        let bonusType;
        if(req.body['programBonusType'] === 'noBonus'){
            bonusType = 0;
        }
        else if(req.body['programBonusType'] === 'fullAttendance'){
            bonusType = 1;
        }
        else if(req.body['programBonusType'] === 'partialAttendance'){
            bonusType = 2;
        }
    
        await mongo.createNewProgram(req.params.id, parseInt(req.params.program), name, parseFloat(req.body['programFactor']), bonusType, parseFloat(req.body['programBonusAmount']))
        await mongo.updateProgramForAllUsers(req.params.id, name);
        res.redirect('/servers/' + req.params.id + '/programs');
    }
    else{
        res.render('errors/progError');
    }
    
})

//edit program function
router.post('/servers/:id/editprogram/:program', async (req, res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'programFactor'){
            await mongo.updateProgFactor(req.params.id, req.params.program, parseFloat(value));
        }
        if(key === 'programBonusType'){
            let bonusType;
            if(value === 'noBonus'){
                bonusType = 0;
            }
            else if(value === 'fullAttendance'){
                bonusType = 1;
            }
            else if(value === 'partialAttendance'){
                bonusType = 2;
            }
            await mongo.updateProgBonusType(req.params.id, req.params.program, bonusType);
        }
        if(key === 'programBonusAmount'){
            await mongo.updateProgBonusAmount(req.params.id, req.params.program, parseFloat(value));
        }
        
    }
    res.redirect('/servers/' + req.params.id + '/programs');

    
})


//edit emblem info
router.post('/servers/:id/editEmblem/:emblem', async (req,res) => {
    for (let [key, value] of Object.entries(req.body)){
        if(key === 'emblemTitle'){
            await mongo.editEmblemTitle(req.params.id, req.params.emblem, value);
        }
        if(key === 'emblemAmount'){
            await mongo.editEmblemAmount(req.params.id, req.params.emblem, parseFloat(value));
        }
    }
    res.redirect('/servers/' + req.params.id + '/emblems');
})


function capitalizeTheFirstLetterOfEachWord(words) {
    let separateWord = words.toLowerCase().split(' ');
    for (var i = 0; i < separateWord.length; i++) {
       separateWord[i] = separateWord[i].charAt(0).toUpperCase() +
       separateWord[i].substring(1);
    }
    return separateWord.join(' ');
 }

 function removeMainStores(additionalStoreNames){
    for(let i = 0; i < additionalStoreNames.length; i++){
        if(additionalStoreNames[i].Name === 'Store 1' || additionalStoreNames[i].Name === 'Store 2' || 
            additionalStoreNames[i].Name === 'Store 3' || additionalStoreNames[i].Name === 'Team Store'){
            additionalStoreNames.splice(i, 1);
            i = -1;
        }
    }
 }

module.exports = router;
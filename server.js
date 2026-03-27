const express = require('express');
const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const session = require('express-session');
const path = require('path');
const app = express();

// Настройки
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.static('public'));
app.use(session({ secret: 'toxic_green', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

// ТЕСТОВЫЙ РЕЖИМ (Пока нет ключа, логинимся как админ)
let users = {};
let liveDrops = [];
let withdraws = [];

const ITEMS = [
    { id: 1, name: 'Knife | Gamma Doppler', price: 50000, rarity: 'gold', chance: 0.5, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 2, name: 'AK-47 | Ice Coaled', price: 1500, rarity: 'classified', chance: 15, img: 'https://community.akamai.steamstatic.com' },
    { id: 3, name: 'P250 | Sand Dune', price: 10, rarity: 'mil-spec', chance: 84.5, img: 'https://community.akamai.steamstatic.com' }
];

// Роуты
app.get('/', (req, res) => res.render('index', { user: req.session.user || null, items: ITEMS, drops: liveDrops }));

// Эмуляция входа (Для теста на Render)
app.get('/auth/steam', (req, res) => {
    req.session.user = { id: '765', name: 'ADMIN_GREEN', avatar: 'https://avatars.githubusercontent.com', balance: 10000, inventory: [] };
    res.redirect('/');
});

// ЛОГИКА КЕЙСА
app.post('/open', (req, res) => {
    if (!req.session.user || req.session.user.balance < 100) return res.json({ error: 'Баланс!' });
    
    let rand = Math.random() * 100, cum = 0, win = ITEMS[ITEMS.length-1];
    for (let i of ITEMS) { cum += i.chance; if (rand <= cum) { win = i; break; } }
    
    req.session.user.balance -= 100;
    const drop = { ...win, iid: Date.now() };
    req.session.user.inventory.push(drop);
    liveDrops.unshift(drop);
    if(liveDrops.length > 15) liveDrops.pop();
    
    res.json({ win: drop, balance: req.session.user.balance });
});

// АПГРЕЙД
app.post('/upgrade', (req, res) => {
    const { userItemIid, targetId } = req.body;
    const user = req.session.user;
    const target = ITEMS.find(i => i.id == targetId);
    const item = user.inventory.find(i => i.iid == userItemIid);

    if(!item || !target) return res.json({ error: 'Ошибка' });

    const chance = (item.price / target.price) * 100;
    const roll = Math.random() * 100;

    user.inventory = user.inventory.filter(i => i.iid != userItemIid);
    if(roll <= chance) {
        user.inventory.push({...target, iid: Date.now()});
        res.json({ success: true, chance });
    } else {
        res.json({ success: false, chance });
    }
});

app.listen(process.env.PORT || 3000);

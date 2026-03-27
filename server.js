const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');
app.use(express.json());
app.use(session({ secret: 'toxic_pro_ultra', resave: true, saveUninitialized: true }));

// БАЗА ВСЕХ ПРЕДМЕТОВ (Полные ссылки на фото)
const ITEMS = [
    { id: 1, name: 'M9 Bayonet | Gamma Doppler', price: 95000, rarity: 'gold', chance: 0.5, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 2, name: 'AK-47 | Inheritance', price: 12500, rarity: 'covert', chance: 2, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 3, name: 'USP-S | Kill Confirmed', price: 4500, rarity: 'classified', chance: 10, img: 'https://community.cloudflare.steamstatic.com' },
    { id: 4, name: 'P250 | Sand Dune', price: 15, rarity: 'mil-spec', chance: 87.5, img: 'https://community.cloudflare.steamstatic.com' }
];

// КЕЙСЫ (15 ШТУК)
const CASES = {
    'gamma': { name: 'GAMMA', price: 89, img: 'https://case-battle.vip', items: ITEMS },
    'kilowatt': { name: 'KILOWATT', price: 199, img: 'https://case-battle.vip', items: ITEMS },
    '007': { name: '007', price: 349, img: 'https://case-battle.vip', items: ITEMS },
    'silver': { name: 'SILVER', price: 49, img: 'https://case-battle.vip', items: ITEMS },
    'recoil': { name: 'RECOIL', price: 125, img: 'https://case-battle.vip', items: ITEMS },
    'revolution': { name: 'REVOLUTION', price: 189, img: 'https://case-battle.vip', items: ITEMS },
    'snakebite': { name: 'SNAKEBITE', price: 95, img: 'https://case-battle.vip', items: ITEMS },
    'fracture': { name: 'FRACTURE', price: 75, img: 'https://case-battle.vip', items: ITEMS },
    'prism': { name: 'PRISMA', price: 65, img: 'https://case-battle.vip', items: ITEMS },
    'horizon': { name: 'HORIZON', price: 110, img: 'https://case-battle.vip', items: ITEMS },
    'danger': { name: 'DANGER', price: 80, img: 'https://case-battle.vip', items: ITEMS },
    'clutch': { name: 'CLUTCH', price: 130, img: 'https://case-battle.vip', items: ITEMS },
    'chroma': { name: 'CHROMA', price: 210, img: 'https://case-battle.vip', items: ITEMS },
    'bravo': { name: 'BRAVO', price: 5500, img: 'https://case-battle.vip', items: ITEMS },
    'dreams': { name: 'DREAMS', price: 120, img: 'https://case-battle.vip', items: ITEMS }
};

let liveDrops = [];

app.get('/', (req, res) => res.render('index', { user: req.session.user || null, cases: CASES, drops: liveDrops }));

app.get('/auth/steam', (req, res) => {
    req.session.user = { name: 'ADMIN_TOXIC', balance: 5000, inventory: [], xp: 0, lvl: 1 };
    res.redirect('/');
});

app.post('/open/:id', (req, res) => {
    const c = CASES[req.params.id];
    const user = req.session.user;
    if (!user || user.balance < c.price) return res.json({ error: 'Баланс!' });
    let rand = Math.random() * 100, cum = 0, win = c.items[c.items.length-1];
    for (let i of c.items) { cum += i.chance; if (rand <= cum) { win = i; break; } }
    user.balance -= c.price;
    user.xp += Math.floor(c.price / 10);
    if(user.xp >= 1000) { user.lvl++; user.xp = 0; }
    const drop = { ...win, iid: Date.now() };
    user.inventory.push(drop);
    liveDrops.unshift(drop);
    res.json({ win: drop, balance: user.balance, xp: user.xp, lvl: user.lvl });
});

app.post('/sell', (req, res) => {
    const { iid } = req.body;
    const user = req.session.user;
    const idx = user.inventory.findIndex(i => i.iid == iid);
    if (idx > -1) {
        user.balance += Math.floor(user.inventory[idx].price * 0.8);
        user.inventory.splice(idx, 1);
        return res.json({ success: true, balance: user.balance });
    }
    res.json({ error: "Ошибка" });
});

app.listen(process.env.PORT || 3000);
